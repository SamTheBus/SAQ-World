// Wilderness V3.4: deterministic early-pack engagement. No spawn/save changes.
import {usesWildernessFairnessV3_2} from './wilderness_fairness_v3_2.js';
import {compareCombat} from '../contracts/combat_amount.js';

export const WILDERNESS_PACK_PACING_V3_4=Object.freeze({
 version:'wilderness-v3-4-starter-pack-pacing-1',
 maxUnprovokedPursuersPerPack:3,
 starterHeroBelowLevel:6,
 scope:'Wilderness overworld ordinary packs only',
 fullRetaliation:'any damaged pack member wakes everyone'
});
export function wildernessPackPursuitAllowed(state,group,source,target,eligible=()=>true){
 const count=WILDERNESS_PACK_PACING_V3_4.maxUnprovokedPursuersPerPack;
 if(!usesWildernessFairnessV3_2(state)||!group?.containment||group.siteId!==null
    ||!Array.isArray(group.entityIds)||group.entityIds.length<=count
    ||source?.team!=='hostile'||target?.team!=='party'||source?.boss
    ||state.bossCombat?.bossesByEntityId?.[source.entityId]
    ||state.eliteCombat?.elitesByEntityId?.[source.entityId])return true;
 const player=Object.values(state.playersById).find(p=>p.entityId===target.entityId);
 if(!player||BigInt(player.progression.level)>=BigInt(WILDERNESS_PACK_PACING_V3_4.starterHeroBelowLevel))return true;
 // Provoked packs fully retaliate. This also prevents ranged hit-and-run cheese.
 if(group.entityIds.some(id=>{
   const member=state.entitiesById[id];
   return member&&!member.alive||member?.alive&&compareCombat(member.hp,member.maxHp)<0;
 }))return true;
 const d=Math.hypot(source.position.x-target.position.x,source.position.y-target.position.y);
 // Never deactivate a genuine close attacker or interrupt telegraphed melee.
 if(d<=source.attackReach+source.combatRadius+target.combatRadius+4
    ||source.ai?.melee?.phase&&source.ai.melee.phase!=='idle')return true;
 const members=group.entityIds.map(id=>state.entitiesById[id]).filter(a=>a?.alive
   &&a.team==='hostile'&&a.residency.spaceInstanceId===target.residency.spaceInstanceId
   &&!a.boss&&!state.bossCombat?.bossesByEntityId?.[a.entityId]
   &&!state.eliteCombat?.elitesByEntityId?.[a.entityId]);
 members.sort((a,b)=>{
   const x=Math.hypot(a.position.x-target.position.x,a.position.y-target.position.y);
   const y=Math.hypot(b.position.x-target.position.x,b.position.y-target.position.y);
   return x-y||a.entityId.localeCompare(b.entityId);
 });
 let picked=0;
 for(const member of members){
   if(!eligible(member,target))continue; // LOS-blocked members cannot steal a slot.
   if(member.entityId===source.entityId)return picked<count;
   if(++picked>=count)break;
 }
 return false;
}

// V3.4.2: multiple unprovoked packs share one starter-area pursuit budget.
// The V3.4.1 rule still unleashes full retaliation after damage or a kill.
export const WILDERNESS_GLOBAL_PACK_PACING_V3_4_2=Object.freeze({
 version:'wilderness-v3-4-2-global-frontier-1',
 maximumUnprovokedPursuers:3,noviceLevelMaximum:5,lowRegionLevelMaximum:5,
 starterRadiusPixels:1536
});
export function wildernessGlobalPursuerCap(state,group,target,startLocal=null){
 if(!usesWildernessFairnessV3_2(state)||group?.siteId!==null||!group?.containment
    ||group.spaceInstanceId!==state.overworldInstanceId||!target?.alive)return null;
 const player=Object.values(state.playersById).find(p=>p.entityId===target.entityId);
 const level=Number(player?.progression?.level);
 if(!Number.isFinite(level)||level<1||level>WILDERNESS_GLOBAL_PACK_PACING_V3_4_2.noviceLevelMaximum)return null;
 if(group.entityIds.some(id=>{const a=state.entitiesById[id];return a&&(!a.alive||compareCombat(a.hp,a.maxHp)<0);}))return null;
 const floor=Number(state.d9World?.episodes?.[group.groupId]?.geography?.minimumLevel);
 const low=Number.isFinite(floor)&&floor>=1&&floor<=WILDERNESS_GLOBAL_PACK_PACING_V3_4_2.lowRegionLevelMaximum;
 const near=Boolean(startLocal&&Math.hypot(target.position.x-startLocal.x,target.position.y-startLocal.y)<=WILDERNESS_GLOBAL_PACK_PACING_V3_4_2.starterRadiusPixels);
 return low||near?WILDERNESS_GLOBAL_PACK_PACING_V3_4_2.maximumUnprovokedPursuers:null;
}
export function selectWildernessGlobalPursuers(candidates,limit=WILDERNESS_GLOBAL_PACK_PACING_V3_4_2.maximumUnprovokedPursuers){
 if(!Number.isInteger(limit)||limit<1)throw Error('Invalid global pursuit limit');
 const selected=[],seen=new Set();
 for(const row of [...candidates].sort((a,b)=>a.distance-b.distance||a.entityId.localeCompare(b.entityId))){
  if(!Number.isFinite(row.distance)||row.distance<0||seen.has(row.entityId))continue;
  seen.add(row.entityId);selected.push(row.entityId);
  if(selected.length>=limit)break;
 }
 return selected;
}
