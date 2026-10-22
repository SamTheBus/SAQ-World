import {ORDINARY_ENEMIES,DUNGEON_MOBS_V1_PROFILES,ordinaryEnemyForProfile,resolveOrdinaryProfile} from '../content/ordinary_enemies.js';
import {hasWorldCombat,worldEnemyStats} from '../content/world_combat_v1.js';
import {worldOrdinaryMeleeProfile} from '../content/world_melee_geometry.js';
import {DUNGEON_RANGED_FAMILIES_V1,DUNGEON_MOBS_V1_MELEE_MOTION} from '../content/dungeon_mobs_v1.js';
import {HOSTILE_MOTION_D11_2_VERSION} from '../content/encounter_motion_d11_2.js';
import {hashReward} from '../content/economy_rewards.js';
import {copyWire,canonicalStringify,closedRecord,safeInteger,requireContract as check} from './wire.js';
import {combatInteger,compareCombat} from './combat_amount.js';

export const ORDINARY_ROSTER_V1='dungeon-ordinary-roster-v1';
const same=(a,b)=>a===b||a!==undefined&&b!==undefined&&canonicalStringify(a)===canonicalStringify(b);
const rankFor=id=>['C','B','A','S'][(ORDINARY_ENEMIES.findIndex(e=>ordinaryEnemyForProfile(id)===e)>=0?(parseInt(id.slice(8),16)-1)%4:0)];
const origin=s=>s.content?.definitionsById?.[s.campaign.overworld?.manifestDefinitionId];
const recordFor=(s,id)=>s.d9World?.episodes[id]?.ordinaryRoster;
const newProfilesReady=s=>Boolean(s.d9World?.ordinaryRoster)||DUNGEON_MOBS_V1_PROFILES.every(p=>same(s.content?.definitionsById?.[p.contentDefinitionId],p));
const poolFor=(biome,family,tier)=>{
 if(family==='crypt'&&tier==='deep')return {key:'crypt:deep',ranged:['void_orb'],melee:['marsh_ghost','corroded_golem']};
 if(family==='crypt'||family==='ruin')return {key:family+':haunted',ranged:['toxic_fly'],melee:['marsh_ghost','corroded_golem']};
 if(['wetland','marsh'].includes(biome))return {key:'wetland',ranged:['toxic_fly'],melee:['swamp_basilisk','marsh_ghost','corroded_golem']};
 if(biome==='volcanic')return {key:'volcanic',ranged:['magma_elemental'],melee:['lava_serpent','hell_bat','slag_slime']};
 if(['upland','rocky-uplands','frostland'].includes(biome))return {key:'upland',ranged:['wyrmling'],melee:[]};
 if(biome==='desert')return {key:'desert',ranged:[],melee:[]};
 return {key:'woodland',ranged:['thorn_wyrm'],melee:[]};
};

function contextFor(s,g){
 const m=origin(s),site=Object.values(s.d9World.functionalSitesById).find(site=>site.floors?.some(f=>f.groupId===g.groupId)),floor=site?.floors.find(f=>f.groupId===g.groupId);
 if(floor){
  const family=site.familyId?.split(':').at(-1)??site.siteKind?.replace('procedural-',''),pool=poolFor(site.socket.region.biome,family,site.sizeTier),members=floor.encounter.members.map((member,n)=>({entityId:floor.enemyIds[n],profileId:member.role==='arachnid-treant'?s.entitiesById[floor.enemyIds[n]].contentDefinitionId:resolveOrdinaryProfile(ORDINARY_ENEMIES.find(e=>e.family===member.family),floor.encounter.rank).contentDefinitionId,roomId:member.roomId}));
  return {pool,members,protected:new Set(),floor:true};
 }
 const legacySite=m?.siteInteriors?.find(site=>site.groups.some(d=>d.groupId===g.groupId)),original=m?.population?.groups.find(d=>d.groupId===g.groupId)??legacySite?.groups.find(d=>d.groupId===g.groupId),expanded=s.d9World.originHordes?.groupsById[g.groupId]?.definition;
 if(original){
  const definition=expanded??original,region=m.regions.find(r=>r.regionId===g.regionId),pool=poolFor(region?.biome??'woodland',legacySite?'ruin':null,null);
  return {pool,members:definition.members,protected:new Set(original.members.map(m=>m.entityId)),floor:false};
 }
 const definition=s.d9World.runtime.groups.find(d=>d.groupId===g.groupId);if(!definition)return null;
 const episode=s.d9World.episodes[g.groupId],chunk=s.d9World.runtime.chunks.find(c=>c.chunkX===episode?.geography.chunkX&&c.chunkY===episode?.geography.chunkY),pool=poolFor(chunk?.region.biome??'woodland',null,null);
 return {pool,members:definition.members,protected:new Set(),floor:false};
}

