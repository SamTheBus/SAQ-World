import {hastedTiming} from '../shared/contracts/attack_haste.js';
import {resolvePlayerStats} from '../shared/contracts/player_stats.js';
import { copyWire, requireContract, safeInteger } from "../shared/contracts/wire.js";
import { primaryProfile, primaryPhaseAt, prunePrimaryHistory, clearPrimaryInput } from "../shared/contracts/primary.js";
import { createEvent } from "../shared/contracts/events.js";
import { canActorAttack } from "./combat_rules.js";

const actors = state => state.entitiesById ?? state.space.entitiesById;
const sourceSpace = (state,id) => state.entitiesById ? state.spacesByInstanceId[state.entitiesById[id].residency.spaceInstanceId] : state.space;
const primaryAllowed = state => Boolean(state.entitiesById) || state.space.encounterId !== null;
function eventFor(next,action,finished) {
  const space=sourceSpace(next,action.sourceEntityId);
  const player=Object.values(next.playersById).find(p=>p.entityId===action.sourceEntityId);
  const eventSequence=safeInteger(next.eventEmission.lastEventSequence+1,1);next.eventEmission.lastEventSequence=eventSequence;
  if(finished)action.finishEventSequence=eventSequence;else action.startEventSequence=eventSequence;
  return createEvent({protocolVersion:next.protocolVersion,campaignId:next.campaign.campaignId,sessionId:next.session.sessionId,
    eventId:finished?action.finishEventId:action.startEventId,eventSequence,tick:next.tick,
    kind:finished?"combat.primaryFinished":"combat.primaryStarted",causation:{commandId:action.commandId,playerId:player.playerId},
    source:{playerId:player.playerId,characterId:player.characterId,entityId:player.entityId},subject:{entityId:null},
    spaceInstanceId:space.spaceInstanceId,spaceRevision:space.spaceRevision,
    payload:{primaryActionId:action.primaryActionId,sourceEntityId:action.sourceEntityId,sourceSequence:action.sourceSequence,comboStep:action.comboStep}});
}
export function applyPrimaryIntent(next,entityId,command) {
  const a=next.primary?.actorsById[entityId];requireContract(a&&primaryAllowed(next),"Primary attack needs an active attempt");
  if(command.payload.pressed) {
    if(next.subweaponCombat?.actors[entityId]?.guard?.requested)return;
    // Duplicate downs while held do not add a second tap. A deliberate up/down
    // edge can occupy the one pending slot while another swing is in flight.
    a.facing=copyWire(command.payload.aim);
    if(a.heldCommandId===null){a.heldCommandId=command.commandId;if(a.queuedCommandId===null)a.queuedCommandId=command.commandId;}
  } else {a.heldCommandId=null;if(command.payload.cancelQueued)a.queuedCommandId=null;}
}
export function readyPrimarySources(state) {
  if(!state.primary||!primaryAllowed(state))return [];
  return Object.keys(state.primary.actorsById).sort().filter(id=>{
    const a=state.primary.actorsById[id],p=Object.values(state.playersById).find(p=>p.entityId===id);
    return !state.subweaponCombat?.actors[id]?.guard?.requested&&!a.current&&(a.queuedCommandId||a.heldCommandId)&&actors(state)[id].alive&&p.connectionStatus==="connected";
  });
}
export function beginPrimary(next,entityId,ids) {
  requireContract(readyPrimarySources(next).includes(entityId),"Primary source is not ready");
  const a=next.primary.actorsById[entityId],profile=primaryProfile(next,entityId);
  requireContract(next.primary.actionIdHighWatermark===null||ids.primaryActionId>next.primary.actionIdHighWatermark,"Primary identity fence violation");
  const eventIds=[ids.startEventId,ids.finishEventId];
  requireContract(ids.startEventId!==ids.finishEventId&&eventIds.every(id=>next.primary.eventIdHighWatermark===null||id>next.primary.eventIdHighWatermark),"Primary event reservation fence violation");
  next.primary.actionIdHighWatermark=ids.primaryActionId;next.primary.eventIdHighWatermark=eventIds.sort().at(-1);
  const player=Object.values(next.playersById).find(p=>p.entityId===entityId),timing=hastedTiming(profile.steps[a.nextComboStep-1],resolvePlayerStats(player).activeHaste);
  const record={...(player.inventory?.d7?{timing}:{}),primaryActionId:ids.primaryActionId,sourceEntityId:entityId,sourceSequence:a.nextSourceSequence++,
    commandId:a.queuedCommandId??a.heldCommandId,comboStep:a.nextComboStep,aim:copyWire(a.facing),startedTick:next.tick,
    phase:"startup",phaseStartedTick:next.tick,phaseEndsTick:next.tick+timing.startup,
    hitResolved:false,hitAttackActionId:null,startEventId:ids.startEventId,finishEventId:ids.finishEventId,
    startEventSequence:0,finishEventSequence:null,completedTick:null,interrupted:false};
  a.current=record;a.queuedCommandId=null;a.comboDeadline=null;
  return eventFor(next,record,false);
}
function complete(next,id,interrupted) {
  const a=next.primary.actorsById[id],record=a.current,profile=primaryProfile(next,id);
  if(!record)return null;
  record.phase="complete";record.phaseStartedTick=next.tick;record.phaseEndsTick=next.tick;
  record.completedTick=next.tick;record.interrupted=interrupted;
  const event=interrupted?null:eventFor(next,record,true);
  next.primary.completedById[record.primaryActionId]=record;a.current=null;
  a.nextComboStep=interrupted?1:record.comboStep%profile.steps.length+1;a.comboDeadline=interrupted?null:next.tick+profile.continuationTicks;
  return event;
}
export function cancelDefeatedPrimaries(next,onlyEntityId=null) {
  if(!next.primary)return;
  for(const [id,a] of Object.entries(next.primary.actorsById))if((onlyEntityId===null||onlyEntityId===id)&&!actors(next)[id].alive){
    clearPrimaryInput(next,id);complete(next,id,true);a.nextComboStep=1;a.comboDeadline=null;
  }
  prunePrimaryHistory(next);
}
export function advancePrimaryPhases(next) {
  const events=[];if(!next.primary)return events;
  cancelDefeatedPrimaries(next);
  for(const [id,a] of Object.entries(next.primary.actorsById)) {
    if(a.current){
      const phase=primaryPhaseAt(a.current,primaryProfile(next,id),next.tick);
      if(next.tick>=phase.phaseEndsTick){const event=complete(next,id,false);if(event)events.push(event);}
      else Object.assign(a.current,phase);
    } else if(a.comboDeadline!==null&&next.tick>=a.comboDeadline&&!a.queuedCommandId&&!a.heldCommandId){a.nextComboStep=1;a.comboDeadline=null;}
  }
  prunePrimaryHistory(next);return events;
}
export function primaryMovementIntent(state,actor) {
  const action=state.primary?.actorsById[actor.entityId]?.current;if(!action)return actor.movementIntent;
  const timing=action.timing??primaryProfile(state,actor.entityId).steps[action.comboStep-1],factor=timing[action.phase+"Movement"];
  return {x:actor.movementIntent.x*factor,y:actor.movementIntent.y*factor};
}
export function pendingPrimaryHits(state) {
  return Object.entries(state.primary?.actorsById??{}).filter(([,a])=>a.current?.phase==="active"&&!a.current.hitResolved).map(([id])=>id).sort();
}
export function selectPrimaryTarget(state,sourceEntityId) {
  const source=state.space.entitiesById[sourceEntityId],action=state.primary.actorsById[sourceEntityId].current;
  requireContract(action?.phase==="active"&&!action.hitResolved,"No unresolved active primary phase");
  const minimum=primaryProfile(state,sourceEntityId).forwardDotMinimum;
  return selectForwardActor(source,Object.values(state.space.entitiesById),action.aim,minimum);
}

// Caller supplies eligible same-instance actors. B1 math and tie ordering are unchanged.
export function selectForwardActor(source,actors,aim,minimum,eligible=canActorAttack) {
  const candidates=[];
  for(const target of actors) {
    if(target.kind!=="actor"||!target.alive||target.team===source.team||!eligible(source,target))continue;
    const dx=target.position.x-source.position.x,dy=target.position.y-source.position.y,distance=Math.hypot(dx,dy);
    const dot=distance===0?1:(dx*aim.x+dy*aim.y)/distance;
    if(dot>=minimum)candidates.push({id:target.entityId,distance,dot});
  }
  candidates.sort((a,b)=>a.distance-b.distance||b.dot-a.dot||(a.id<b.id?-1:a.id>b.id?1:0));
  return candidates[0]?.id??null;
}
