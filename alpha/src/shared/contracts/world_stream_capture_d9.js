import {D9_RUNTIME_POLICY as B} from '../content/world_runtime_policy_d9.js';
import {withinRetainedSiteBudgetsD9} from '../content/alpha_population_retention_v1.js';
import {copyWire,closedRecord,requireContract as check,safeInteger,validateWire} from './wire.js';

export const WORLD_STREAM_CAPTURE_D9='world-stream-capture-d9-v1';
const KINDS=new Set(['residency','encounters','deadlines','ground']);

// Cold World work needs the bounded resident window and participant ownership,
// not the immutable content catalog or retained command/combat history. The
// historical origin collision is already installed in the live authority and
// cannot be changed by a streaming task, so the Worker receives only its shape.
export function captureWorldStreamStateD9(state,kind){
 check(KINDS.has(kind)&&state.d9World,'World stream capture kind');
 const spacesByInstanceId={};
 for(const [id,space] of Object.entries(state.spacesByInstanceId)){
  const next=copyWire(space);
  if(kind!=='ground'&&id===state.overworldInstanceId&&next.collision?.origin)next.collision.origin={width:0,height:0,tiles:[]};
  spacesByInstanceId[id]=next;
 }
 const capture={
  streamCapture:{version:WORLD_STREAM_CAPTURE_D9,kind},
  campaign:{campaignId:state.campaign.campaignId,seed:copyWire(state.campaign.seed)},
  session:copyWire(state.session),tick:state.tick,overworldInstanceId:state.overworldInstanceId,
  d9World:copyWire(state.d9World),playersById:copyWire(state.playersById),entitiesById:copyWire(state.entitiesById),
  groupsById:copyWire(state.groupsById),encounterEconomy:copyWire(state.encounterEconomy),
  spacesByInstanceId,subweaponCombat:copyWire(state.subweaponCombat)
 };
 // The live state already passed authority admission. Validation of this
 // private copied envelope occurs after structured clone in the Worker.
 return capture;
}

export function validateWorldStreamCaptureD9(state,kind=state?.streamCapture?.kind){
 validateWire(state);closedRecord(state,['streamCapture','campaign','session','tick','overworldInstanceId','d9World','playersById','entitiesById','groupsById','encounterEconomy','spacesByInstanceId','subweaponCombat']);
 closedRecord(state.streamCapture,['version','kind']);check(state.streamCapture.version===WORLD_STREAM_CAPTURE_D9&&state.streamCapture.kind===kind&&KINDS.has(kind),'World stream capture version/kind');
 closedRecord(state.campaign,['campaignId','seed']);safeInteger(state.tick);check(state.session.campaignId===state.campaign.campaignId&&state.d9World&&state.spacesByInstanceId[state.overworldInstanceId],'World stream capture identity');
 check(Object.keys(state.playersById).length>=1&&Object.keys(state.playersById).length<=4,'World stream participant bound');
 check(withinRetainedSiteBudgetsD9(state)&&state.d9World.runtime.chunks.length<=B.residentChunks,'World stream residency bound');
 const collision=state.spacesByInstanceId[state.overworldInstanceId].collision;
 check(collision.pages.length===state.d9World.runtime.chunks.length&&collision.frames===state.d9World.runtime.frames||JSON.stringify(collision.frames)===JSON.stringify(state.d9World.runtime.frames),'World stream geometry bound');
 return state;
}

export function asWorldStreamCaptureD9(state,kind){return state?.streamCapture?validateWorldStreamCaptureD9(state,kind):captureWorldStreamStateD9(state,kind);}
