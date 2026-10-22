import {hasWorldCombat,worldEnemyStats} from '../content/world_combat_v1.js';
import {worldOrdinaryMeleeProfile} from '../content/world_melee_geometry.js';
import {ORDINARY_ENEMIES,ORDINARY_PROFILES,resolveOrdinaryProfile,ordinaryEnemyForProfile} from '../content/ordinary_enemies.js';
import {hashReward} from '../content/economy_rewards.js';
import {populationPointAllowed,populationRegionAt} from './ordinary_population.js';
import {collidesWithTiles} from '../rules/world_geometry.js';
import {copyWire,canonicalStringify,requireContract as check} from './wire.js';
import {combatInteger,compareCombat} from './combat_amount.js';
import {unfrozenEpisodeD9} from './episode_progression_d9.js';
import {legacyWorldPosition} from './world_address.js';
import {captureWorldPositionsD9} from './world_runtime_d9.js';

// Historical origin manifests are committed content. This opt-in runtime layer
// retains their two original identities and extends only safe, untouched episodes.
export const ORIGIN_HORDE_VERSION='world-origin-horde-overlay-v1';
const same=(a,b)=>a===b||a!==undefined&&b!==undefined&&canonicalStringify(a)===canonicalStringify(b);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const originFor=s=>s.content.definitionsById[s.campaign.overworld.manifestDefinitionId];
const originalGroups=origin=>[...(origin.population?.groups??[]),...(origin.siteInteriors??[]).flatMap(d=>d.groups)];
const siteFor=(origin,id)=>origin.siteInteriors?.find(d=>d.groups.some(g=>g.groupId===id));
const tier=id=>['C','B','A','S'][ORDINARY_PROFILES.findIndex(p=>p.contentDefinitionId===id)%4];
const token=key=>[0,1,2,3].map(n=>hashReward(`${ORIGIN_HORDE_VERSION}/${n}/${key}`).toString(16).padStart(8,'0')).join('');
const entityId=(s,g,n)=>'ent:'+token(`${s.campaign.seed.seedHex}/${g.groupId}/${n}`);
const collisionFor=s=>s.spacesByInstanceId[s.overworldInstanceId].collision.origin??s.spacesByInstanceId[s.overworldInstanceId].collision;

export function originHordeDefinition(s,origin,collision,g){
 const site=siteFor(origin,g.groupId),room=site?.rooms.find(r=>r.roomId===g.roomId),anchor=g.anchor??g.members[0].position,spaceInstanceId=site?s.campaign.sitesById[site.siteId].spaceInstanceId:s.overworldInstanceId;
 const count=6+hashReward(`${s.campaign.seed.seedHex}/${g.groupId}/horde-size`)%(site?3:7),members=copyWire(g.members),rank=tier(g.members[0].profileId),first=ORDINARY_ENEMIES.findIndex(e=>e.enemyDefinitionId===g.members[0].enemyDefinitionId);
 if(site)collision=site.collision;
 // Connected tile exploration keeps all extensions in the original open area.
 // Deterministic ordering is independent of travel, residency and object order.
 const offsets=[[0,-32],[32,0],[0,32],[-32,0]],turn=hashReward(g.groupId+'/directions')%4,queue=[copyWire(anchor)],seen=new Set([anchor.x+','+anchor.y]),resources=(s.d9World.origin.resources??[]).filter(r=>r.spaceInstanceId===spaceInstanceId);
 for(let i=0;i<queue.length&&members.length<count;i++){
  const p=queue[i];
  if(distance(p,anchor)<=160&&members.every(m=>distance(m.position,p)>=40)&&resources.every(r=>distance(r.position,p)>=30)){
   const enemy=ORDINARY_ENEMIES[(first+members.length)%3],profile=resolveOrdinaryProfile(enemy,rank),n=members.length;
   members.push({entityId:entityId(s,g,n),enemyDefinitionId:enemy.enemyDefinitionId,profileId:profile.contentDefinitionId,position:copyWire(p)});
  }
  for(let n=0;n<4;n++){
   const d=offsets[(n+turn)%4],p2={x:p.x+d[0],y:p.y+d[1]},key=p2.x+','+p2.y;
   if(seen.has(key)||distance(p2,anchor)>160)continue;seen.add(key);
   if(site?(p2.x<=room.x*32+14||p2.x>=(room.x+room.width)*32-14||p2.y<=room.y*32+14||p2.y>=(room.y+room.height)*32-14||distance(p2,site.entrance)<=320):(populationRegionAt(origin,p2)?.regionId!==g.regionId||!populationPointAllowed(origin,collision,p2)))continue;
   if(collidesWithTiles(collision,p2.x,p2.y,14))continue;
   queue.push(p2);
  }
 }
 check(members.length>=6,'Origin horde requires safe placement extension');
 return {...copyWire(g),members};
}

