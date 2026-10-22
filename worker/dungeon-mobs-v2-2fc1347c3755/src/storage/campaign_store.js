import { freezeWire, requireContract } from "../shared/contracts/wire.js";
import { validateTransactionProposal, validateCampaignEnvelope, validateCheckpointTransition, serializeCampaignEnvelope } from "../shared/contracts/checkpoint.js";
import { verifyContentFingerprint } from "../shared/content/index.js";
import { verifyBoundOverworldGeometry } from "../shared/content/overworld_fixture_catalog.js";
import { createCampaignStoreTransactions } from "./campaign_store_core.js";
export { TransactionPayloadConflictError, DurableIdentityConflictError } from "./campaign_store_core.js";

export async function verifyPersistedEnvelope(envelope, { sha256, expectedContentFingerprint }) {
  validateCampaignEnvelope(envelope);
  const frozen = freezeWire(envelope);
  requireContract(typeof expectedContentFingerprint === "string" && /^[0-9a-f]{64}$/.test(expectedContentFingerprint),
    "Supported content fingerprint must be explicit");
  requireContract(frozen.snapshot.state.content.fingerprint === expectedContentFingerprint, "Unsupported content fingerprint");
  await verifyContentFingerprint(frozen.snapshot.state.content, { sha256 });
  await verifyBoundOverworldGeometry(frozen.snapshot.state,{sha256});
  return frozen;
}

const transactions = createCampaignStoreTransactions({ validateTransactionProposal, validateCampaignEnvelope,
  validateCheckpointTransition, serializeCampaignEnvelope, verifyPersistedEnvelope,
  reservationIdentities: proposal => {
    const identities = [{ identityKind: "checkpointId", identityId: proposal.envelope.checkpointId }];
    if (proposal.kind === "encounterStart") identities.push({
      identityKind: "encounterAttemptId", identityId: proposal.envelope.encounter.encounterAttemptId,
    });
    return identities;
  },
});
export const { requiredIdentityReservations, prepareTransaction, validateCommittedResult, decideTransaction } = transactions;
