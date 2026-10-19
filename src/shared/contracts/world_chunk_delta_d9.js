import {copyWire,freezeWire,closedRecord,requireContract as check,safeInteger,canonicalStringify} from './wire.js';
import {localFramePositionD9,projectToLocalFrameD9} from './local_world_frames_d9.js';
import {validateWorldPosition} from './world_address.js';
import {addAmount,rewardAmount} from './economy_amount.js';
import {WOODLAND_FORT_TEMPLATE} from '../content/woodland_fort_d10.js';
import {functionalSiteGroupsD12} from './functional_site_d9.js';
export const CHUNK_DELTA_D9='world-chunk-delta-d9-v1';
const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
const inChunk=(p,c)=>p.chunkX===c.chunkX&&p.chunkY===c.chunkY;
const choose=(record,predicate)=>Object.fromEntries(Object.entries(record??{}).filter(([id,v])=>predicate(v,id)).map(([id,v])=>[id,copyWire(v)]));

export function proceduralGroupPinnedD9(state,groupId){
 const group=state.groupsById[groupId],runtime=state.d9World.runtime,def=runtime.groups.find(g=>g.groupId===groupId);if(!group||!def)return true;
 if(group.containment&&group.containment.mode!=='guard'||group.entityIds.some(id=>state.entitiesById[id]?.ai?.melee&&state.entitiesById[id].ai.melee.phase!=='idle'))return true;
 const ids=new Set(group.entityIds),combat=state.subweaponCombat;
 if(Object.values(combat.projectiles).some(b=>ids.has(b.intendedTargetId)||b.spaceInstanceId===group.spaceInstanceId&&group.entityIds.some(id=>{const a=state.entitiesById[id];return Math.hypot(a.position.x-b.position.x,a.position.y-b.position.y)<=b.remaining+a.hullRadius;})))return true;
 if([...Object.values(combat.effects),...Object.values(combat.controls??{})].some(e=>ids.has(e.targetId)))return true;
 for(const bucket of Object.values(combat.mastery??{}))for(const rows of Object.values(bucket))if(Object.values(rows).some(e=>ids.has(e.targetId)||e.hitIds?.some(id=>ids.has(id))||e.position&&e.spaceInstanceId===group.spaceInstanceId&&group.entityIds.some(id=>{const a=state.entitiesById[id];return Math.hypot(a.position.x-e.position.x,a.position.y-e.position.y)<=(e.radius??e.frames*8.5)+a.hullRadius;})))return true;
 // Ordinary return/home and healing complete before unloading a live actor.
 return def.members.some(m=>{const a=state.entitiesById[m.entityId];return a.alive&&(!same(a.hp,a.maxHp)||Math.hypot(a.position.x-m.position.x,a.position.y-m.position.y)>1e-7);});
}

// A footprint may omit its home-page pin only when that exact canonical group
// is complete and captureChunkDeltaD9 will serialize it with the page. This is
// deliberately stronger than merely finding an episode at the same address.
export function proceduralGroupDetachmentHomeD9(state,groupId){
 const group=state.groupsById[groupId],episode=state.d9World.episodes[groupId],definition=state.d9World.runtime.groups.find(g=>g.groupId===groupId);
 if(!group||!episode||episode.origin||!definition||proceduralGroupPinnedD9(state,groupId))return null;
 const groupIds=[...group.entityIds].sort(),definitionIds=definition.members.map(m=>m.entityId).sort();
 if(!same(groupIds,definitionIds)||group.entityIds.some(id=>!state.entitiesById[id]))return null;
 return {chunkX:episode.geography.chunkX,chunkY:episode.geography.chunkY};
}

// This is the immutable actor/group ownership inventory used by residency
// preflight. Ground items transfer through their sparse ownership pages first
// and therefore are deliberately absent from this inventory.
export function detachableProceduralGroupIdsD9(state,chunk){
 const functionalGroups=new Set(Object.values(state.d9World.functionalSitesById).filter(site=>site.siteKind!=='woodland-fort').flatMap(functionalSiteGroupsD12));
 return Object.entries(state.d9World.episodes).filter(([id,e])=>!functionalGroups.has(id)&&proceduralGroupDetachmentHomeD9(state,id)&&inChunk(e.geography,chunk)).map(([id])=>id).sort();
}