function hasHistory(s,id){
 const economy=s.encounterEconomy.groups[id];
 if(Object.keys(economy.usedResources).length)return true;
 return Object.values(s.playersById).some(p=>{
  const inv=p.inventory,rows=[...Object.values(inv.rewardsByEntityId??{}),...Object.values(inv.renewal?.originsByItemId??{}),...Object.values(inv.d7?.salvaged??{}),...Object.values(inv.d7?.autoSalvaged??{})];
  return rows.some(r=>{const source=r.episodeSource??r.origin??r.reward?.episodeSource??r;return source.groupId===id&&(source.episode===undefined||source.episode===economy.episode);});
 });
}
function untouched(s,g){return !g.cleared&&!hasHistory(s,g.groupId)&&(!g.threatSnapshot||g.threatSnapshot.version==='encounter-progression-d9-v1')&&g.entityIds.every(id=>{const a=s.entitiesById[id];return a.alive&&compareCombat(a.hp,a.maxHp)===0;});}
function birthSafe(s,definition){const space=s.groupsById[definition.groupId].spaceInstanceId;return definition.members.slice(2).every(m=>Object.values(s.playersById).every(p=>{const a=s.entitiesById[p.entityId];return a.residency.spaceInstanceId!==space||distance(a.position,m.position)>=384;}));}
function originEpisode(s,g,definition){
 const site=siteFor(originFor(s),g.groupId),address=legacyWorldPosition(site?.returnAnchor??definition.anchor),rank=tier(definition.members[0].profileId),e=s.encounterEconomy.groups[g.groupId],record={...unfrozenEpisodeD9('origin:'+g.groupId,e.episode,{origin:true}),geography:{chunkX:address.chunkX,chunkY:address.chunkY,anchorOrdinal:0,minimumLevel:1,rank}};
 if(g.threatSnapshot){
  const level=copyWire(g.threatSnapshot.levelsByEntityId[g.entityIds.find(id=>s.entitiesById[id].alive)??g.entityIds[0]]);
  record.snapshot={version:'episode-progression-d9-v1',snapshotId:record.anchorId+'/episode/'+String(record.episode),activatedTick:g.threatSnapshot.activatedTick,trigger:'activation',minimumLevel:1,effectiveLevel:level,sourceDepth:copyWire(level),mappingVersion:'effective-level-depth-d9-v1',rank,participants:[]};
 }
 return record;
}
function makeActor(s,member,g){
 const enemy=ORDINARY_ENEMIES.find(e=>e.enemyDefinitionId===member.enemyDefinitionId),base=worldOrdinaryMeleeProfile(s,resolveOrdinaryProfile(enemy,tier(member.profileId))),level=g.threatSnapshot?.levelsByEntityId[member.entityId],profile=level!==undefined&&g.threatSnapshot.version==='encounter-progression-d9-v1'?{...base,...worldEnemyStats(level,tier(member.profileId),enemy.budget)}:base;
 return {entityId:member.entityId,contentDefinitionId:member.profileId,kind:'actor',ownerCharacterId:null,team:'hostile',hp:combatInteger(profile.maxHp),maxHp:combatInteger(profile.maxHp),position:copyWire(member.position),hullRadius:profile.hullRadius,combatRadius:profile.combatRadius,movementIntent:{x:0,y:0},moveSpeed:profile.moveSpeed,alive:true,attackDamage:combatInteger(profile.attackDamage),attackReach:profile.attackReach,attackReachMode:profile.attackReachMode,attackDelayTicks:profile.attackDelayTicks,attackTimer:profile.attackDelayTicks,nextAttackActionSequence:1,movedLastTick:false,ai:{kind:'simpleMelee',acquireRange:320,updatesApplied:0},residency:{spaceInstanceId:g.spaceInstanceId,residencyRevision:1}};
}

export function upgradeOriginHordes(s){
 if(!s.d9World||!hasWorldCombat(s))return {changed:false,expanded:0,retained:0};
 const origin=originFor(s),collision=collisionFor(s);let expanded=0,retained=0;
 for(const original of originalGroups(origin)){
  const g=s.groupsById[original.groupId],economy=s.encounterEconomy.groups[g.groupId],prior=s.d9World.originHordes?.groupsById[g.groupId];
  if(prior?.status==='expanded'||g.cleared||hasHistory(s,g.groupId))continue;
  if(prior?.protectedEpisode&&prior.episode===economy.episode)continue;
  const definition=originHordeDefinition(s,origin,collision,original),expand=untouched(s,g)&&birthSafe(s,definition);
  if(prior&&prior.episode===economy.episode&&!expand)continue;
  s.d9World.originHordes??={version:ORIGIN_HORDE_VERSION,groupsById:{}};
  if(!s.d9World.episodes[g.groupId]){s.d9World.episodes[g.groupId]=originEpisode(s,g,original);economy.contentDepth=copyWire(s.d9World.episodes[g.groupId].snapshot?.sourceDepth??1);}
  const record={groupId:g.groupId,episode:economy.episode,appliedTick:s.tick,status:expand?'expanded':'retained',protectedEpisode:!untouched(s,g),definition:expand?definition:copyWire(original)};
  s.d9World.originHordes.groupsById[g.groupId]=record;
  if(expand){
   if(g.threatSnapshot){const level=copyWire(s.d9World.episodes[g.groupId].snapshot.effectiveLevel);for(const m of definition.members.slice(2))g.threatSnapshot.levelsByEntityId[m.entityId]=copyWire(level);}
   for(const member of definition.members.slice(2)){check(!s.entitiesById[member.entityId],'Origin extension identity collision');s.entitiesById[member.entityId]=makeActor(s,member,g);g.entityIds.push(member.entityId);}
   if(g.containment)for(const member of definition.members.slice(2))g.containment.memberHomesById[member.entityId]=copyWire(member.position);
   expanded++;
  }else retained++;
 }
 if(expanded||retained){s.d9World.runtime.revision++;s.encounterEconomy.revision++;captureWorldPositionsD9(s);}
 return {changed:Boolean(expanded||retained),expanded,retained};
}

