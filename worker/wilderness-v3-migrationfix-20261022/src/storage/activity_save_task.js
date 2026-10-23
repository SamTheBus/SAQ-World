import { activityGeneration, createActivityEnvelope, verifyActivityEnvelope, parseActivityEnvelope, validateActivityProgress, activityCampaignTransactions } from './activity_campaign_store.js?v=v3-6-aegis-deep-20261022';
import { freezeWire, requireContract, canonicalStringify, closedRecord } from '../shared/contracts/wire.js';
import { TransactionPayloadConflictError, DurableIdentityConflictError } from './campaign_store_core.js';

// Single owned durability task. All external/load/commit validation stays here.
// The browser runs this task in a dedicated worker; tests may inject it locally.
export function createActivitySaveTask({storeFactory,sha256,measure=(_name,fn)=>fn(),measureAsync=(_name,fn)=>fn()}) {
  let pending=null,busy=false;
  const timed=(name,fn)=>measureAsync(name,fn);
  function definite(result){pending=null;return result;}
  async function settle(result){
    if(result?.status==='committed'){
      const {prepared,store,options}=pending;
      const checked=activityCampaignTransactions.validateCommittedResult(prepared,result);
      await verifyActivityEnvelope(checked.envelope,options);
      const latest=await verifyActivityEnvelope(parseActivityEnvelope(await store.loadLatestCheckpoint(prepared.proposal.campaignId)),options);
      requireContract(latest.saveRevision>=checked.envelope.saveRevision,'Durable head regressed');
      if(latest.saveRevision===checked.envelope.saveRevision)requireContract(canonicalStringify(latest)===canonicalStringify(checked.envelope),'Divergent durable head');
      else validateActivityProgress(checked.envelope,latest);
      return definite({status:'committed',receipt:checked.receipt,envelope:latest});
    }
    if(result?.status==='aborted'){
      closedRecord(result,['status','reason']);requireContract(typeof result.reason==='string','Malformed abort result');return definite(result);
    }
    if(result?.status==='conflict'){
      closedRecord(result,['status','actualSaveRevision']);requireContract(result.actualSaveRevision===null||Number.isSafeInteger(result.actualSaveRevision)&&result.actualSaveRevision>=0,'Malformed conflict result');return definite(result);
    }
    return {status:'unknown',reason:'reconciliation-required'};
  }
  const certain=e=>e instanceof TransactionPayloadConflictError||e instanceof DurableIdentityConflictError;
  async function commit({cut,transactionId,expectedSaveRevision}){
    requireContract(!busy&&!pending,'Durability task already owns a cut');busy=true;let dispatched=false;
    try{
      const state=cut.snapshot.state,options={sha256,measure,expectedGenerationBinding:activityGeneration(state),expectedContentFingerprint:state.content.fingerprint};
      const store=storeFactory(options),kind=expectedSaveRevision===null?'campaignCreated':'pluralCut';
      const envelope=await timed('saveEnvelope',()=>createActivityEnvelope(cut,kind,options));
      const proposal=freezeWire({transactionVersion:'activity-cut-1',transactionId,campaignId:state.campaign.campaignId,expectedSaveRevision,kind,envelope});
      const prepared=await timed('savePrepare',()=>activityCampaignTransactions.prepareTransaction(proposal,options));
      pending={prepared,store,options};dispatched=true;
      const result=await timed('saveStorage',()=>store.commitTransaction(proposal));
      return await timed('saveVerifyReconcile',()=>settle(result));
    }catch(error){if(!dispatched||certain(error)){pending=null;return {status:'aborted',reason:error.message};}return {status:'unknown',reason:error.message};}
    finally{busy=false;}
  }
  async function reconcile(){
    requireContract(pending&&!busy,'No pending cut to reconcile');busy=true;
    try{const {store,prepared}=pending,proposal=prepared.proposal,known=await store.lookupTransaction(proposal.campaignId,proposal.transactionId);
      if(known){requireContract(known.proposalCanonical===prepared.proposalCanonical,'Transaction payload conflict');return await settle(known.result);}
      const result=await store.commitTransaction(proposal);
      return result?.status==='committed'?await settle(result):{status:'unknown',reason:'reconciliation-required'};
    }catch(error){return {status:'unknown',reason:error.message};}finally{busy=false;}
  }
  return Object.freeze({commit,reconcile});
}
