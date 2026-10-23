import test from 'node:test';
import assert from 'node:assert/strict';
import {combatInteger} from '../src/shared/contracts/combat_amount.js';
import {drawRecoveredBossV1,drawRecoveredBossGroundV1,drawRecoveredBossHudV1,drawRecoveredSummonV1} from '../src/client/recovered_boss_presentation_v1.js';
import {archivedBossArtModel,archivedBossDepthItems,hasArchivedBossPainter} from '../src/client/boss_archive_world_adapter_v1.js';
import {drawCorrosiveAbomination,corrosiveAttackPose} from '../src/client/boss_presentation_corrosive_v1.js';
import {drawVoidOverseer,voidAttackPose} from '../src/client/boss_presentation_void_overseer_v1.js';

function painter(){
 const stats={ellipses:0,strokes:0,fills:0,save:0};
 const gradient={addColorStop(){}};
 const context=new Proxy({globalAlpha:1}, {get(target,key){
  if(key in target)return target[key];
  if(key==='createLinearGradient'||key==='createRadialGradient')return ()=>gradient;
  if(key==='measureText')return ()=>({width:20});
  return (...args)=>{
   if(key==='ellipse'||key==='arc'||key==='translate'||key==='scale'||key==='rotate'||key==='moveTo'||key==='lineTo'||key==='bezierCurveTo'||key==='quadraticCurveTo'){
    for(const x of args)if(typeof x==='number'&&!Number.isFinite(x))throw Error(`${String(key)} nonfinite: ${String(x)}`);
   }
   if(key==='ellipse')stats.ellipses++;
   if(key==='fill')stats.fills++;
   if(key==='stroke')stats.strokes++;
   if(key==='save')stats.save++;
   if(key==='restore')stats.save--;
  };
 }});
 return {context,stats};
}
function boss(kind,n,ability){
 const id='ent:'+n.toString(16).padStart(32,'0');
 const position={x:360+n*140,y:420},bossId='boss:'+n.toString(16).padStart(32,'0');
 return {entityId:id,alive:true,team:'hostile',position,hp:combatInteger(760),maxHp:combatInteger(1000),
  movedLastTick:false,movementIntent:{x:0,y:0},visualSeed:172+n,
  boss:{bossDefinitionId:kind,bossId,phase:2,actionState:'telegraphing',shieldActive:false,
   pendingAction:{ability,targetEntityId:'ent:'+'f'.repeat(32),targetPosition:{x:position.x+75,y:position.y+28},startedTick:100,resolvesTick:460},
   lastAction:null}};
}
test('Original source painters are loaded for the exact two recovered bosses',()=>{
 assert.equal(hasArchivedBossPainter('corrosive_abomination'),true);
 assert.equal(hasArchivedBossPainter('void_overseer'),true);
 assert.equal(hasArchivedBossPainter('marcus'),false);
 assert.equal(typeof drawCorrosiveAbomination,'function');
 assert.equal(typeof drawVoidOverseer,'function');
 assert.equal(typeof corrosiveAttackPose,'function');
 assert.equal(typeof voidAttackPose,'function');
});
test('Archived painters can draw actual World boss DTOs, original attack poses and native VFX without modifying source DTOs',()=>{
 const corrosive=boss('corrosive_abomination',1,'spore_storm'),voidBoss=boss('void_overseer',2,'singularity');
 const slime={entityId:'ent:'+'3'.repeat(32),alive:true,team:'hostile',position:{x:500,y:490},hp:combatInteger(80),maxHp:combatInteger(110),
  bossSummon:{kind:'slime',stage:'hatched',bossId:corrosive.boss.bossId,ordinal:0,activatedTick:70}};
 const model={tick:250,entitiesById:{[corrosive.entityId]:corrosive,[voidBoss.entityId]:voidBoss,[slime.entityId]:slime},
  bossHazards:{recoveredTelegraphs:[
   {bossId:corrosive.boss.bossId,bossDefinitionId:'corrosive_abomination',ability:'spore_storm',position:{x:435,y:448},sequence:1,selectionSeed:212,startedTick:100,resolvesTick:460},
   {bossId:voidBoss.boss.bossId,bossDefinitionId:'void_overseer',ability:'singularity',position:{x:695,y:448},sequence:1,selectionSeed:323,startedTick:100,resolvesTick:460}],
   recoveredPools:[{id:'pool:1',bossDefinitionId:'corrosive_abomination',kind:'acid',position:{x:420,y:465},radius:32,createdTick:110,expiresTick:490}]}};
 const before=JSON.stringify(model),{context:c,stats}=painter();
 const adapted=archivedBossArtModel(model,250);
 assert.ok(adapted&&adapted.bossHazards.corrosiveTelegraphs.length===1&&adapted.bossHazards.voidTelegraphs.length===1);
 assert.equal(adapted.bossHazards.corrosiveMinions.length,1);
 assert.equal(adapted.bossHazards.corrosiveTelegraphs[0].sporeSpawnPositions.length,3);
 assert.equal(drawRecoveredBossV1(c,corrosive,250),true);
 assert.equal(drawRecoveredBossV1(c,voidBoss,250),true);
 assert.equal(drawRecoveredSummonV1(c,slime,250),true); // rendered exactly once by archival depth layer
 drawRecoveredBossGroundV1(c,model,250);
 const items=archivedBossDepthItems(model,250,{x:0,y:0,width:1500,height:900});
 assert.ok(items.length>=4,'Corrosive minion + storm pods must be in actual depth-sort list');
 for(const item of items){assert.equal(typeof item.draw,'function');item.draw(c);}
 const canvas={width:1100,height:820};assert.equal(drawRecoveredBossHudV1(c,canvas,model),true);
 assert.equal(JSON.stringify(model),before,'Visual-only port must never mutate simulation data');
 assert.ok(stats.ellipses>25,'Expected real archived body and arc effects, not generic outlines');
 assert.equal(stats.save,0,'Canvas save/restore must balance');
});