// A single same-tick, deterministic, reward-free extension is the only save
// transition exception. Existing actors, economy history and player state stay
// byte-identical. A later legitimate renewal may make a retained pair eligible.
export function originHordeUpgradeForGroup(a,b,id){
 try{
  const genesis=!a.d9World?.plannedWorld&&a.tick===0&&b.tick===0&&a.d9World.runtime.chunks.length===0&&Object.keys(a.d9World.siteReservationsById).length===0;
  if((!hasWorldCombat(a)&&!genesis)||!hasWorldCombat(b)||a.tick!==b.tick)return false;
  const row=b.d9World.originHordes?.groupsById[id],oldRow=a.d9World.originHordes?.groupsById[id],g=a.groupsById[id],next=b.groupsById[id],original=originalGroups(originFor(a)).find(g=>g.groupId===id);
  if(!row||same(row,oldRow)||!original||!g||!next||row.appliedTick!==b.tick||row.episode!==a.encounterEconomy.groups[id].episode||g.cleared||hasHistory(a,id)||g.entityIds.length!==2||!same(g.entityIds,original.members.map(m=>m.entityId)))return false;
  if((!genesis&&!same(a.playersById,b.playersById))||!same(a.encounterEconomy.groups[id].usedResources,b.encounterEconomy.groups[id].usedResources))return false;
  if(g.entityIds.some(key=>!same(genesis?{...a.entitiesById[key],attackReach:32,attackReachMode:'clearHullGap'}:a.entitiesById[key],b.entitiesById[key])))return false;
  const draft=copyWire(genesis?b:a);
  if(genesis){
   // The already-validated genesis binding also installs the town and World
   // melee geometry. Undo only this group's extension to reproduce its plan.
   delete draft.d9World.originHordes.groupsById[id];
   draft.groupsById[id]=copyWire(g);
   draft.encounterEconomy.groups[id]=copyWire(a.encounterEconomy.groups[id]);
   if(a.d9World.episodes[id])draft.d9World.episodes[id]=copyWire(a.d9World.episodes[id]);else delete draft.d9World.episodes[id];
   for(const m of row.definition.members.slice(2))delete draft.entitiesById[m.entityId];
  }
  upgradeOriginHordes(draft);
  return same(draft.d9World.originHordes.groupsById[id],row)&&same(draft.groupsById[id],next)&&same(draft.d9World.episodes[id],b.d9World.episodes[id])&&same(draft.encounterEconomy.groups[id],b.encounterEconomy.groups[id])&&row.definition.members.slice(2).every(m=>!a.entitiesById[m.entityId]&&same(draft.entitiesById[m.entityId],b.entitiesById[m.entityId]));
 }catch{return false;}
}
export function validateOriginHordes(s,origin,collision){
 const overlay=s.d9World?.originHordes;if(!overlay)return;
 check(hasWorldCombat(s)&&overlay.version===ORIGIN_HORDE_VERSION,'Origin hordes outside World combat');
 for(const [id,row] of Object.entries(overlay.groupsById)){
  const original=originalGroups(origin).find(g=>g.groupId===id);check(original,'Origin horde group not in immutable origin');
  const definition=row.status==='expanded'?originHordeDefinition(s,origin,collision,original):original;
  check(same(definition,row.definition),'Origin horde deterministic definition changed');
  check(row.appliedTick<=s.tick&&row.episode<=s.encounterEconomy.groups[id].episode,'Origin horde chronology changed');
  check(row.status!=='expanded'||row.protectedEpisode===false,'Expanded origin horde has protected episode');
  check(same(s.groupsById[id].entityIds,definition.members.map(m=>m.entityId)),'Origin horde live membership mismatch');
  check(s.d9World.episodes[id]?.origin,'Origin horde has no episode provenance');
 }
}
export function validateOriginHordeProgress(a,b){
 const before=a.d9World?.originHordes?.groupsById??{},after=b.d9World?.originHordes?.groupsById??{};
 for(const id of new Set([...Object.keys(before),...Object.keys(after)]))check(same(before[id],after[id])||originHordeUpgradeForGroup(a,b,id),'Origin horde overlay history changed');
}
