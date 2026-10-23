// Opt-in Wilderness V3.3 balance policy. Never rewrite historical World Combat.
import {usesWildernessFairnessV3_2} from './wilderness_fairness_v3_2.js';
export const WILDERNESS_COMBAT_TUNING_V3_3=Object.freeze({
 version:'wilderness-v3-3-cleave-crowd-1',
 forwardDotMinimum:0.45,
 targetsByCombo:Object.freeze([2,3,4]),
 mobGraceTicks:15, // 250ms at 60Hz
});
export const usesWildernessCombatV3_3=usesWildernessFairnessV3_2;
export function wildernessCleaveTuning(state,step){
 if(!usesWildernessCombatV3_3(state))return null;
 if(!Number.isInteger(step)||step<1||step>3)throw Error('Invalid primary combo step');
 return {forwardDotMinimum:WILDERNESS_COMBAT_TUNING_V3_3.forwardDotMinimum,
   maxTargets:WILDERNESS_COMBAT_TUNING_V3_3.targetsByCombo[step-1]};
}
export function wildernessCrowdHitEligible(state,source,target,packet=null){
 return usesWildernessCombatV3_3(state)&&source?.team==='hostile'&&target?.team==='party'
   &&!source.boss&&!state.bossCombat?.bossesByEntityId?.[source.entityId]
   &&packet?.scripted!==true&&packet?.periodic!==true&&packet?.trigger!=='periodic';
}
export function wildernessCrowdHitBlocked(state,source,target,packet=null){
 return wildernessCrowdHitEligible(state,source,target,packet)
   &&(state.wildernessCrowdGraceByEntityId?.[target.entityId]??0)>state.tick;
}
// Only a successful, positive *HP* loss should call this method; full barrier,
// guard or parry absorption must not start a grace window.
export function rememberWildernessCrowdHit(state,source,target,packet=null){
 if(!target.alive||!wildernessCrowdHitEligible(state,source,target,packet))return false;
 (state.wildernessCrowdGraceByEntityId??={})[target.entityId]=state.tick+WILDERNESS_COMBAT_TUNING_V3_3.mobGraceTicks;
 return true;
}
export function expireWildernessCrowdGrace(state){
 for(const [id,until] of Object.entries(state.wildernessCrowdGraceByEntityId??{}))
   if(state.tick>=until||!state.entitiesById[id]?.alive)delete state.wildernessCrowdGraceByEntityId[id];
}
export function clearWildernessCrowdGrace(state,id){
 if(state.wildernessCrowdGraceByEntityId)delete state.wildernessCrowdGraceByEntityId[id];
}
