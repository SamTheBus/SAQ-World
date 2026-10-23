import test from 'node:test';
import assert from 'node:assert/strict';
import {combatInteger} from '../src/shared/contracts/combat_amount.js';
import {drawRecoveredBossV1,drawRecoveredBossGroundV1,drawRecoveredSummonV1} from '../src/client/recovered_boss_presentation_v1.js';
import {archivedBossDepthItems,hasArchivedBossPainter} from '../src/client/boss_archive_world_adapter_v1.js';
import {drawChronosArbitrator,chronosAttackPose} from '../src/client/boss_presentation_chronos_arbitrator_v1.js';
import {drawNexusOverseer,nexusAttackPose} from '../src/client/boss_presentation_nexus_overseer_v1.js';
import {drawHooktail,hooktailAttackPose} from '../src/client/boss_presentation_hooktail_v1.js';
import {drawCinderhart,drawCinderBunny,cinderhartAttackPose} from '../src/client/boss_presentation_cinderhart_v1.js';
function painter(){
 const stats={ellipses:0,strokes:0,paths:0,stack:0},gradient={addColorStop(){}};
 const c=new Proxy({globalAlpha:1}, {get(target,k){
  if(k in target)return target[k];
  if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>gradient;
  if(k==='measureText')return ()=>({width:20});
  return (...args)=>{
   if(['ellipse','arc','translate','scale','rotate','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','rect','fillRect','strokeRect'].includes(k))for(const v of args)if(typeof v==='number'&&!Number.isFinite(v))throw Error(`${String(k)} nonfinite ${v}`);
   if(k==='ellipse')stats.ellipses++;
   if(k==='stroke')stats.strokes++;
   if(k==='beginPath')stats.paths++;
   if(k==='save')stats.stack++;
   if(k==='restore')stats.stack--;
  };
 }});return {c,stats};
}
function actor(kind,n,ability,tick){
 const pos={x:100+n*230,y:420},id='ent:'+n.toString(16).padStart(32,'0'),bossId='boss:'+n.toString(16).padStart(32,'0');
 return {entityId:id,position:pos,alive:true,team:'hostile',hp:combatInteger(850),maxHp:combatInteger(1000),visualSeed:41+n,movedLastTick:false,
 boss:{bossDefinitionId:kind,bossId,phase:2,activatedTick:0,abilitySequence:3,selectionSeed:123456+n,shieldActive:false,
  pendingAction:{ability,startedTick:100,resolvesTick:500,targetPosition:{x:pos.x+64,y:pos.y+12}},lastAction:null,minions:[]}};
}
test('Exactly preserved Canvas implementations export the intended six distinct boss painters',()=>{
 for(const id of ['corrosive_abomination','void_overseer','chronos_arbitrator','nexus_overseer','hooktail','cinderhart'])assert.equal(hasArchivedBossPainter(id),true,id);
 for(const exported of [drawChronosArbitrator,chronosAttackPose,drawNexusOverseer,nexusAttackPose,drawHooktail,hooktailAttackPose,drawCinderhart,drawCinderBunny,cinderhartAttackPose])assert.equal(typeof exported,'function');
});
test('Original Chronos/Nexus/Hooktail/Cinderhart body, ground, telegraph and summons accept saved World presentation DTOs without mutation',()=>{
 const tick=260,chronos=actor('chronos_arbitrator',1,'time_field',tick),nexus=actor('nexus_overseer',2,'prism_collapse',tick),hooktail=actor('hooktail',3,'scarlet_fire',tick),cinderhart=actor('cinderhart',4,'fire_charge',tick);
 const decoy={entityId:'ent:'+'e'.repeat(32),position:{x:nexus.position.x+57,y:nexus.position.y+24},alive:true,bossSummon:{bossId:nexus.boss.bossId,kind:'hologram',stage:'hatched',ordinal:0,activatedTick:120}};
 const bunny={entityId:'ent:'+'d'.repeat(32),position:{x:cinderhart.position.x-49,y:cinderhart.position.y+36},alive:true,bossSummon:{bossId:cinderhart.boss.bossId,kind:'bunny',stage:'hatched',ordinal:1,activatedTick:118}};
 nexus.boss.minions=[{entityId:decoy.entityId,kind:'hologram',stage:'hatched',position:{...decoy.position}}];
 cinderhart.boss.minions=[{entityId:bunny.entityId,kind:'bunny',stage:'hatched',position:{...bunny.position}}];
 const model={tick,entitiesById:Object.fromEntries([chronos,nexus,hooktail,cinderhart,decoy,bunny].map(a=>[a.entityId,a])),bossHazards:{
  recoveredTelegraphs:[chronos,nexus,hooktail,cinderhart].map(a=>({bossId:a.boss.bossId,bossDefinitionId:a.boss.bossDefinitionId,ability:a.boss.pendingAction.ability,
   position:{...a.boss.pendingAction.targetPosition},originPosition:{...a.position},startedTick:100,resolvesTick:500,sequence:3,selectionSeed:a.boss.selectionSeed})),
  recoveredPools:[{id:'fire:1',bossDefinitionId:'cinderhart',kind:'fire',position:{x:cinderhart.position.x+15,y:cinderhart.position.y},radius:20,createdTick:130,expiresTick:440},
   {id:'clock:1',bossDefinitionId:'chronos_arbitrator',kind:'time',position:{x:chronos.position.x+15,y:chronos.position.y},radius:105,createdTick:130,expiresTick:440}]}};
 const before=JSON.stringify(model),{c,stats}=painter();
 for(const a of [chronos,nexus,hooktail,cinderhart])assert.equal(drawRecoveredBossV1(c,a,tick),true,a.boss.bossDefinitionId);
 drawRecoveredBossGroundV1(c,model,tick);
 assert.equal(drawRecoveredSummonV1(c,decoy,tick),true);
 assert.equal(drawRecoveredSummonV1(c,bunny,tick),true);
 const items=archivedBossDepthItems(model,tick,{x:0,y:0,width:2000,height:950});
 for(const x of items){assert.equal(typeof x.draw,'function',x.id);x.draw(c);}
 assert.ok(stats.paths>70,'Actual shape geometry should draw many paths');
 assert.ok(stats.ellipses>30,'Original boss faces and VFX should draw many ellipses');
 assert.equal(stats.stack,0,'Canvas state save/restore imbalance');
 assert.equal(JSON.stringify(model),before,'Drawing changes no authority projection');
});