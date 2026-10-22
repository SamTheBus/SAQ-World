import {aegisMimicFor} from '../content/aegis_mimics_v2.js';
import {isWildernessStarterSiteV3} from '../content/wilderness_ecology_v3.js';
import {ORDINARY_ENEMIES,DUNGEON_MOBS_V2_ENEMIES,DUNGEON_MOBS_V2_PROFILES,ordinaryEnemyForProfile,resolveOrdinaryProfile} from '../content/ordinary_enemies.js';
import {hasWorldCombat,worldEnemyStats} from '../content/world_combat_v1.js';
import {worldOrdinaryMeleeProfile} from '../content/world_melee_geometry.js';
import {HOSTILE_MOTION_D11_2_VERSION} from '../content/encounter_motion_d11_2.js';
import {hashReward} from '../content/economy_rewards.js';
import {copyWire,canonicalStringify,closedRecord,safeInteger,requireContract as check} from './wire.js';
import {combatInteger,compareCombat} from './combat_amount.js';

// A second retained layer deliberately leaves V1's sampler and substitutions
// intact. Only previously unsubstituted melee slots can acquire these families.
export const ORDINARY_ROSTER_V2='dungeon-ordinary-roster-v2';
const same=(a,b)=>a===b||a!==undefined&&b!==undefined&&canonicalStringify(a)===canonicalStringify(b);
const rankFor=id=>['C','B','A','S'][(parseInt(id.slice(8),16)-1)%4];
const recordFor=(s,id)=>s.d9World?.episodes[id]?.ordinaryRosterV2;
const completeCatalog=s=>[...DUNGEON_MOBS_V2_ENEMIES,...DUNGEON_MOBS_V2_PROFILES].every(p=>same(s.content?.definitionsById?.[p.contentDefinitionId],p));
const ready=s=>completeCatalog(s)||Boolean(s.streamCapture&&s.d9World?.ordinaryRosterV2?.version===ORDINARY_ROSTER_V2);
const mountain=['gilded_scuttler','mimic_shield'];
const voids=['void_crawler','void_spectre','void_wraith','rift_drifter'];
const clockwork=['clockwork_scarab','star_weaver','coin_elemental','temporal_watcher','clockwork_drone'];
const cyber=['neon_spider','wireframe_orb','cyber_wraith'];

