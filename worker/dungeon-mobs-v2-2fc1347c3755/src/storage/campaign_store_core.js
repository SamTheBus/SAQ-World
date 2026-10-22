import { canonicalStringify, closedRecord, freezeWire, requireContract } from "../shared/contracts/wire.js";
import { validateId } from "../shared/contracts/identities.js";
import { hashBytes, bytesToHex, utf8 } from "../shared/contracts/hashing.js";

// Adapters may propagate this only after proving that this payload cannot commit.
export class TransactionPayloadConflictError extends TypeError {
  constructor() { super("Transaction ID reused with different payload"); }
}

export class DurableIdentityConflictError extends TypeError {
  constructor(kind) {
    super(`Durable ${kind} already reserved`);
    this.identityKind = kind;
  }
}

// One transaction decision kernel; codecs select explicit, incompatible state formats.
export function createCampaignStoreTransactions({ validateTransactionProposal, validateCampaignEnvelope,
  validateCheckpointTransition, serializeCampaignEnvelope, verifyPersistedEnvelope, reservationIdentities }) {
  function requiredIdentityReservations(prepared) {
    const { proposal, proposalHash } = prepared;
    const identities = reservationIdentities(proposal);
    return identities.map(({ identityKind, identityId }) => freezeWire({
      identityKind, identityId, transactionId: proposal.transactionId, proposalHash,
    }));
  }

  function validateIdentityReservation(record, expected) {
    closedRecord(record, ["identityKind", "identityId", "transactionId", "proposalHash"]);
    requireContract(record.identityKind === expected.identityKind && record.identityId === expected.identityId,
      "Identity reservation key/value mismatch");
    validateId(record.identityKind, record.identityId);
    validateId("transactionId", record.transactionId);
    requireContract(typeof record.proposalHash === "string" && /^[0-9a-f]{64}$/.test(record.proposalHash),
      "Invalid identity reservation proposal hash");
    return record;
  }

  async function prepareTransaction(proposal, options) {
    validateTransactionProposal(proposal);
    const frozen = freezeWire(proposal);
    await verifyPersistedEnvelope(frozen.envelope, options);
    const proposalCanonical = (options.measure??((_name,fn)=>fn()))('saveSerialize',()=>canonicalStringify(frozen));
    const proposalHash = bytesToHex(await hashBytes(utf8(proposalCanonical), options.sha256));
    // Canonical proposal text may exceed the general small-string wire budget.
    // It is store deduplication evidence, not a field in a simulation snapshot.
    return Object.freeze({ proposal: frozen, proposalCanonical, proposalHash });
  }

  function validateCommittedResult(prepared, result) {
    requireContract(result?.status === "committed", "Expected committed store result");
    const { proposal, proposalHash } = prepared;
    const expectedReceipt = { transactionId: proposal.transactionId, campaignId: proposal.campaignId,
      expectedSaveRevision: proposal.expectedSaveRevision, saveRevision: proposal.envelope.saveRevision,
      checkpointId: proposal.envelope.checkpointId, kind: proposal.kind, proposalHash };
    requireContract(canonicalStringify(result.receipt) === canonicalStringify(expectedReceipt), "Commit receipt mismatch");
    requireContract(serializeCampaignEnvelope(result.envelope) === serializeCampaignEnvelope(proposal.envelope),
      "Commit returned another checkpoint");
    requireContract(Object.keys(result).sort().join(",") === "envelope,receipt,status", "Unexpected committed result fields");
    return freezeWire(result);
  }

  function decideTransaction(prepared, currentEnvelope, knownRecord, existingReservations = []) {
    const { proposal, proposalCanonical, proposalHash } = prepared;
    if (knownRecord !== null) {
      if (knownRecord.proposalCanonical !== proposalCanonical) throw new TransactionPayloadConflictError();
      return { result: validateCommittedResult(prepared, knownRecord.result), writeRecord: null, reservationRecords: [] };
    }
    const requiredReservations = requiredIdentityReservations(prepared);
    requireContract(Array.isArray(existingReservations) && existingReservations.length === requiredReservations.length,
      "Incomplete identity reservation lookup");
    existingReservations.forEach((record, index) => {
      if (record === null) return;
      validateIdentityReservation(record, requiredReservations[index]);
      requireContract(record.transactionId !== proposal.transactionId,
        "Reservation without its atomic transaction receipt");
      throw new DurableIdentityConflictError(record.identityKind);
    });
    if (currentEnvelope !== null) validateCampaignEnvelope(currentEnvelope);
    const actualRevision = currentEnvelope?.saveRevision ?? null;
    if (actualRevision !== proposal.expectedSaveRevision) {
      return { result: freezeWire({ status: "conflict", actualSaveRevision: actualRevision }), writeRecord: null,
        reservationRecords: [] };
    }
    if (currentEnvelope !== null) validateCheckpointTransition(currentEnvelope, proposal.envelope);
    else requireContract(proposal.kind === "campaignCreated", "Campaign must be created first");
    const receipt = { transactionId: proposal.transactionId, campaignId: proposal.campaignId,
      expectedSaveRevision: proposal.expectedSaveRevision, saveRevision: proposal.envelope.saveRevision,
      checkpointId: proposal.envelope.checkpointId, kind: proposal.kind, proposalHash };
    const result = freezeWire({ status: "committed", receipt, envelope: proposal.envelope });
    return { result, writeRecord: Object.freeze({ proposalCanonical, result }), reservationRecords: requiredReservations };
  }

  return Object.freeze({ requiredIdentityReservations, prepareTransaction, validateCommittedResult,
    decideTransaction, verifyPersistedEnvelope });
}
