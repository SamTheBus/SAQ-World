import {createActivityAuthority} from './activity_authority.js';
import {validateId} from '../shared/contracts/identities.js';
import {closedRecord,requireContract as check} from '../shared/contracts/wire.js';
import {captureWorldStreamStateD9} from '../shared/contracts/world_stream_capture_d9.js';

// Commands and combat remain in the existing activity authority. This facade
// replaces only its whole-campaign durability boundary with an exact paged cut.
export function createPagedWorldAuthorityD9({initialState,publication,task,measure=(_n,fn)=>fn(),schedulerOptions,developerCapabilities,capturePages=()=>[],confirmedPages=()=>{}}){
 check(initialState.d9World&&publication,'Confirmed D9 world required');
 const authority=createActivityAuthority({initialState,measure,schedulerOptions,developerCapabilities});let confirmed=publication,pending=null,phase='ready',busy=false;
 function ready(){check(phase==='ready','World durability reconciliation is required');}
 function quiescent(){const g=authority.readGateway();check(Object.keys(g.admittedCommandsById).length===0&&Object.values(g.playersById).every(p=>p.bufferedCommands.length===0),'Drain commands before the world cut');}
 function settle(result){
  if(result?.status==='committed'){
   check(pending&&result.publication?.root.previous===confirmed.id&&result.publication.root.revision===confirmed.root.revision+1&&result.tick===pending.tick&&result.saveRevision===pending.saveRevision+1&&result.checkpointId===pending.checkpointId,'World durability receipt mismatch');
   authority.confirmDurability({saveRevision:result.saveRevision,checkpointId:result.checkpointId});confirmed=result.publication;confirmedPages(pending.pages);pending=null;phase='ready';return result;
  }
  if(result?.status==='aborted'){pending=null;phase='ready';return result;}
  if(result?.status==='conflict'){pending=null;phase='conflict';return result;}
  phase='unknown';return {status:'unknown',reason:result?.reason??'World publication requires reconciliation'};
 }
 async function commitCut(request){
  ready();check(!busy&&!pending,'One world cut at a time');quiescent();closedRecord(request,['transactionId','checkpointId']);validateId('transactionId',request.transactionId);validateId('checkpointId',request.checkpointId);
  const cursor=authority.withAuthorityState(s=>({saveRevision:s.campaign.saveRevision,checkpointId:s.campaign.checkpointId}));
  // Copy only the bounded owned runtime. Hashing, validation and storage execute
  // in the Worker while later simulation ticks continue against the live state.
  const state=measure('saveCapture',()=>authority.captureForDurability(cursor).state),pages=capturePages();pending={tick:state.tick,saveRevision:cursor.saveRevision,checkpointId:request.checkpointId,pages};busy=true;
  try{return settle(await task.commit({state,expectedRoot:confirmed.id,checkpointId:request.checkpointId,stagedPages:pages}));}
  catch(error){return settle({status:'unknown',reason:error.message});}finally{busy=false;}
 }
 async function reconcile(){check(phase==='unknown'&&pending&&!busy,'No uncertain world cut');busy=true;try{return settle(await task.reconcile());}catch(error){return settle({status:'unknown',reason:error.message});}finally{busy=false;}}
 return Object.freeze({
  getStatus:()=>({phase,confirmedSaveRevision:authority.withAuthorityState(s=>s.campaign.saveRevision),saving:Boolean(pending)}),readConfirmed:()=>confirmed,
  createControllerPort(playerId){ready();const port=authority.createControllerPort(playerId);return {send(command){ready();return port.send(command);}};},
  drainCommands(){ready();return authority.drainCommands();},advanceOneTick(){ready();return authority.advanceOneTick();},
  readState:()=>authority.readState(),captureStreamState:kind=>measure('streamCapture',()=>authority.withAuthorityState(s=>captureWorldStreamStateD9(s,kind))),readGateway:()=>authority.readGateway(),withAuthority:fn=>fn(authority),withReadyAuthority:fn=>{ready();return fn(authority);},developerRelocateToWorld:(playerId,position,facing)=>{ready();return authority.developerRelocateToWorld(playerId,position,facing);},commitCut,reconcile
 });
}
