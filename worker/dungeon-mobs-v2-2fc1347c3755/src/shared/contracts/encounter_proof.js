import { copyWire, canonicalStringify, closedRecord, requireContract } from "./wire.js";
import { validateId } from "./identities.js";
import { boundedCombatInteger } from "./combat_integer.js";
import { compactSafeHistory, appliedClientSequence } from "./history.js";
import { SLIME_CLEARING } from "../content/manual_primary.js";
import { manifestForState, worldPointForArea, validateCampaignDiscoveryProgress } from "./overworld.js";
export { SLIME_CLEARING } from "../content/manual_primary.js";

const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
export const initialEncounterProof=()=>({encounterId:SLIME_CLEARING.encounterId,cleared:false,requiredHostileIds:[]});
export function proofClearingForState(state) {
  const manifest = manifestForState(state);
  if (!manifest) return { spaceId: SLIME_CLEARING.spaceId, activation: SLIME_CLEARING.activation,
    hostilePosition: SLIME_CLEARING.hostilePosition };
  if(manifest.manifestVersion===2){const site=manifest.sites.find(candidate=>candidate.siteRole==="primary-proof");
    requireContract(site?.hostilePosition,"Generated primary proof site missing");
    return {spaceId:manifest.logicalSpaceId,activation:{...site.position,radius:SLIME_CLEARING.activation.radius},hostilePosition:site.hostilePosition};}
  return { spaceId: manifest.logicalSpaceId,
    activation: { ...worldPointForArea(manifest, SLIME_CLEARING.spaceId, SLIME_CLEARING.activation), radius: SLIME_CLEARING.activation.radius },
    hostilePosition: worldPointForArea(manifest, SLIME_CLEARING.spaceId, SLIME_CLEARING.hostilePosition) };
}
export function validateEncounterProof(state) {
  const p=state.campaign.encounterProof;
  const clearing=proofClearingForState(state);
  closedRecord(p,["encounterId","cleared","requiredHostileIds"]);
  requireContract(state.primary&&(state.campaign.geography||state.campaign.overworld)&&p.encounterId===SLIME_CLEARING.encounterId&&typeof p.cleared==="boolean","Invalid authored encounter proof");
  requireContract(Array.isArray(p.requiredHostileIds)&&p.requiredHostileIds.length<=1,"Authored roster bound");
  if(state.space.encounterId!==null) {
    requireContract(!p.cleared&&state.space.encounterId===p.encounterId&&state.space.spaceId===clearing.spaceId&&p.requiredHostileIds.length===1,"Authored active encounter mismatch");
    const id=p.requiredHostileIds[0];validateId("entityId",id);
    requireContract(state.space.entitiesById[id]?.contentDefinitionId===SLIME_CLEARING.hostileProfileId,"Authored hostile membership mismatch");
  } else requireContract(p.requiredHostileIds.length===0,"Safe proof retains hostile membership");
  requireContract(same(Object.values(state.space.entitiesById).filter(a=>a.team==="hostile").map(a=>a.entityId).sort(),p.requiredHostileIds),"Extra authored hostile");
}
export function canActivateProof(state) {
  const proof=state.campaign?.encounterProof;
  const clearing=proof&&proofClearingForState(state);
  return Boolean(proof&&!proof.cleared&&state.space.encounterId===null&&state.space.spaceId===clearing.spaceId&&
    Object.values(state.playersById).some(p=>p.connectionStatus==="connected"&&state.space.entitiesById[p.entityId].alive&&
      Math.hypot(state.space.entitiesById[p.entityId].position.x-clearing.activation.x,
        state.space.entitiesById[p.entityId].position.y-clearing.activation.y)<=clearing.activation.radius));
}
export function proofDefeated(state) {
  const p=state.campaign?.encounterProof;
  return Boolean(p&&!p.cleared&&p.requiredHostileIds.length===1&&p.requiredHostileIds.every(id=>!state.space.entitiesById[id].alive));
}
export function prepareProofStart(source,hostileId) {
  requireContract(canActivateProof(source),"Authored activation unavailable");validateId("entityId",hostileId);
  const clearing=proofClearingForState(source);
  requireContract(!source.space.entitiesById[hostileId],"Hostile identity already in use");
  const next=compactSafeHistory(source),p=next.content.definitionsById[SLIME_CLEARING.hostileProfileId];
  next.campaign.encounterProof.requiredHostileIds=[hostileId];
  next.space.entitiesById[hostileId]={entityId:hostileId,contentDefinitionId:p.contentDefinitionId,kind:"actor",ownerCharacterId:null,
    hp:copyWire(p.maxHp),maxHp:copyWire(p.maxHp),team:p.team,position:copyWire(clearing.hostilePosition),
    hullRadius:p.hullRadius,combatRadius:p.combatRadius,movementIntent:{x:0,y:0},moveSpeed:p.moveSpeed,alive:true,
    attackDamage:copyWire(p.attackDamage),attackReach:p.attackReach,attackReachMode:p.attackReachMode,
    attackDelayTicks:p.attackDelayTicks,attackTimer:p.attackDelayTicks,nextAttackActionSequence:1,movedLastTick:false,
    ai:{kind:"simpleMelee",acquireRange:SLIME_CLEARING.acquireRange,updatesApplied:0}};
  next.history.combatBaseline.actorsById[hostileId]={lastSourceSequence:0,hp:copyWire(p.maxHp),alive:true};
  for(const actor of Object.values(next.space.entitiesById)){actor.movementIntent={x:0,y:0};actor.movedLastTick=false;}
  return next;
}
export function prepareProofClear(source) {
  requireContract(proofDefeated(source)&&Object.values(source.primary.actorsById).every(a=>a.current===null&&a.heldCommandId===null&&a.queuedCommandId===null),"Victory requires defeated roster and settled primary actions");
  const next=copyWire(source);
  for(const id of next.campaign.encounterProof.requiredHostileIds)delete next.space.entitiesById[id];
  next.campaign.encounterProof={...initialEncounterProof(),cleared:true};
  next.space.encounterId=null;next.space.encounterAttemptId=null;
  for(const actor of Object.values(next.space.entitiesById)){actor.movementIntent={x:0,y:0};actor.movedLastTick=false;}
  return compactSafeHistory(next);
}