function contextFor(s,g){
 const site=Object.values(s.d9World.functionalSitesById).find(site=>site.floors?.some(f=>f.groupId===g.groupId)),floor=site?.floors.find(f=>f.groupId===g.groupId);
 if(!floor)return null; // Roads and the retained historical pair stay thematic.
 if(isWildernessStarterSiteV3(site))return null; // Retain V3 Woodland starter habitat; no Clockwork/Cyber substitution.
 const rawFamily=site.familyId?.split(':').at(-1)??site.siteKind?.replace('procedural-',''),family=rawFamily?.includes('cave')?'cave':rawFamily,biome=site.socket.region.biome,ordinal=site.floors.indexOf(floor),lower=ordinal>0;
 let key,families;
 if(['upland','rocky-uplands','frostland'].includes(biome)&&['cave','fort'].includes(family)){key='mountain:'+family;families=mountain;}
 else if(family==='crypt'&&(lower||site.sizeTier==='deep')){key='crypt:lower-void';families=[...voids,...cyber];}
 else if(family==='ruin'&&lower){key='ruin:lower-arcane';families=[...voids,...cyber];}
 else if(family==='fort'&&lower){key='fort:lower-arcane';families=[...clockwork,...cyber];}
 else if(family==='fort'||family==='ruin'){key=family+':ancient';families=clockwork;}
 else return null;
 const members=floor.encounter.members.map((member,n)=>({entityId:floor.enemyIds[n],profileId:member.role==='arachnid-treant'?s.entitiesById[floor.enemyIds[n]].contentDefinitionId:resolveOrdinaryProfile(ORDINARY_ENEMIES.find(e=>e.family===member.family),floor.encounter.rank).contentDefinitionId,roomId:member.roomId}));
 return {key,families,members};
}
function history(s,id){
 const e=s.encounterEconomy.groups[id];if(Object.keys(e.usedResources).length)return true;
 return Object.values(s.playersById).some(p=>[...Object.values(p.inventory.rewardsByEntityId??{}),...Object.values(p.inventory.renewal?.originsByItemId??{}),...Object.values(p.inventory.renewal?.groundBySourceId??{}),...Object.values(p.inventory.d7?.salvaged??{}),...Object.values(p.inventory.d7?.autoSalvaged??{}),...Object.values(p.inventory.services?.salesByItemId??{})].some(r=>{const q=r.episodeSource??r.origin??r.reward?.episodeSource??r;return q.groupId===id&&(q.episode===undefined||q.episode===e.episode);}));
}
function eligible(s,g,{safe=true,freshEpisodeFrom=null}={}){
 if(g.cleared||!s.d9World.episodes[g.groupId]||history(s,g.groupId))return false;
 if(g.entityIds.some(id=>s.hostileCombat?.actionsByEntityId[id]?.phase&&s.hostileCombat.actionsByEntityId[id].phase!=='idle')||Object.values(s.hostileCombat?.projectiles??{}).some(shot=>g.entityIds.includes(shot.sourceId)))return false;
 const e=s.encounterEconomy.groups[g.groupId],fresh=Number.isSafeInteger(freshEpisodeFrom)&&e.episode===freshEpisodeFrom+1&&e.startedTick===s.tick&&s.d9World.episodes[g.groupId].episode===e.episode;
 if(freshEpisodeFrom!==null&&!fresh)return false;
 if(!g.entityIds.every(id=>{const a=s.entitiesById[id];return a.alive&&compareCombat(a.hp,a.maxHp)===0&&(fresh||a.nextAttackActionSequence===1);}))return false;
 if(safe&&g.entityIds.some(id=>{const a=s.entitiesById[id];return Object.values(s.playersById).some(p=>{const b=s.entitiesById[p.entityId];return b.residency.spaceInstanceId===g.spaceInstanceId&&Math.hypot(a.position.x-b.position.x,a.position.y-b.position.y)<384;});}))return false;
 return !g.entityIds.some(id=>{const a=s.entitiesById[id];return a.ai?.melee?.phase&&a.ai.melee.phase!=='idle';});
}
function selection(s,g,context){
 const seed=s.campaign.seed.seedHex+'/'+g.groupId+'/'+ORDINARY_ROSTER_V2,v1=s.d9World.episodes[g.groupId].ordinaryRoster?.substitutionsById??{},exempt=id=>v1[id]||s.eliteCombat?.elitesByEntityId[id]||s.bossCombat?.bossesByEntityId[id]||s.bossCombat?.summonsByEntityId[id];
 const candidates=context.members.filter(m=>!exempt(m.entityId)&&ordinaryEnemyForProfile(m.profileId)).map(m=>({...m,n:hashReward(seed+'/'+m.entityId)})).sort((a,b)=>a.n-b.n||a.entityId.localeCompare(b.entityId));
 // The new batch remains a minority; V1 casters and V1 melee keep exact slots.
 const count=Math.min(candidates.length,Math.max(2,Math.min(6,Math.floor(g.entityIds.length/4)))),offset=hashReward(seed+'/families'),result={};
 for(const [n,m]of candidates.slice(0,count).entries()){
  const enemy=ORDINARY_ENEMIES.find(e=>e.family===context.families[(offset+n)%context.families.length]),profile=resolveOrdinaryProfile(enemy,rankFor(m.profileId));
  result[m.entityId]={fromProfileId:m.profileId,toProfileId:profile.contentDefinitionId};
 }
 return Object.fromEntries(Object.entries(result).sort(([a],[b])=>a.localeCompare(b)));
}
export function ordinaryRosterV2Definition(s,definition){
 const row=recordFor(s,definition.groupId);if(!row)return definition;
 return {...definition,members:definition.members.map(m=>{const sub=row.substitutionsById[m.entityId];if(!sub)return m;const enemy=ordinaryEnemyForProfile(sub.toProfileId);return {...m,profileId:sub.toProfileId,enemyDefinitionId:enemy.enemyDefinitionId};})};
}
export function ordinaryRosterV2Profile(s,groupId,entityId,fallback){
 const sub=recordFor(s,groupId)?.substitutionsById[entityId];if(!sub)return fallback;
 check(sub.fromProfileId===fallback.contentDefinitionId,'V2 roster source differs from retained recipe');return s.content.definitionsById[sub.toProfileId];
}
function apply(s,g,row){
 for(const [id,sub]of Object.entries(row.substitutionsById)){
  const a=s.entitiesById[id],enemy=ordinaryEnemyForProfile(sub.toProfileId),profile=worldOrdinaryMeleeProfile(s,resolveOrdinaryProfile(enemy,rankFor(sub.toProfileId))),level=g.threatSnapshot?.levelsByEntityId[id],stats=level===undefined?profile:worldEnemyStats(level,rankFor(sub.toProfileId),enemy.budget);
  a.contentDefinitionId=sub.toProfileId;for(const key of ['hullRadius','combatRadius','moveSpeed','attackReach','attackReachMode','attackDelayTicks'])a[key]=profile[key];
  a.hp=combatInteger(stats.maxHp);a.maxHp=copyWire(a.hp);a.attackDamage=combatInteger(stats.attackDamage);a.attackTimer=profile.attackDelayTicks;delete a.ai.defeatedTick;
  a.ai.melee={version:HOSTILE_MOTION_D11_2_VERSION,phase:'idle',phaseStartedTick:s.tick,phaseEndsTick:s.tick,targetEntityId:null,actionSequence:a.ai.melee?.actionSequence??0};a.ai.motion??={version:HOSTILE_MOTION_D11_2_VERSION,startedTick:null,lastMovedTick:null};
 }
}
export function adoptOrdinaryRostersV2(s,{groupIds=null,safe=true,freshEpisodes={}}={}){
 if(!s.d9World||!hasWorldCombat(s)||!ready(s))return {changed:false,groups:0};
 let changed=false,count=0;if(!s.d9World.ordinaryRosterV2){s.d9World.ordinaryRosterV2={version:ORDINARY_ROSTER_V2,activatedTick:s.tick};changed=true;}
 for(const id of groupIds??Object.keys(s.groupsById)){
  const g=s.groupsById[id];if(!g||recordFor(s,id)||!eligible(s,g,{safe,freshEpisodeFrom:freshEpisodes[id]??null}))continue;
  const context=contextFor(s,g);if(!context)continue;const substitutionsById=selection(s,g,context);if(!Object.keys(substitutionsById).length)continue;
  const row={version:ORDINARY_ROSTER_V2,groupId:id,adoptedEpisode:s.encounterEconomy.groups[id].episode,adoptedTick:s.tick,poolKey:context.key,substitutionsById};s.d9World.episodes[id].ordinaryRosterV2=row;apply(s,g,row);count++;changed=true;
 }
 if(changed)s.d9World.runtime.revision++;
 return {changed,groups:count};
}
export function restoreOrdinaryRosterV2Profiles(s,groupId){const row=recordFor(s,groupId);if(row)apply(s,s.groupsById[groupId],row);}
export function validateOrdinaryRosterV2State(s){
 const root=s.d9World?.ordinaryRosterV2,newIds=new Set(DUNGEON_MOBS_V2_PROFILES.map(p=>p.contentDefinitionId));
 for(const g of Object.values(s.groupsById))for(const id of g.entityIds)if(newIds.has(s.entitiesById[id].contentDefinitionId)&&!aegisMimicFor(s,id))check(root&&recordFor(s,g.groupId)?.substitutionsById[id]?.toProfileId===s.entitiesById[id].contentDefinitionId,'New V2 ordinary actor lacks roster provenance');
 if(!root)return;
 closedRecord(root,['version','activatedTick']);check(completeCatalog(s),'V2 ordinary roster requires the complete appended catalog');check(hasWorldCombat(s)&&root.version===ORDINARY_ROSTER_V2,'Unrecognized V2 ordinary roster binding');safeInteger(root.activatedTick,0,s.tick);
 for(const [id,episode]of Object.entries(s.d9World.episodes)){
  const row=episode.ordinaryRosterV2;if(!row)continue;const g=s.groupsById[id];check(g,'V2 roster episode has no live group');
  closedRecord(row,['version','groupId','adoptedEpisode','adoptedTick','poolKey','substitutionsById']);check(row.version===ORDINARY_ROSTER_V2&&row.groupId===id,'V2 roster identity drift');safeInteger(row.adoptedEpisode,0,s.encounterEconomy.groups[id].episode);safeInteger(row.adoptedTick,root.activatedTick,s.tick);
  const context=contextFor(s,g);check(context&&context.key===row.poolKey&&same(selection(s,g,context),row.substitutionsById),'V2 roster deterministic selection drift');
  for(const [entityId,sub]of Object.entries(row.substitutionsById)){closedRecord(sub,['fromProfileId','toProfileId']);check(s.entitiesById[entityId]?.contentDefinitionId===sub.toProfileId&&g.entityIds.includes(entityId),'V2 roster actor profile drift');}
 }
}
export function ordinaryRosterV2AdoptionForGroup(a,b,id){
 try{
  if(a.tick!==b.tick||!hasWorldCombat(a)||!ready(a)||recordFor(a,id)||!a.groupsById[id]||!same(a.playersById,b.playersById)||!same(a.groupsById[id],b.groupsById[id])||!same(a.encounterEconomy.groups[id],b.encounterEconomy.groups[id]))return false;
  const draft=copyWire(a);adoptOrdinaryRostersV2(draft,{groupIds:[id]});
  return Boolean(recordFor(b,id))&&same(recordFor(draft,id),recordFor(b,id))&&a.groupsById[id].entityIds.every(key=>same(draft.entitiesById[key],b.entitiesById[key]));
 }catch{return false;}
}
export function validateOrdinaryRosterV2Progress(a,b){
 const before=a.d9World?.ordinaryRosterV2,after=b.d9World?.ordinaryRosterV2;
 check(same(before,after)||!before&&after?.version===ORDINARY_ROSTER_V2&&after.activatedTick===b.tick&&a.tick===b.tick&&ready(a),'V2 ordinary roster binding changed');
 for(const [id,episode]of Object.entries(a.d9World.episodes)){
  const prior=episode.ordinaryRosterV2,next=recordFor(b,id);if(same(prior,next))continue;
  if(prior&&!b.groupsById[id]&&!b.d9World.episodes[id])continue;
  const oldEconomy=a.encounterEconomy.groups[id],newEconomy=b.encounterEconomy.groups[id],renewal=!prior&&next&&oldEconomy&&newEconomy&&newEconomy.episode===oldEconomy.episode+1&&next.adoptedEpisode===newEconomy.episode&&next.adoptedTick===newEconomy.startedTick&&newEconomy.startedTick>=a.tick;
  check(!prior&&(ordinaryRosterV2AdoptionForGroup(a,b,id)||renewal),'V2 ordinary roster episode history changed');
 }
}