function history(s,id){
 const e=s.encounterEconomy.groups[id];if(Object.keys(e.usedResources).length)return true;
 return Object.values(s.playersById).some(p=>[...Object.values(p.inventory.rewardsByEntityId??{}),...Object.values(p.inventory.renewal?.originsByItemId??{}),...Object.values(p.inventory.renewal?.groundBySourceId??{}),...Object.values(p.inventory.d7?.salvaged??{}),...Object.values(p.inventory.d7?.autoSalvaged??{}),...Object.values(p.inventory.services?.salesByItemId??{})].some(r=>{const q=r.episodeSource??r.origin??r.reward?.episodeSource??r;return q.groupId===id&&(q.episode===undefined||q.episode===e.episode);}));
}
function eligible(s,g,{safe=true,freshEpisodeFrom=null}={}){
 if(g.cleared||!s.d9World.episodes[g.groupId]||history(s,g.groupId))return false;
 const e=s.encounterEconomy.groups[g.groupId],fresh=Number.isSafeInteger(freshEpisodeFrom)&&e.episode===freshEpisodeFrom+1&&e.startedTick===s.tick&&s.d9World.episodes[g.groupId].episode===e.episode;
 if(freshEpisodeFrom!==null&&!fresh)return false;
 if(!g.entityIds.every(id=>{const a=s.entitiesById[id];return a.alive&&compareCombat(a.hp,a.maxHp)===0&&(fresh||a.nextAttackActionSequence===1);} ))return false;
 if(safe&&g.entityIds.some(id=>{const a=s.entitiesById[id];return Object.values(s.playersById).some(p=>{const b=s.entitiesById[p.entityId];return b.residency.spaceInstanceId===g.spaceInstanceId&&Math.hypot(a.position.x-b.position.x,a.position.y-b.position.y)<384;});}))return false;
 return !g.entityIds.some(id=>{const a=s.entitiesById[id];return a.ai?.melee?.phase&&a.ai.melee.phase!=='idle';});
}
function selection(s,g,context){
 const seed=s.campaign.seed.seedHex+'/'+g.groupId+'/'+ORDINARY_ROSTER_V1,exempt=id=>context.protected.has(id)||s.eliteCombat?.elitesByEntityId[id]||s.bossCombat?.bossesByEntityId[id]||s.bossCombat?.summonsByEntityId[id];
 const candidates=context.members.filter(m=>!exempt(m.entityId)&&ordinaryEnemyForProfile(m.profileId)).map(m=>({...m,n:hashReward(seed+'/'+m.entityId)})).sort((a,b)=>a.n-b.n||a.entityId.localeCompare(b.entityId));
 if(!candidates.length)return {};
 const desiredRanged=context.floor?Math.min(4,Math.max(3,Math.round(g.entityIds.length/7))):g.entityIds.length>=10?2:1,maxRanged=context.pool.ranged.length?Math.min(desiredRanged,Math.max(0,Math.floor((g.entityIds.length-1)/2))):0,ranged=[],seenRooms=new Set();
 // Spread shooters among existing rooms before using a second slot in one room.
 if(maxRanged)for(const c of candidates)if(!seenRooms.has(c.roomId??'pack')){ranged.push(c);seenRooms.add(c.roomId??'pack');if(ranged.length===maxRanged)break;}
 for(const c of candidates)if(ranged.length<maxRanged&&!ranged.includes(c))ranged.push(c);
 const result={},used=new Set(ranged.map(m=>m.entityId));
 for(const [n,m] of ranged.entries()){const enemy=ORDINARY_ENEMIES.find(e=>e.family===context.pool.ranged[n%context.pool.ranged.length]),profile=resolveOrdinaryProfile(enemy,rankFor(m.profileId));result[m.entityId]={fromProfileId:m.profileId,toProfileId:profile.contentDefinitionId};}
 const meleeCount=context.pool.melee.length?Math.max(1,Math.min(context.floor?6:3,Math.floor(g.entityIds.length/4))):0,melee=candidates.filter(m=>!used.has(m.entityId)).slice(0,meleeCount);
 for(const [n,m]of melee.entries()){const enemy=ORDINARY_ENEMIES.find(e=>e.family===context.pool.melee[(hashReward(seed+'/melee')+n)%context.pool.melee.length]),profile=resolveOrdinaryProfile(enemy,rankFor(m.profileId));result[m.entityId]={fromProfileId:m.profileId,toProfileId:profile.contentDefinitionId};}
 return Object.fromEntries(Object.entries(result).sort(([a],[b])=>a.localeCompare(b)));
}

