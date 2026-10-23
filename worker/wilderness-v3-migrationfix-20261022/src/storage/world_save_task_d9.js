import {copyWire,canonicalStringify,closedRecord,requireContract as check} from '../shared/contracts/wire.js';
import {prepareWorldSnapshotD9,openWorldSnapshotD9} from './world_snapshot_d9.js';
import {pageDigest} from './paged_world_store.js';
import {parseActivityEnvelope,verifyActivityEnvelope,activityGeneration} from './activity_campaign_store.js?v=v3-6-aegis-deep-20261022';
import {prepareD9OriginMigration} from '../shared/contracts/world_root_d9.js';
import {validateWorldAdvanceD9} from './world_transition_d9.js';
import {verifyRemoteGearKnowledgeD9} from './world_gear_knowledge_d9.js';

// One immutable proposal remains owned by this task until its publication has a
// definite result. Retrying after uncertain IndexedDB completion reuses its hash.
export function createWorldSaveTaskD9({store,sha256,generatePlannedChunk=null}){
 let confirmed=null,pending=null,busy=false;
 const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
 async function open(campaignId){
  check(!busy&&!pending,'World cut is pending');busy=true;
  try{const publication=await store.worldPages.readRoot(campaignId);if(!publication)return null;
   const state=await openWorldSnapshotD9(publication,{sha256,readPage:store.worldPages.readPage,generatePlannedChunk});confirmed={publication,state};return {publication,state};
  }finally{busy=false;}
 }
 async function settle(){
  const p=pending,current=await store.worldPages.readRoot(p.request.root.campaignId);
  if(current?.id===p.id){confirmed={publication:current,state:p.next};pending=null;return {status:'committed',publication:current,saveRevision:p.next.campaign.saveRevision,checkpointId:p.next.campaign.checkpointId,tick:p.next.tick};}
  if((current?.id??null)!==p.request.expectedRoot){pending=null;return {status:'conflict',reason:'Another writer advanced this campaign. Reopen the confirmed campaign.'};}
  await store.worldPages.publish(p.request);
  return settle();
 }
 async function commit(request){
  check(!busy&&!pending,'World save already owns a cut');closedRecord(request,['state','expectedRoot','checkpointId'],['stagedPages']);busy=true;
  try{
   const {state}=request,head=await store.worldPages.readRoot(state.campaign.campaignId);
   if((head?.id??null)!==request.expectedRoot)return {status:'conflict',reason:'Stale world save root'};
   let legacyCheckpoint=null;
   if(!head){
    legacyCheckpoint=await store.loadLatestCheckpoint(state.campaign.campaignId);check(legacyCheckpoint,'Missing historical migration cut');
    const envelope=parseActivityEnvelope(legacyCheckpoint),legacy=envelope.cut.snapshot.state;
    await verifyActivityEnvelope(envelope,{sha256,expectedContentFingerprint:legacy.content.fingerprint,expectedGenerationBinding:activityGeneration(legacy)});
    const migration=await prepareD9OriginMigration(legacy,{sha256});check(same(migration.state,state),'First D9 cut must be the exact historical migration');
   }else{
    if(confirmed?.publication.id!==head.id)confirmed={publication:head,state:await openWorldSnapshotD9(head,{sha256,readPage:store.worldPages.readPage,generatePlannedChunk})};
    const staged=new Map((request.stagedPages??[]).map(p=>[p.id,p.value]));
    await validateWorldAdvanceD9(confirmed.state,state,{sha256,readPage:async id=>staged.get(id)??store.worldPages.readPage(id)});
    await verifyRemoteGearKnowledgeD9(state,{sha256,readPage:async id=>staged.get(id)??store.worldPages.readPage(id)});
   }
   const prepared=await prepareWorldSnapshotD9(state,{sha256,previous:head,checkpointId:request.checkpointId,stagedPages:request.stagedPages??[]}),next=copyWire(state);
   Object.assign(next.campaign,{saveRevision:state.campaign.saveRevision+1,checkpointId:request.checkpointId});
   pending={id:await pageDigest(prepared.root,sha256),request:{...prepared,legacyCheckpoint},next};
   return await settle();
  }catch(error){return pending?{status:'unknown',reason:error.message}:{status:'aborted',reason:error.message,...(error.code?{code:error.code}:{}) ,...(error.actorGeometry?{actorGeometry:error.actorGeometry}:{}) ,...(error.stack?{stack:error.stack}:{}),cutTick:request.state?.tick};}
  finally{busy=false;}
 }
 async function reconcile(){check(pending&&!busy,'No pending world publication');busy=true;try{return await settle();}catch(error){return {status:'unknown',reason:error.message};}finally{busy=false;}}
 return {open,commit,reconcile};
}
