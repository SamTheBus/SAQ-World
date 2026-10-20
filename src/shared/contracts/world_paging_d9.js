import {WORLD_COMBAT_HASH,hasWorldCombat} from '../content/world_combat_v1.js';
import {cryptGroupInfoV2 as cryptGroupInfo} from '../content/planned_crypt_policy_v2.js';
import {ruinGroupInfoV2 as ruinGroupInfoV1} from '../content/planned_ruin_policy_v2.js';
import {fortGroupFloorIndexV1} from '../content/planned_fort_policy_v1.js';
import {copyWire,canonicalStringify,closedRecord,requireContract as check,safeInteger} from './wire.js';
import {amount,addAmount,subtractAmount} from './economy_amount.js';
import {captureChunkDeltaD9,hydrateChunkDeltaD9,chunkPagedAccountingD9} from './world_chunk_delta_d9.js';
import {captureWorldPositionsD9} from './world_runtime_d9.js';
import {SALVAGE_MATERIALS} from '../content/generated_gear.js';
import {validateWorldPosition,normalizeWorldPosition,floorDiv} from './world_address.js';
import {projectToLocalFrameD9} from './local_world_frames_d9.js';
import {functionalSiteDefinitionForGroupD10} from '../content/functional_site_registry_d10.js';
const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
export const emptyWorldPagingD9=playerIds=>({version:'world-paging-d9-v1',players:Object.fromEntries(playerIds.map(id=>[id,{gold:'0',souls:0,salvageCredits:{}}])),originsByGroup:{},indexedRevisions:{},remoteGearByPlayer:Object.fromEntries(playerIds.map(id=>[id,{}])),coldObligations:{}});
export function validateWorldPagingD9(paging){
 closedRecord(paging,['version','players','originsByGroup','indexedRevisions','remoteGearByPlayer','coldObligations']);check(paging.version==='world-paging-d9-v1','World paging version');
 for(const p of Object.values(paging.players)){closedRecord(p,['gold','souls','salvageCredits']);amount(p.gold);safeInteger(p.souls);closedRecord(p.salvageCredits,[],SALVAGE_MATERIALS);for(const n of Object.values(p.salvageCredits))safeInteger(n,1);}
 closedRecord(paging.indexedRevisions,[],Object.keys(paging.players));for(const revision of Object.values(paging.indexedRevisions))safeInteger(revision);
 closedRecord(paging.remoteGearByPlayer,Object.keys(paging.players));for(const [pid,rows] of Object.entries(paging.remoteGearByPlayer))for(const [id,r] of Object.entries(rows)){closedRecord(r,['item','disposition','recordHash'],['origin']);check(r.item.itemId===id&&r.item.ownerPlayerId===pid&&['DROPPED','SALVAGED','AUTO_SALVAGED'].includes(r.disposition)&&/^[a-f0-9]{64}$/.test(r.recordHash),'Remote gear proof identity');if(r.origin){if(r.origin.servicePurchase){closedRecord(r.origin,['servicePurchase','sourceEntityId']);check(r.origin.servicePurchase===r.item.sourceEntityId,'Remote purchased origin mismatch');}else {closedRecord(r.origin,['groupId','episode','sourceEntityId'],['progression','archive']);safeInteger(r.origin.episode);}check(r.origin.sourceEntityId===r.item.sourceEntityId,'Remote gear origin mismatch');}}
 for(const rows of Object.values(paging.coldObligations)){closedRecord(rows,Object.keys(paging.players));for(const n of Object.values(rows))if(n!==null)safeInteger(n);}
 for(const [id,g] of Object.entries(paging.originsByGroup)){closedRecord(g,['groupId','episode','rank','chunkX','chunkY','anchorOrdinal','entityIds'],['combatHash']);const site=functionalSiteDefinitionForGroupD10(id),generated=/^site:site:[a-f0-9]{32}:cave-floor-[0-3]$/.test(id),fortFloor=fortGroupFloorIndexV1(id),ruin=cryptGroupInfo(id)??ruinGroupInfoV1(id),count=ruin?ruin.count:fortFloor!==null?3:site?.template.encounter.members.length??(generated?null:2);check(g.groupId===id&&['C','B','A','S'].includes(g.rank)&&(g.combatHash===WORLD_COMBAT_HASH?g.entityIds.length>=1&&g.entityIds.length<=40:count===null?g.entityIds.length>=1&&g.entityIds.length<=5:g.entityIds.length===count),'Cold origin identity');safeInteger(g.episode);safeInteger(g.anchorOrdinal,0,generated||fortFloor!==null||ruin?3:1);if(g.combatHash!==undefined)check(g.combatHash===WORLD_COMBAT_HASH,'Unknown roster provenance policy');if(fortFloor!==null)check(g.anchorOrdinal===fortFloor,'Fort gear floor provenance drift');if(ruin)check(g.anchorOrdinal===ruin.floor,'Ruin gear floor provenance drift');validateWorldPosition({chunkX:g.chunkX,chunkY:g.chunkY,localX:0,localY:0});}
 return paging;
}
export function coldGearOriginD9(state,id){return state.d9World?.paging.originsByGroup[id]??null;}
export function pruneColdOriginsD9(state){
 const used=new Set();for(const p of Object.values(state.playersById))for(const o of [...Object.values(p.inventory.renewal.originsByItemId),...Object.values(p.inventory.renewal.groundBySourceId).map(r=>r.origin),...Object.values(p.inventory.d7.salvaged).map(r=>r.origin),...Object.values(p.inventory.d7.autoSalvaged).map(r=>r.origin),...Object.values(p.inventory.services?.salesByItemId??{}).map(r=>r.origin)])if(o?.groupId&&!state.groupsById[o.groupId])used.add(o.groupId);
 for(const id of Object.keys(state.d9World.paging.originsByGroup))if(!used.has(id))delete state.d9World.paging.originsByGroup[id];
}
function accounting(state,delta,direction){const players=copyWire(state.d9World.paging.players);for(const [id,totals] of Object.entries(chunkPagedAccountingD9(delta))){const p=players[id];check(p,'Unknown paged account owner');p.gold=direction===1?addAmount(p.gold,totals.gold):subtractAmount(p.gold,totals.gold);p.souls=safeInteger(p.souls+direction*totals.souls);for(const [k,n] of Object.entries(totals.salvageCredits)){const next=safeInteger((p.salvageCredits[k]??0)+direction*n);if(next)p.salvageCredits[k]=next;else delete p.salvageCredits[k];}}return players;}