// Exact live checkpoints contain bounded authority-produced retirement anchors.
// These are not a client state admission protocol. The separate durable start
// snapshot remains the rollback source, never replaced by a retirement anchor.
export function validatePrimaryProgress(before,source) {
  requireContract(before.primary&&source.primary&&source.tick>=before.tick,"Invalid primary progress context");
  validateCampaignDiscoveryProgress(before,source);
  for(const key of ["session","content","activeSpaceRef","rngStatesByName"])
    requireContract(same(before[key],source[key]),`Primary progress changed ${key}`);
  requireContract(same(before.multiplayer.encounterParticipants,source.multiplayer.encounterParticipants),"Primary progress changed frozen roster");
  requireContract(same(Object.keys(before.playersById).sort(),Object.keys(source.playersById).sort()),"Primary player membership changed");
  for(const [id,player] of Object.entries(before.playersById))requireContract(same({...player,connectionStatus:source.playersById[id].connectionStatus},source.playersById[id]),"Primary ownership changed");
  for(const key of ["encounterId","encounterAttemptId","collision","contentDefinitionId"])
    requireContract(same(before.space[key],source.space[key]),"Primary space changed");
  requireContract(same(Object.keys(before.space.entitiesById).sort(),Object.keys(source.space.entitiesById).sort()),"Primary actor inventory changed");
  for(const [id,actor] of Object.entries(before.space.entitiesById)) {
    const current=source.space.entitiesById[id],normalized=copyWire(current);
    for(const key of ["hp","alive","position","movementIntent","attackTimer","nextAttackActionSequence","movedLastTick","ai"])normalized[key]=copyWire(actor[key]);
    requireContract(same(actor,normalized)&&boundedCombatInteger(current.hp)<=boundedCombatInteger(actor.hp)&&current.nextAttackActionSequence>=actor.nextAttackActionSequence,"Primary actor rules/resources changed");
    if(actor.ai)requireContract(same({...current.ai,updatesApplied:actor.ai.updatesApplied},actor.ai)&&current.ai.updatesApplied>=actor.ai.updatesApplied,"Primary AI rules changed");
    const old=before.history.combatBaseline.actorsById[id],now=source.history.combatBaseline.actorsById[id];
    requireContract(now.lastSourceSequence>=old.lastSourceSequence&&boundedCombatInteger(now.hp)<=boundedCombatInteger(old.hp),"Primary retirement actor anchor regressed");
  }
  requireContract(source.eventEmission.lastEventSequence>=before.eventEmission.lastEventSequence&&source.lastAppliedAuthorityOrder>=before.lastAppliedAuthorityOrder&&
    source.history.commandFloor.authorityOrder>=before.history.commandFloor.authorityOrder,"Primary authority cursor regressed");
  for(const key of ["sessionGeneration","sessionIdHighWatermark"])requireContract(same(before.history[key],source.history[key]),"Primary session fence changed");
  for(const key of ["eventSequence","tick","attackActionIdHighWatermark","eventIdHighWatermark"])
    requireContract(before.history.combatBaseline[key]===null||source.history.combatBaseline[key]>=before.history.combatBaseline[key],"Primary retirement cursor regressed");
  for(const key of ["actionIdHighWatermark","eventIdHighWatermark"])requireContract(before.primary[key]===null||source.primary[key]>=before.primary[key],"Primary identity fence regressed");
  for(const [id,a] of Object.entries(before.primary.actorsById))requireContract(source.primary.actorsById[id].profileId===a.profileId&&
    source.primary.actorsById[id].nextSourceSequence>=a.nextSourceSequence&&source.primary.actorsById[id].retiredSourceSequence>=a.retiredSourceSequence,"Primary source cursor regressed");
  for(const id of before.session.playerIds)requireContract(appliedClientSequence(source,id)>=appliedClientSequence(before,id),"Primary client cursor regressed");
}