export function ordinaryRosterDefinition(s,definition){
 const row=recordFor(s,definition.groupId);if(!row)return definition;
 return {...definition,members:definition.members.map(m=>{const sub=row.substitutionsById[m.entityId];if(!sub)return m;const enemy=ordinaryEnemyForProfile(sub.toProfileId);return {...m,profileId:sub.toProfileId,enemyDefinitionId:enemy.enemyDefinitionId};})};
}
export function ordinaryRosterProfile(s,groupId,entityId,fallback){
 const sub=recordFor(s,groupId)?.substitutionsById[entityId];if(!sub)return fallback;
 check(sub.fromProfileId===fallback.contentDefinitionId,'Roster source profile differs from physical recipe');return s.content.definitionsById[sub.toProfileId];
}
function applySubstitutions(s,g,row){
 for(const [id,sub] of Object.entries(row.substitutionsById)){
  const a=s.entitiesById[id],enemy=ordinaryEnemyForProfile(sub.toProfileId),profile=worldOrdinaryMeleeProfile(s,resolveOrdinaryProfile(enemy,rankFor(sub.toProfileId))),level=g.threatSnapshot?.levelsByEntityId[id],stats=level===undefined?profile:worldEnemyStats(level,rankFor(sub.toProfileId),enemy.budget);
  a.contentDefinitionId=sub.toProfileId;for(const key of ['hullRadius','combatRadius','moveSpeed','attackReach','attackReachMode','attackDelayTicks'])a[key]=profile[key];
  a.hp=combatInteger(stats.maxHp);a.maxHp=copyWire(a.hp);a.attackDamage=combatInteger(stats.attackDamage);a.attackTimer=profile.attackDelayTicks;
  delete a.ai.defeatedTick;
  if(DUNGEON_RANGED_FAMILIES_V1.includes(enemy.family))delete a.ai.melee;
  else if(DUNGEON_MOBS_V1_MELEE_MOTION[enemy.family]){a.ai.melee={version:HOSTILE_MOTION_D11_2_VERSION,phase:'idle',phaseStartedTick:s.tick,phaseEndsTick:s.tick,targetEntityId:null,actionSequence:a.ai.melee?.actionSequence??0};a.ai.motion??={version:HOSTILE_MOTION_D11_2_VERSION,startedTick:null,lastMovedTick:null};}
 }
}

export function adoptOrdinaryRosters(s,{groupIds=null,safe=true,freshEpisodes={}}={}){
 if(!s.d9World||!hasWorldCombat(s)||!newProfilesReady(s))return {changed:false,groups:0};
 let changed=false,count=0;if(!s.d9World.ordinaryRoster){s.d9World.ordinaryRoster={version:ORDINARY_ROSTER_V1,activatedTick:s.tick};changed=true;}
 for(const id of groupIds??Object.keys(s.groupsById)){
  const g=s.groupsById[id];if(!g||recordFor(s,id)||!eligible(s,g,{safe,freshEpisodeFrom:freshEpisodes[id]??null}))continue;
  const context=contextFor(s,g);if(!context)continue;const substitutionsById=selection(s,g,context);if(!Object.keys(substitutionsById).length)continue;
  const row={version:ORDINARY_ROSTER_V1,groupId:id,adoptedEpisode:s.encounterEconomy.groups[id].episode,adoptedTick:s.tick,poolKey:context.pool.key,substitutionsById};s.d9World.episodes[id].ordinaryRoster=row;applySubstitutions(s,g,row);count++;changed=true;
 }
 if(changed)s.d9World.runtime.revision++;
 return {changed,groups:count};
}
export function restoreOrdinaryRosterProfiles(s,groupId){const row=recordFor(s,groupId);if(row)applySubstitutions(s,s.groupsById[groupId],row);}