// This handoff retains every receipt in the prepared chunk page. The live
// wallet/material amounts never change merely because its source leaves RAM.
export function detachChunksRuntimeD9(state,transfers){
 check(Array.isArray(transfers)&&transfers.length>0,'Chunk detachment batch');
 let root=state.d9World.regionIndex;const chunkIds=new Set(),groups=new Set();
 // Validate the complete immutable inventory before changing actors or pages.
 // A group may own a corpse on a second released page, so all encounter owners
 // must be serialized and detached before any collision page disappears.
 for(const {chunk,delta,prepared} of transfers){
  check(!chunkIds.has(chunk.identity.id),'Duplicate chunk detachment');chunkIds.add(chunk.identity.id);
  check(root===prepared.expectedRoot,'Stale chunk page root');root=prepared.root;
  check(same(captureChunkDeltaD9(state,chunk),delta),'Chunk changed during page preparation');
  check(Object.values(delta.drops).every(rows=>Object.keys(rows).length===0),'Deliberate Drops require their ownership-page handoff');
  for(const e of delta.encounters){check(!groups.has(e.group.groupId),'Duplicate encounter detachment');groups.add(e.group.groupId);}
 }
 for(const {delta} of transfers){
  state.d9World.paging.players=accounting(state,delta,1);
  for(const e of delta.encounters){const id=e.group.groupId,g=e.episode.geography;state.d9World.paging.originsByGroup[id]={groupId:id,episode:e.economy.episode,rank:g.rank,chunkX:g.chunkX,chunkY:g.chunkY,anchorOrdinal:g.anchorOrdinal,entityIds:[...e.group.entityIds],...(hasWorldCombat(state)?{combatHash:WORLD_COMBAT_HASH}:{})};
   for(const a of e.actors)delete state.entitiesById[a.entityId];delete state.groupsById[id];delete state.encounterEconomy.groups[id];delete state.d9World.episodes[id];
   for(const [pid,rows] of Object.entries(e.players)){const p=state.playersById[pid],i=p.inventory;for(const key of Object.keys(rows.rewards)){delete i.rewardsByEntityId[key];delete i.goldAwardsByEntityId[key];delete i.economy.soulAwardsByEntityId[key];}for(const key of Object.keys(rows.causalXp))delete p.d8.causalXp[key];for(const key of Object.keys(rows.salvaged))delete i.d7.salvaged[key];for(const key of Object.keys(rows.autoSalvaged))delete i.d7.autoSalvaged[key];}
  }
 }
 const runtime=state.d9World.runtime;runtime.groups=runtime.groups.filter(g=>!groups.has(g.groupId));runtime.resources=runtime.resources.filter(r=>!groups.has(r.groupId));runtime.chunks=runtime.chunks.filter(c=>!chunkIds.has(c.identity.id));
 state.spacesByInstanceId[state.overworldInstanceId].collision.pages=runtime.chunks.map(c=>({chunkX:c.chunkX,chunkY:c.chunkY,tiles:[...c.collision.tiles]}));
 state.d9World.regionIndex=root;runtime.revision+=transfers.length;pruneColdOriginsD9(state);captureWorldPositionsD9(state);
}
export function detachChunkRuntimeD9(state,chunk,delta,prepared){detachChunksRuntimeD9(state,[{chunk,delta,prepared}]);}
export function attachChunkRuntimeD9(state,chunk,delta){
 const runtime=state.d9World.runtime;check(!runtime.chunks.some(c=>c.identity.id===chunk.identity.id),'Duplicate terrain admission');
 const decoded=delta?hydrateChunkDeltaD9(delta,chunk,runtime.frames):null;
 if(decoded){check(Object.values(decoded.drops).every(rows=>Object.keys(rows).length===0),'Drop page requires ownership handoff');for(const e of decoded.encounters){check(!state.groupsById[e.group.groupId]&&e.actors.every(a=>!state.entitiesById[a.entityId]),'Duplicate encounter load');for(const [pid,rows] of Object.entries(e.players)){const p=state.playersById[pid];check(p,'Unknown paged owner');for(const id of Object.keys(rows.rewards))check(!p.inventory.rewardsByEntityId[id],'Duplicate paged reward');}}
  state.d9World.paging.players=accounting(state,delta,-1);
 }
 runtime.chunks.push(copyWire(chunk));
 if(decoded)for(const e of decoded.encounters){
  const id=e.group.groupId;state.groupsById[id]=copyWire(e.group);state.encounterEconomy.groups[id]=copyWire(e.economy);state.d9World.episodes[id]=copyWire(e.episode);runtime.groups.push(copyWire(e.definition));runtime.resources.push(...e.resources.map(copyWire));for(const a of e.actors)state.entitiesById[a.entityId]=copyWire(a);
  for(const [pid,rows] of Object.entries(e.players)){const p=state.playersById[pid],i=p.inventory;Object.assign(i.rewardsByEntityId,copyWire(rows.rewards));Object.assign(i.goldAwardsByEntityId,copyWire(rows.gold));Object.assign(i.economy.soulAwardsByEntityId,copyWire(rows.souls));Object.assign(p.d8.causalXp,copyWire(rows.causalXp));Object.assign(i.d7.salvaged,copyWire(rows.salvaged));Object.assign(i.d7.autoSalvaged,copyWire(rows.autoSalvaged));}
 }
 if(!decoded&&chunk.compound){const fort=state.d9World.functionalSitesById[chunk.compound.siteId],initial=fort?.initial,home=initial?.episode.geography;
  if(home?.chunkX===chunk.chunkX&&home?.chunkY===chunk.chunkY){
   check(!state.groupsById[initial.group.groupId],'Duplicate Fort courtyard admission');
   const x=BigInt(fort.compound.tileX),y=BigInt(fort.compound.tileY),cx=floorDiv(x,32n),cy=floorDiv(y,26n),local=point=>{const address=normalizeWorldPosition({chunkX:String(cx),chunkY:String(cy),localX:Number(x-cx*32n)*32+point.x,localY:Number(y-cy*26n)*32+point.y}),q=projectToLocalFrameD9(address,runtime.frames);check(q,'Fort courtyard lies outside admitted frame');return {x:q.x,y:q.y};};
   const definition=copyWire(initial.definition);definition.anchor=local(definition.anchor);for(const m of definition.members)m.position=local(m.position);runtime.groups.push(definition);
   const group=copyWire(initial.group);if(group.containment){group.containment.homeAnchor=local(group.containment.homeAnchor);for(const id of Object.keys(group.containment.memberHomesById))group.containment.memberHomesById[id]=local(group.containment.memberHomesById[id]);}state.groupsById[group.groupId]=group;state.encounterEconomy.groups[group.groupId]=copyWire(initial.economy);state.d9World.episodes[group.groupId]=copyWire(initial.episode);
   const resource=copyWire(initial.resource);resource.position=local(resource.position);runtime.resources.push(resource);
   for(const source of initial.actors){const actor=copyWire(source);actor.position=local(actor.position);state.entitiesById[actor.entityId]=actor;}
  }
 }
 state.spacesByInstanceId[state.overworldInstanceId].collision.pages=runtime.chunks.map(c=>({chunkX:c.chunkX,chunkY:c.chunkY,tiles:[...c.collision.tiles]}));runtime.revision++;pruneColdOriginsD9(state);captureWorldPositionsD9(state);
}
