import { validateId } from "../shared/contracts/identities.js";
import { copyWire, freezeWire, requireContract, closedRecord } from "../shared/contracts/wire.js";
import { nextUint32 } from "../shared/contracts/rng.js";
import { TransactionPayloadConflictError, DurableIdentityConflictError } from "../storage/campaign_store_core.js";


// Extracted unchanged X-A2 queue/barrier/reconciliation policy; codecs own schemas.
export function createExactCutAuthority({ initialCut, store, nextToken, sha256, expectedGenerationBinding,
  createAuthority, validatePluralCut, pluralCutAtRevision, parsePluralEnvelope, sameProofValue, validatePluralProgress,
  createPluralEnvelope, verifyPluralEnvelope, pluralCampaignTransactions, transactionVersion, metadataForCut, resumeReference=false,
  durabilityTask=null, measure=(_name,fn)=>fn() }) {
  validatePluralCut(initialCut);
  const binding = freezeWire(expectedGenerationBinding);
  requireContract(sameProofValue(initialCut.generation, binding), "Initial generation binding mismatch");
  const options = Object.freeze({ sha256, expectedGenerationBinding: binding,
    expectedContentFingerprint: initialCut.snapshot.state.content.fingerprint });
  const campaignId = initialCut.snapshot.state.campaign.campaignId;
  const fresh = freezeWire(initialCut);
  if(!resumeReference)requireContract(fresh.snapshot.state.campaign.checkpointId === null && fresh.snapshot.state.campaign.saveRevision === 0,
    "Load durable cuts through verified store loading");
  if(!resumeReference)requireContract(fresh.snapshot.state.tick === 0 && fresh.snapshot.state.lastAppliedAuthorityOrder === 0 &&
    fresh.snapshot.state.eventEmission.lastEventSequence === 0, "Initial reference must precede live authority progress");
  let authority = createAuthority({ initialState: fresh.snapshot.state, nextToken });
  let metadata = metadataForCut(fresh);
  let confirmed = null, pending = null, phase = resumeReference ? "unloaded" : "ready", busy = false, dirty = false;

  function ready() { requireContract(phase === "ready" && ((!busy && pending === null) || pending?.background), "Campaign cut barrier is active"); }
  function readCut() { return freezeWire({ ...metadata, snapshot: authority.getExactSnapshotForProof().snapshot }); }
  function quiescent() {
    const gateway = authority.readGateway();
    requireContract(Object.keys(gateway.admittedCommandsById).length === 0 &&
      Object.values(gateway.playersById).every(cursor => cursor.bufferedCommands.length === 0),
    "Drain admitted commands and fill sequence gaps before a durable cut");
  }
  function install(envelope) {
    // Construct/validate completely before replacing either part of the cut.
    const next = createAuthority({ initialState: envelope.cut.snapshot.state, nextToken });
    authority = next;
    metadata = metadataForCut(envelope.cut);
    confirmed = envelope; dirty = false;
  }
  function unknown() {
    phase = "unknown";
    return freezeWire({ status: "unknown", reason: "reconciliation-required" });
  }
  function definite(result) { pending = null; phase = "ready"; return freezeWire(result); }
  async function latestEnvelope() {
    const text = await store.loadLatestCheckpoint(campaignId);
    requireContract(typeof text === "string", "Missing durable plural checkpoint");
    const envelope = await verifyPluralEnvelope(parsePluralEnvelope(text), options);
    requireContract(envelope.campaignId === campaignId, "Store returned another campaign");
    return envelope;
  }
  async function settle(result) {
    if (result?.status === "committed") {
      const checked = pluralCampaignTransactions.validateCommittedResult(pending.prepared, result);
      await verifyPluralEnvelope(checked.envelope, options);
      // A prior receipt is evidence of success, never permission to install an old cut.
      const latest = await latestEnvelope();
      requireContract(latest.saveRevision >= checked.envelope.saveRevision, "Durable head regressed behind receipt");
      if (latest.saveRevision === checked.envelope.saveRevision)
        requireContract(sameProofValue(latest, checked.envelope), "Divergent same-revision checkpoint");
      else validatePluralProgress(checked.envelope, latest);
      if (confirmed) requireContract(latest.saveRevision > confirmed.saveRevision, "Stale confirmed installation");
      install(latest);
      return definite({ status: "committed", receipt: checked.receipt, installedSaveRevision: latest.saveRevision });
    }
    if (result?.status === "aborted") {
      closedRecord(result, ["status", "reason"]);
      requireContract(typeof result.reason === "string", "Malformed abort result");
      return definite(result); // Keep both live progress and previous confirmed cut intact.
    }
    if (result?.status === "conflict") {
      closedRecord(result, ["status", "actualSaveRevision"]);
      requireContract(result.actualSaveRevision === null || Number.isSafeInteger(result.actualSaveRevision) &&
        result.actualSaveRevision >= 0, "Malformed conflict result");
      return definite(result);
    }
    return unknown();
  }
  const definiteError = error => error instanceof TransactionPayloadConflictError || error instanceof DurableIdentityConflictError;

  function settleBackground(result){
    if(result?.status==='committed'){
      const envelope=result.envelope,receipt=result.receipt;
      requireContract(receipt?.transactionId===pending.ids.transactionId&&receipt.campaignId===campaignId&&
        receipt.expectedSaveRevision===pending.expectedSaveRevision&&receipt.checkpointId===pending.ids.checkpointId&&
        receipt.saveRevision===pending.expectedSaveRevision+1,'Background receipt mismatch');
      // The owned durability task has fully verified the envelope/store head.
      // A newer external writer requires explicit reload; never merge or install over live work.
      if(envelope?.saveRevision!==receipt.saveRevision||envelope.checkpointId!==receipt.checkpointId){
        pending=null;phase='conflict';return {status:'conflict',reason:'Another writer advanced this campaign. Reopen the confirmed campaign.'};
      }
      requireContract(envelope.campaignId===campaignId&&envelope.cut.snapshot.state.tick===pending.tick,'Background cut identity mismatch');
      confirmed=envelope;
      authority.confirmDurability({saveRevision:envelope.saveRevision,checkpointId:envelope.checkpointId});
      return definite({status:'committed',receipt,installedSaveRevision:envelope.saveRevision});
    }
    if(result?.status==='aborted')return definite(result);
    if(result?.status==='conflict'){pending=null;phase='conflict';return result;}
    return unknown();
  }
  async function backgroundCut(ids){
    const expectedSaveRevision=confirmed.saveRevision;
    // Copy private working data synchronously; validate the immutable cut in the task.
    // The copy retains no aliases to the simulation and never changes live actors.
    const cut=measure('saveCapture',()=>Object.freeze({...metadata,snapshot:authority.captureForDurability({saveRevision:expectedSaveRevision+1,checkpointId:ids.checkpointId})}));
    pending={background:true,ids,expectedSaveRevision,tick:cut.snapshot.state.tick};busy=true;
    try{return settleBackground(await durabilityTask.commit({cut,transactionId:ids.transactionId,expectedSaveRevision}));}
    catch{return unknown();}finally{busy=false;}
  }

  async function commitCut(request) {
    ready(); requireContract(!pending&&!busy,'One campaign commit at a time'); quiescent(); closedRecord(request, ["transactionId", "checkpointId"]);
    validateId("transactionId", request.transactionId); validateId("checkpointId", request.checkpointId);
    if(durabilityTask&&confirmed)return measure('saveBlocking',()=>backgroundCut(freezeWire(request)));
    const ids = freezeWire(request), expectedSaveRevision = confirmed?.saveRevision ?? null;
    const cut = pluralCutAtRevision(readCut(), expectedSaveRevision === null ? 0 : expectedSaveRevision + 1, ids.checkpointId);
    const kind = expectedSaveRevision === null ? "campaignCreated" : "pluralCut";
    pending = { prepared: null }; phase = "pending"; busy = true;
    let dispatched = false;
    try {
      const envelope = await createPluralEnvelope(cut, kind, options);
      const proposal = freezeWire({ transactionVersion, transactionId: ids.transactionId,
        campaignId, expectedSaveRevision, kind, envelope });
      pending.prepared = await pluralCampaignTransactions.prepareTransaction(proposal, options);
      dispatched = true;
      return await settle(await store.commitTransaction(proposal));
    } catch (error) {
      if (!dispatched) { pending = null; phase = "ready"; throw error; }
      if (definiteError(error)) return definite({ status: "aborted", reason: error.message });
      return unknown();
    } finally { busy = false; }
  }

  async function reconcile() {
    if(pending?.background){
      requireContract(phase==='unknown'&&!busy,'No reconcilable background cut');busy=true;phase='pending';
      try{return settleBackground(await durabilityTask.reconcile());}catch{return unknown();}finally{busy=false;}
    }
    requireContract(phase === "unknown" && !busy && pending?.prepared, "No reconcilable unknown cut");
    busy = true; phase = "pending";
    try {
      const prepared = pending.prepared, proposal = prepared.proposal;
      const known = await store.lookupTransaction(campaignId, proposal.transactionId);
      if (known !== null) {
        if (known.proposalCanonical !== prepared.proposalCanonical) {
          const original = await pluralCampaignTransactions.prepareTransaction(JSON.parse(known.proposalCanonical), options);
          requireContract(original.proposal.campaignId === campaignId && original.proposal.transactionId === proposal.transactionId,
            "Mismatched transaction lookup");
          pluralCampaignTransactions.validateCommittedResult(original, known.result);
          return definite({ status: "aborted", reason: "Transaction ID reused with different payload" });
        }
        return await settle(known.result);
      }
      const retried = await store.commitTransaction(proposal);
      // Absence + a failed retry does not disprove a delayed original commit.
      return retried?.status === "committed" ? await settle(retried) : unknown();
    } catch (error) {
      if (definiteError(error)) return definite({ status: "aborted", reason: error.message });
      return unknown();
    } finally { busy = false; }
  }

  async function loadCampaign() {
    const wasUnloaded=phase==="unloaded";let installed=false;
    if(!wasUnloaded)ready(); requireContract(!dirty && confirmed === null, "Restart in a fresh authority; never load over live progress");
    busy = true; phase = "loading";
    try { const envelope = await latestEnvelope(); install(envelope); installed=true; return readCut(); }
    finally { phase = wasUnloaded&&!installed ? "unloaded" : "ready"; busy = false; }
  }
  function createControllerPort(playerId) {
    ready();
    // Membership is a scalar query of the already validated owned state. Creating
    // an input port must not copy/validate the complete persistent campaign.
    const known=authority.hasPlayer?authority.hasPlayer(playerId):Boolean(authority.readState().playersById[playerId]);
    requireContract(known, "Unknown controller");
    return Object.freeze({ send(command) {
      ready(); const result = authority.createControllerPort(playerId).send(command); dirty = true; return result;
    } });
  }
  function drainCommands() { ready(); const result = authority.drainCommands(); dirty = true; return result; }
  function advanceOneTick() { ready(); const tick = authority.advanceOneTick(); dirty = true; return tick; }
  function drawEncounterRandomForProof(encounterId, expectedAttemptId) {
    ready();
    const encounter = metadata.ordinaryEncountersById[encounterId];
    requireContract(encounter?.encounterAttemptId === expectedAttemptId, "Stale ordinary attempt");
    requireContract(metadata.rngByAttemptId[expectedAttemptId].drawCount < 256, "Proof RNG draw capacity exhausted");
    const result = nextUint32(metadata.rngByAttemptId[expectedAttemptId]);
    metadata = { ...metadata, rngByAttemptId: freezeWire({ ...metadata.rngByAttemptId, [expectedAttemptId]: result.state }) };
    dirty = true; return result.value;
  }
  return Object.freeze({ readCut, readState: () => authority.readState(), readGateway: () => authority.readGateway(),
    readConfirmed: () => confirmed && freezeWire(confirmed), getStatus: () => freezeWire({ phase, confirmedSaveRevision: confirmed?.saveRevision ?? null, ...(durabilityTask?{saving:Boolean(pending?.background)}:{}) }),
    createControllerPort, drainCommands, advanceOneTick, drawEncounterRandomForProof, commitCut, reconcile, loadCampaign,
    withReadyAuthority: fn => { ready(); dirty=true; return fn(authority); }, withAuthority: fn => fn(authority) });
}