export function validateOrdinaryRosterState(s){
 const root=s.d9World?.ordinaryRoster,newIds=new Set(DUNGEON_MOBS_V1_PROFILES.map(p=>p.contentDefinitionId));
 for(const g of Object.values(s.groupsById))for(const id of g.entityIds)if(newIds.has(s.entitiesById[id].contentDefinitionId))check(root&&recordFor(s,g.groupId)?.substitutionsById[id]?.toProfileId===s.entitiesById[id].contentDefinitionId,'New ordinary actor lacks roster provenance');
 if(!root)return;
 closedRecord(root,['version','activatedTick']);check(hasWorldCombat(s)&&root.version===ORDINARY_ROSTER_V1,'Unrecognized ordinary roster binding');safeInteger(root.activatedTick,0,s.tick);
 for(const [id,episode]of Object.entries(s.d9World.episodes)){
  const row=episode.ordinaryRoster;if(!row)continue;const g=s.groupsById[id];check(g,'Roster episode has no live group');
  closedRecord(row,['version','groupId','adoptedEpisode','adoptedTick','poolKey','substitutionsById']);check(row.version===ORDINARY_ROSTER_V1&&row.groupId===id,'Roster identity drift');safeInteger(row.adoptedEpisode,0,s.encounterEconomy.groups[id].episode);safeInteger(row.adoptedTick,root.activatedTick,s.tick);
  const context=contextFor(s,g);check(context&&context.pool.key===row.poolKey&&same(selection(s,g,context),row.substitutionsById),'Roster deterministic selection drift');
  for(const [entityId,sub]of Object.entries(row.substitutionsById)){closedRecord(sub,['fromProfileId','toProfileId']);check(s.entitiesById[entityId]?.contentDefinitionId===sub.toProfileId&&g.entityIds.includes(entityId),'Roster actor profile drift');}
 }
}
export function ordinaryRosterAdoptionForGroup(a,b,id){
 try{
  if(a.tick!==b.tick||!hasWorldCombat(a)||!newProfilesReady(a)||recordFor(a,id)||!a.groupsById[id]||!same(a.playersById,b.playersById)||!same(a.groupsById[id],b.groupsById[id])||!same(a.encounterEconomy.groups[id],b.encounterEconomy.groups[id]))return false;
  const draft=copyWire(a);adoptOrdinaryRosters(draft,{groupIds:[id]});
  return same(recordFor(draft,id),recordFor(b,id))&&Boolean(recordFor(b,id))&&a.groupsById[id].entityIds.every(key=>same(draft.entitiesById[key],b.entitiesById[key]));
 }catch{return false;}
}
export function validateOrdinaryRosterProgress(a,b){
 const before=a.d9World?.ordinaryRoster,after=b.d9World?.ordinaryRoster;
 check(same(before,after)||!before&&after?.version===ORDINARY_ROSTER_V1&&after.activatedTick===b.tick&&a.tick===b.tick&&newProfilesReady(a),'Ordinary roster binding changed');
 for(const [id,episode]of Object.entries(a.d9World.episodes)){
  const prior=episode.ordinaryRoster,next=recordFor(b,id);if(same(prior,next))continue;
  // Cold residency and a separately validated site reset retire complete groups.
  if(prior&&!b.groupsById[id]&&!b.d9World.episodes[id])continue;
  const oldEconomy=a.encounterEconomy.groups[id],newEconomy=b.encounterEconomy.groups[id],renewal=!prior&&next&&oldEconomy&&newEconomy&&newEconomy.episode===oldEconomy.episode+1&&next.adoptedEpisode===newEconomy.episode&&next.adoptedTick===newEconomy.startedTick&&newEconomy.startedTick>=a.tick;
  // validateEncounterEconomyProgress runs first and proves the ordinary return,
  // vacancy and ownership gates. Fresh occupation may retain monotonic attack
  // counters from the prior episode; no sequence is reset to enable adoption.
  check(!prior&&(ordinaryRosterAdoptionForGroup(a,b,id)||renewal),'Ordinary roster episode history changed');
 }
}
