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
