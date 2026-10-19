import { closedRecord, copyWire, requireContract, safeInteger, canonicalStringify } from "./wire.js";
import { validateId } from "./identities.js";
import { SHIELD_SWORD_PRIMARY } from "../content/manual_primary.js";

export const PRIMARY_RECENT_WINDOW = 16;
export const COMPLETED_COMBAT_WINDOW = 16;
const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
export function validatePrimaryAim(aim) {
  closedRecord(aim,["x","y"]);
  requireContract([aim.x,aim.y].every(n=>typeof n==="number"&&Number.isFinite(n)) && Math.abs(Math.hypot(aim.x,aim.y)-1)<1e-10,
    "Primary aim must be a normalized direction");
}
export function primaryProfile(state,entityId) {
  const id=state.primary?.actorsById[entityId]?.profileId;
  const profile=state.content?.definitionsById[id];
  requireContract(profile?.kind==="primaryProfile" && same(profile,SHIELD_SWORD_PRIMARY),"Unsupported equipped primary profile");
  return profile;
}
export function initializePrimary(state) {
  const next=copyWire(state),actorsById={};
  for(const p of Object.values(next.playersById))actorsById[p.entityId]={profileId:SHIELD_SWORD_PRIMARY.contentDefinitionId,
    facing:{x:1,y:0},heldCommandId:null,queuedCommandId:null,current:null,nextComboStep:1,comboDeadline:null,
    nextSourceSequence:1,retiredSourceSequence:0};
  next.primary={contractVersion:1,actorsById,completedById:{},actionIdHighWatermark:null,eventIdHighWatermark:null};
  return next;
}
export function primaryRecords(state) {
  return state.primary ? [...Object.values(state.primary.completedById),...Object.values(state.primary.actorsById).map(a=>a.current).filter(Boolean)] : [];
}
export function primaryPinnedCommands(state) {
  if(!state.primary)return [];
  return [...primaryRecords(state).map(a=>a.commandId),...Object.values(state.primary.actorsById).flatMap(a=>[a.heldCommandId,a.queuedCommandId])].filter(Boolean);
}
export function resetPrimary(next) {
  if(!next.primary)return;
  next.primary.completedById={};
  for(const a of Object.values(next.primary.actorsById)) {
    a.current=null;a.heldCommandId=null;a.queuedCommandId=null;a.nextComboStep=1;a.comboDeadline=null;
    a.retiredSourceSequence=a.nextSourceSequence-1;
  }
}
export function clearPrimaryInput(next,entityId) {
  const a=next.primary?.actorsById[entityId];if(a){a.heldCommandId=null;a.queuedCommandId=null;}
}
export function prunePrimaryHistory(next) {
  if(!next.primary)return;
  const records=Object.values(next.primary.completedById).sort((a,b)=>a.completedTick-b.completedTick||a.startEventSequence-b.startEventSequence);
  for(const record of records.slice(0,Math.max(0,records.length-PRIMARY_RECENT_WINDOW))) {
    next.primary.actorsById[record.sourceEntityId].retiredSourceSequence=record.sourceSequence;
    delete next.primary.completedById[record.primaryActionId];
  }
}
export function primaryPhaseAt(action,profile,tick) {
  const t=action.timing??profile.steps[action.comboStep-1],start=action.startedTick;
  if(tick<start+t.startup)return {phase:"startup",phaseStartedTick:start,phaseEndsTick:start+t.startup};
  if(tick<start+t.startup+t.active)return {phase:"active",phaseStartedTick:start+t.startup,phaseEndsTick:start+t.startup+t.active};
  return {phase:"recovery",phaseStartedTick:start+t.startup+t.active,phaseEndsTick:start+t.startup+t.active+t.recovery};
}
export function validatePrimaryState(state) {
  const value=state.primary;
  requireContract(state.history&&state.multiplayer&&state.space,"Primary needs bounded plural combat state");
  closedRecord(value,["contractVersion","actorsById","completedById","actionIdHighWatermark","eventIdHighWatermark"]);
  requireContract(value.contractVersion===1,"Unsupported primary contract");
  requireContract(same(Object.keys(value.actorsById).sort(),Object.values(state.playersById).map(p=>p.entityId).sort()),"Primary owner inventory mismatch");
  for(const [field,kind] of [["actionIdHighWatermark","primaryActionId"],["eventIdHighWatermark","eventId"]])if(value[field]!==null)validateId(kind,value[field]);
  requireContract(Object.keys(value.completedById).length<=PRIMARY_RECENT_WINDOW,"Completed primary retention bound");
  requireContract(Object.keys(state.combat.appliedActionsById).length<=COMPLETED_COMBAT_WINDOW,"Manual damage retention bound");
  const sequences={},primaryEvents=[],eventIds=new Set();
  for(const [id,a] of Object.entries(value.actorsById)) {
    closedRecord(a,["profileId","facing","heldCommandId","queuedCommandId","current","nextComboStep","comboDeadline","nextSourceSequence","retiredSourceSequence"]);
    const profile=primaryProfile(state,id);validatePrimaryAim(a.facing);safeInteger(a.nextComboStep,1,profile.steps.length);
    safeInteger(a.nextSourceSequence,1);safeInteger(a.retiredSourceSequence,0,a.nextSourceSequence-1);sequences[id]=a.retiredSourceSequence;
    if(a.comboDeadline!==null)safeInteger(a.comboDeadline,0,state.tick+profile.continuationTicks);
    const player=Object.values(state.playersById).find(p=>p.entityId===id);
    for(const commandId of [a.heldCommandId,a.queuedCommandId]) if(commandId!==null){
      validateId("commandId",commandId);const receipt=state.appliedCommandsById[commandId],cmd=receipt&&JSON.parse(receipt.commandCanonical);
      requireContract(cmd?.kind==="combat.primaryIntent"&&cmd.payload.pressed&&cmd.playerId===player.playerId&&receipt.result?.status==="applied",
        "Primary input needs its applied owner command");
    }
    if(player.connectionStatus==="disconnected")requireContract(a.heldCommandId===null&&a.queuedCommandId===null,"Disconnected primary input retained");
    if(a.current)requireContract(a.comboDeadline===null&&a.nextComboStep===a.current.comboStep,"Active combo cursor mismatch");
    if(state.space.encounterId===null)requireContract(a.current===null&&a.heldCommandId===null&&a.queuedCommandId===null&&a.nextComboStep===1&&a.comboDeadline===null,"Safe primary must be reset");
    if(!state.space.entitiesById[id].alive)requireContract(a.current===null&&a.nextComboStep===1&&a.comboDeadline===null&&a.heldCommandId===null&&a.queuedCommandId===null,"Defeat must reset primary");
  }
  const records=primaryRecords(state).sort((a,b)=>a.startEventSequence-b.startEventSequence);
  for(const record of records) {
    closedRecord(record,["primaryActionId","sourceEntityId","sourceSequence","commandId","comboStep","aim","startedTick","phase","phaseStartedTick","phaseEndsTick",
      "hitResolved","hitAttackActionId","startEventId","finishEventId","startEventSequence","finishEventSequence","completedTick","interrupted"]);
    validateId("primaryActionId",record.primaryActionId);validateId("entityId",record.sourceEntityId);validateId("commandId",record.commandId);
    requireContract(record.primaryActionId<=value.actionIdHighWatermark,"Primary identity exceeds permanent fence");
    const owner=value.actorsById[record.sourceEntityId],profile=primaryProfile(state,record.sourceEntityId);
    safeInteger(record.sourceSequence,1);requireContract(record.sourceSequence===sequences[record.sourceEntityId]+1,"Primary source sequence gap");
    sequences[record.sourceEntityId]=record.sourceSequence;safeInteger(record.comboStep,1,profile.steps.length);validatePrimaryAim(record.aim);
    safeInteger(record.startedTick,0,state.tick);safeInteger(record.startEventSequence,1,state.eventEmission.lastEventSequence);
    for(const id of [record.startEventId,record.finishEventId]){validateId("eventId",id);requireContract(id<=value.eventIdHighWatermark&&!eventIds.has(id),"Primary event identity collision/fence");eventIds.add(id);}
    requireContract(typeof record.hitResolved==="boolean"&&typeof record.interrupted==="boolean","Invalid primary hit/completion flags");
    if(record.hitAttackActionId!==null)validateId("attackActionId",record.hitAttackActionId);
    const command=state.appliedCommandsById[record.commandId],wire=command&&JSON.parse(command.commandCanonical);
    requireContract(wire?.kind==="combat.primaryIntent"&&wire.payload.pressed&&command.tick<=record.startedTick&&
      state.playersById[wire.playerId]?.entityId===record.sourceEntityId&&command.result?.entityId===record.sourceEntityId,
      "Primary command/action causation mismatch");
    const timing=profile.steps[record.comboStep-1],ends=record.startedTick+timing.startup+timing.active+timing.recovery;
    if(record.completedTick===null) {
      requireContract(owner.current?.primaryActionId===record.primaryActionId&&record.finishEventSequence===null&&!record.interrupted,"Active primary ownership mismatch");
      requireContract(state.tick<ends&&same(primaryPhaseAt(record,profile,state.tick),{phase:record.phase,phaseStartedTick:record.phaseStartedTick,phaseEndsTick:record.phaseEndsTick}),"Primary phase timing mismatch");
      requireContract(record.hitResolved ? state.tick>=record.startedTick+timing.startup : state.tick<=record.startedTick+timing.startup,"Primary hit phase mismatch");
    } else {
      requireContract(value.completedById[record.primaryActionId]===record&&record.phase==="complete","Completed primary identity mismatch");
      safeInteger(record.completedTick,record.startedTick,state.tick);
      requireContract(record.phaseStartedTick===record.completedTick&&record.phaseEndsTick===record.completedTick,"Completed phase timing mismatch");
      requireContract(record.interrupted?record.completedTick<=ends:record.completedTick===ends&&record.hitResolved,"Primary completion timing mismatch");
      if(record.finishEventSequence!==null){safeInteger(record.finishEventSequence,record.startEventSequence+1,state.eventEmission.lastEventSequence);primaryEvents.push([record.finishEventSequence,record.completedTick]);}
      else requireContract(record.interrupted,"Completed attack needs finish event");
    }
    requireContract(record.hitAttackActionId===null||record.hitResolved,"Unresolved primary has a hit receipt");
    const hit=record.hitAttackActionId&&state.combat.appliedActionsById[record.hitAttackActionId];
    if(hit)requireContract(JSON.parse(hit.actionCanonical).primary?.primaryActionId===record.primaryActionId,"Primary hit receipt linkage mismatch");
    else if(record.hitAttackActionId)requireContract(record.hitAttackActionId<=state.history.combatBaseline.attackActionIdHighWatermark,"Missing unretired primary hit");
    primaryEvents.push([record.startEventSequence,record.startedTick]);
  }
  for(const [id,a] of Object.entries(value.actorsById))requireContract(a.nextSourceSequence===sequences[id]+1,"Primary source cursor mismatch");
  for(const [id,a] of Object.entries(value.actorsById))if(!a.current&&a.comboDeadline!==null){
    const last=records.filter(r=>r.sourceEntityId===id).at(-1);
    requireContract(last&&!last.interrupted&&a.comboDeadline===last.completedTick+primaryProfile(state,id).continuationTicks&&
      a.nextComboStep===last.comboStep%3+1&&(state.tick<a.comboDeadline||a.heldCommandId||a.queuedCommandId),"Idle combo deadline/cursor mismatch");
  }
  // Cross-family event chronology uses emission sequence, not opaque IDs.
  for(const receipt of Object.values(state.combat.appliedActionsById)){
    for(const id of Object.values(JSON.parse(receipt.actionCanonical).eventIds))requireContract(!eventIds.has(id),"Damage/primary event identity collision");
    for(let n=receipt.eventSequenceStart;n<=receipt.eventSequenceEnd;n++)primaryEvents.push([n,receipt.tick]);
  }
  if(state.history.combatBaseline.eventSequence>0)primaryEvents.push([state.history.combatBaseline.eventSequence,state.history.combatBaseline.tick]);
  primaryEvents.sort((a,b)=>a[0]-b[0]);primaryEvents.forEach((event,i)=>requireContract(i===0||event[0]>primaryEvents[i-1][0]&&event[1]>=primaryEvents[i-1][1],"Authority event chronology/collision mismatch"));
}
