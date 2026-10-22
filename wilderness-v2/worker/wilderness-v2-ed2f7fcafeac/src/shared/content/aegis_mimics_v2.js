import {combatInteger,multiplyCombat} from '../contracts/combat_amount.js';
import {integerBigInt} from '../contracts/integer_domain.js';
import {copyWire} from '../contracts/wire.js';

export const AEGIS_MIMICS_VERSION='aegis-mimics-v2';
export const AEGIS_MIMICS=Object.freeze({count:3,orbitRadius:62,orbitSpeed:.012,detachNumerator:1,detachDenominator:2,landingTicks:30,recallTicks:120,enrageRecoveryTicks:75,enrageMoveSpeed:2,affixId:'swift_commander'});
export function aegisHealthBudget(total){
 const n=integerBigInt(total),body=n*4n/5n,pool=n-body,each=pool/3n,remainder=Number(pool%3n);
 return {body:String(body),mimics:Array.from({length:3},(_,i)=>String(each+(i<remainder?1n:0n)))};
}
export function aegisMimicFor(state,entityId){
 for(const boss of Object.values(state.bossCombat?.bossesByEntityId??{})){const mimic=boss.mimicEncounter?.mimicsByEntityId?.[entityId];if(mimic)return {boss,mimic};}return null;
}
export function aegisMimicActive(state,id){const row=aegisMimicFor(state,id);return !row||row.mimic.stage==='detached';}
export function aegisMimicTargetable(state,id){const row=aegisMimicFor(state,id);return !row||!['fused','defeated'].includes(row.mimic.stage);}
export function aegisMimicCorporeal(state,id){const row=aegisMimicFor(state,id);return !row||['landing','detached'].includes(row.mimic.stage);}
export function aegisMimicOrbitPosition(bossPosition,tick,ordinal){const a=tick*AEGIS_MIMICS.orbitSpeed+ordinal*Math.PI*2/3;return {x:bossPosition.x+Math.cos(a)*62,y:bossPosition.y+Math.sin(a)*62};}
export function aegisComponentProfile(state,actor,profile){
 const boss=state.bossCombat?.bossesByEntityId?.[actor.entityId];
 if(boss?.mimicEncounter)return {...profile,maxHp:aegisHealthBudget(boss.mimicEncounter.totalMaxHp).body};
 const row=aegisMimicFor(state,actor.entityId);return row?{...profile,maxHp:row.mimic.maxHp}:profile;
}
export function createAegisMimicEncounter(totalMaxHp,members,tick){return {version:AEGIS_MIMICS_VERSION,totalMaxHp:copyWire(totalMaxHp),recallStartedTick:null,recallEndsTick:null,recallResolvedTick:null,towerMaxHp:'0',enragedTick:null,mimicsByEntityId:Object.fromEntries(members.map((m,ordinal)=>[m.entityId,{entityId:m.entityId,ordinal,roomId:m.roomId,homePosition:copyWire(m.position),maxHp:m.maxHp,stage:'orbiting',stageStartedTick:tick,detachedTick:null,defeatedTick:null}]))};}
export function livingFusedMimics(state,boss){return Object.values(boss.mimicEncounter?.mimicsByEntityId??{}).filter(m=>m.stage==='fused'&&state.entitiesById[m.entityId]?.alive).sort((a,b)=>a.ordinal-b.ordinal);}
export function aegisTowerHealth(state,boss){return String(livingFusedMimics(state,boss).reduce((sum,m)=>sum+integerBigInt(state.entitiesById[m.entityId].hp),0n));}
export const aegisTowerHalfAngle=count=>.25+count*.12;
export function projectAegisMimic(state,id){const row=aegisMimicFor(state,id);if(!row)return null;const {boss,mimic:m}=row;return {bossId:boss.bossId,sourceEntityId:boss.entityId,ordinal:m.ordinal,stage:m.stage,stageStartedTick:m.stageStartedTick,detachedTick:m.detachedTick,bossPosition:copyWire(state.entitiesById[boss.entityId].position),recallEndsTick:boss.mimicEncounter.recallEndsTick};}
