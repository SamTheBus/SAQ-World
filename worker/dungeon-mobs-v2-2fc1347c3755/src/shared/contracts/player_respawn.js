import {PLANNED_TOWN_START_VERSION,TOWN_START_TILES,PLANNED_TOWN_ID} from '../generation/planned_town_v1.js';
import {tileAddress} from '../generation/planned_world_foundation_v1.js';
import {projectToLocalFrameD9} from './local_world_frames_d9.js';
import { closedRecord, requireContract, safeInteger, canonicalStringify } from './wire.js';
import { validateCommand } from './commands.js';
import { collidesWithTiles } from '../rules/world_geometry.js';

export const PLAYER_RESPAWN_VERSION='player-respawn-d3r-v1';

// The generated campaign start is immutable. No client coordinates or new anchor registry.
export function startingSettlementRespawn(state,manifest,actor) {
  if(state.d9World?.plannedWorld){
    const town=state.d9World.plannedWorld.townPrototype===PLANNED_TOWN_START_VERSION,index=[...state.session.playerIds].sort().findIndex(id=>state.playersById[id].entityId===actor.entityId),slots=town?[...TOWN_START_TILES.slice(index),...TOWN_START_TILES.slice(0,index)]:null,space=state.spacesByInstanceId[state.overworldInstanceId];
    const position=town?slots.map(t=>projectToLocalFrameD9(tileAddress(t.x,t.y),state.d9World.runtime.frames)).find(p=>p&&!collidesWithTiles(space.collision,p.x,p.y,actor.hullRadius)&&!Object.values(state.playersById).some(v=>{const other=state.entitiesById[v.entityId];return other!==actor&&other.alive&&other.residency.spaceInstanceId===state.overworldInstanceId&&Math.hypot(p.x-other.position.x,p.y-other.position.y)<actor.hullRadius+other.hullRadius;})):projectToLocalFrameD9(state.d9World.plannedStart,state.d9World.runtime.frames);
    requireContract(position&&!collidesWithTiles(space.collision,position.x,position.y,actor.hullRadius),'Planned campaign respawn window unavailable');
    return {spaceInstanceId:state.overworldInstanceId,position:{x:position.x,y:position.y},settlementId:town?PLANNED_TOWN_ID:manifest.start.settlementId};
  }
  const {settlementId,position}=manifest.start,space=state.spacesByInstanceId[state.overworldInstanceId];
  requireContract(manifest.settlements.some(s=>s.settlementId===settlementId)&&manifest.safeRegions.some(r=>
    r.settlementId===settlementId&&position.x-actor.hullRadius>=r.x&&position.x+actor.hullRadius<r.x+r.width&&
    position.y-actor.hullRadius>=r.y&&position.y+actor.hullRadius<r.y+r.height)&&
    !collidesWithTiles(space.collision,position.x,position.y,actor.hullRadius),'Invalid generated respawn anchor');
  return {spaceInstanceId:state.overworldInstanceId,position,settlementId};
}

// At most one latest receipt per canonical participant; no per-life event journal.
export function validatePlayerRespawns(state,manifest) {
  const receipts=state.playerRespawnsById;
  if(receipts===undefined)return;
  closedRecord(receipts,[],state.session.playerIds);
  for(const [id,r] of Object.entries(receipts)) {
    closedRecord(r,['version','count','command','authorityOrder','tick','toResidencyRevision','settlementId']);
    requireContract(r.version===PLAYER_RESPAWN_VERSION,'Unknown player respawn version');
    const {residencyRevision,...packet}=r.command;validateCommand(packet);safeInteger(residencyRevision,1);
    const p=state.playersById[id],actor=state.entitiesById[p.entityId],c=r.command;
    requireContract(c.kind==='player.respawn'&&c.playerId===id&&c.campaignId===state.campaign.campaignId&&c.sessionId===state.session.sessionId,'Respawn receipt owner/context mismatch');
    safeInteger(c.clientSequence,1,state.appliedClientSequences[id]);
    safeInteger(r.authorityOrder,1,state.lastAppliedAuthorityOrder);safeInteger(r.tick,0,state.tick);
    safeInteger(r.toResidencyRevision,2,actor.residency.residencyRevision);safeInteger(r.count,1,r.toResidencyRevision-1);
    requireContract(r.toResidencyRevision===residencyRevision+1&&state.spacesByInstanceId[c.spaceInstanceId]?.spaceRevision===c.spaceRevision,'Respawn residency fence mismatch');
    requireContract(r.settlementId===(state.d9World?.plannedWorld?.townPrototype===PLANNED_TOWN_START_VERSION?PLANNED_TOWN_ID:manifest.start.settlementId),'Respawn anchor changed');
    if(actor.residency.residencyRevision===r.toResidencyRevision)requireContract(actor.residency.spaceInstanceId===state.overworldInstanceId,'Respawn destination mismatch');
    const history=state.residencyHistoryByEntityId[actor.entityId],from=history[residencyRevision],to=history[r.toResidencyRevision];
    if(from)requireContract(from.spaceInstanceId===c.spaceInstanceId&&from.spaceRevision===c.spaceRevision&&from.endTick===r.tick&&from.endAuthorityOrder===r.authorityOrder,'Respawn source history mismatch');
    if(to)requireContract(to.spaceInstanceId===state.overworldInstanceId&&to.tick===r.tick&&to.afterAuthorityOrder===r.authorityOrder,'Respawn destination history mismatch');
    const applied=state.appliedCommandsById[c.commandId];
    if(applied)requireContract(applied.status==='applied'&&applied.authorityOrder===r.authorityOrder&&applied.tick===r.tick&&applied.commandCanonical===canonicalStringify(c),'Respawn applied receipt mismatch');
  }
}

export function validatePlayerRespawnProgress(before,after) {
  for(const id of before.session.playerIds) {
    const previous=before.playerRespawnsById?.[id],next=after.playerRespawnsById?.[id];
    const actor=before.entitiesById[before.playersById[id].entityId],result=after.entitiesById[after.playersById[id].entityId];
    const count=previous?.count??0,nextCount=next?.count??0;
    requireContract(nextCount>=count,'Player respawn count regressed');
    if(nextCount===count)requireContract(canonicalStringify(previous??null)===canonicalStringify(next??null),'Player respawn receipt changed');
    else requireContract(next.authorityOrder>before.lastAppliedAuthorityOrder&&next.tick>=before.tick&&
      next.command.clientSequence>before.appliedClientSequences[id]&&next.command.residencyRevision>=actor.residency.residencyRevision&&
      next.toResidencyRevision>actor.residency.residencyRevision,'Respawn does not follow previous cut');
    if(!actor.alive&&result.alive)requireContract(nextCount>count,'Player revived without respawn command');
  }
}