export function captureChunkDeltaD9(state,chunk){
 const runtime=state.d9World.runtime,encode=p=>copyWire(localFramePositionD9(p,runtime.frames)),encounters=[];
 const groups=detachableProceduralGroupIdsD9(state,chunk).map(id=>[id,state.d9World.episodes[id]]);
 for(const [groupId,episode] of groups){
 const group=state.groupsById[groupId];check(group&&!proceduralGroupPinnedD9(state,groupId),'Live combat/return pins this encounter');
  const storedGroup=copyWire(group),definition=copyWire(runtime.groups.find(g=>g.groupId===groupId)),entityIds=new Set(group.entityIds),actors=group.entityIds.map(id=>copyWire(state.entitiesById[id]));
  definition.anchor=encode(definition.anchor);for(const m of definition.members)m.position=encode(m.position);for(const a of actors)a.position=encode(a.position);
  if(storedGroup.containment){storedGroup.containment.homeAnchor=encode(storedGroup.containment.homeAnchor);for(const id of Object.keys(storedGroup.containment.memberHomesById))storedGroup.containment.memberHomesById[id]=encode(storedGroup.containment.memberHomesById[id]);}
  const resources=runtime.resources.filter(r=>r.groupId===groupId).map(r=>({...copyWire(r),position:encode(r.position)})),players={};
  for(const p of Object.values(state.playersById)){
   const i=p.inventory,rewards=choose(i.rewardsByEntityId,r=>r.episodeSource?.groupId===groupId),ids=new Set(Object.keys(rewards));
   for(const r of Object.values(rewards))r.position=encode(r.position);
   players[p.playerId]={rewards,gold:choose(i.goldAwardsByEntityId,(_r,id)=>ids.has(id)),souls:choose(i.economy.soulAwardsByEntityId,(_r,id)=>ids.has(id)),causalXp:choose(p.d8.causalXp,(_r,id)=>entityIds.has(id)),salvaged:choose(i.d7.salvaged,r=>r.origin.groupId===groupId),autoSalvaged:choose(i.d7.autoSalvaged,r=>r.origin.groupId===groupId)};
   // Nested terminal reward receipts also contain physical source positions.
   for(const terminal of [...Object.values(players[p.playerId].salvaged),...Object.values(players[p.playerId].autoSalvaged)])if(terminal.reward)terminal.reward.position=encode(terminal.reward.position);
  }
  encounters.push({group:storedGroup,economy:copyWire(state.encounterEconomy.groups[groupId]),episode:copyWire(episode),definition,actors,resources,players});
 }
 const drops={};
 for(const p of Object.values(state.playersById)){
  drops[p.playerId]={};
  for(const [id,drop] of Object.entries(p.inventory.renewal.groundBySourceId))if(drop.spaceInstanceId===state.overworldInstanceId){
   const position=encode(drop.position);if(inChunk(position,chunk))drops[p.playerId][id]={...copyWire(drop),position};
  }
 }
 // Deliberate Drops follow physical location, independently of the encounter
 // which originally created the item. They are not an auto-salvage deadline.
 return freezeWire({version:CHUNK_DELTA_D9,chunkId:chunk.identity.id,chunkX:chunk.chunkX,chunkY:chunk.chunkY,savedTick:state.tick,encounters,drops});
}

export function hydrateChunkDeltaD9(delta,chunk,frames){
 closedRecord(delta,['version','chunkId','chunkX','chunkY','savedTick','encounters','drops']);
 check(delta.version===CHUNK_DELTA_D9&&delta.chunkId===chunk.identity.id&&inChunk(delta,chunk),'Chunk delta identity mismatch');safeInteger(delta.savedTick);
 check(delta.encounters.length<=chunk.anchors.length+(chunk.compound?1:0),'Chunk encounter bound');const out=copyWire(delta),seen=new Set(),decode=p=>{validateWorldPosition(p);const local=projectToLocalFrameD9(p,frames);check(local,'Delta lies outside admitted local frame');return {x:local.x,y:local.y};};
 for(const e of out.encounters){
  check(!seen.has(e.group.groupId),'Duplicated chunk encounter');seen.add(e.group.groupId);const anchor=chunk.anchors.find(a=>a.id===e.episode.anchorId);
  const fort=chunk.compound?.siteId&&e.group.groupId===`site:${chunk.compound.siteId}:fort-courtyard`;
  check(fort?e.group.siteId===chunk.compound.siteId&&e.group.spaceInstanceId===e.actors[0]?.residency.spaceInstanceId&&inChunk(e.episode.geography,chunk)&&e.actors.length===WOODLAND_FORT_TEMPLATE.encounter.members.length&&e.definition.members.length===e.actors.length:anchor&&e.group.groupId==='ordinary:'+anchor.id.split(':').at(-1)&&e.episode.geography.anchorOrdinal===anchor.ordinal&&inChunk(e.episode.geography,chunk)&&e.actors.length===2&&e.definition.members.length===2,'Delta encounter provenance');
  e.definition.anchor=decode(e.definition.anchor);for(const member of e.definition.members)member.position=decode(member.position);for(const actor of e.actors)actor.position=decode(actor.position);for(const r of e.resources)r.position=decode(r.position);
  if(e.group.containment){e.group.containment.homeAnchor=decode(e.group.containment.homeAnchor);for(const id of Object.keys(e.group.containment.memberHomesById))e.group.containment.memberHomesById[id]=decode(e.group.containment.memberHomesById[id]);}
  for(const rows of Object.values(e.players)){
   for(const r of Object.values(rows.rewards))r.position=decode(r.position);
   for(const terminal of [...Object.values(rows.salvaged),...Object.values(rows.autoSalvaged)])if(terminal.reward)terminal.reward.position=decode(terminal.reward.position);
  }
 }
 for(const rows of Object.values(out.drops))for(const drop of Object.values(rows)){check(inChunk(drop.position,chunk),'Drop stored under wrong location');drop.position=decode(drop.position);}
 return out;
}

export function chunkPagedAccountingD9(delta){
 const players={};
 for(const e of delta.encounters)for(const [id,rows] of Object.entries(e.players)){
  const p=players[id]??={gold:'0',souls:0,salvageCredits:{}};
  for(const g of Object.values(rows.gold))p.gold=addAmount(p.gold,rewardAmount(g.amount));for(const n of Object.values(rows.souls))p.souls=safeInteger(p.souls+n);
  for(const r of [...Object.values(rows.salvaged),...Object.values(rows.autoSalvaged)])for(const [k,n] of Object.entries(r.materials))p.salvageCredits[k]=safeInteger((p.salvageCredits[k]??0)+n);
 }
 return players;
}
