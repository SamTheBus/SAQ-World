import test from 'node:test';
import assert from 'node:assert/strict';
import {combatInteger} from '../src/shared/contracts/combat_amount.js';
import {drawMarcusTheOutlaw,drawMarcusGround,marcusDepthItems} from '../src/client/boss_presentation_marcus_the_outlaw_v1.js';
import {drawGildedVaultKeeper,drawGildedGround,gildedDepthItems} from '../src/client/boss_presentation_gilded_vault_keeper_v1.js';
import {hasTreasuryBossPainter,drawTreasuryBossV2,drawTreasuryBossGroundV2,treasuryBossDepthItems,drawTreasuryBossHudV2} from '../src/client/boss_original_treasury_world_adapter_v1.js';

function painter(){
 const counter={save:0,fill:0,stroke:0,arc:0,ellipse:0},gradient={addColorStop(){}};
 const c=new Proxy({globalAlpha:1},{get(o,k){if(k in o)return o[k];if(k==='measureText')return()=>({width:10});if(k==='createRadialGradient'||k==='createLinearGradient')return()=>gradient;
  return(...args)=>{for(const n of args)if(typeof n==='number'&&!Number.isFinite(n))throw Error('Invalid Canvas number '+String(k)+' '+n);
   if(k==='save'){counter.save++;return;}if(k==='restore'){counter.save--;return;}
   if(k in counter)counter[k]++;
  };},set(o,k,v){o[k]=v;return true;}});
 return{c,counter};
}
const ent=n=>'ent:'+n.toString(16).padStart(32,'0');
function actors(kind){
 const hero={entityId:ent(3),team:'party',alive:true,position:{x:505,y:420},hp:combatInteger(900),maxHp:combatInteger(1000)};
 const boss={entityId:ent(2),team:'hostile',alive:true,position:{x:430,y:420},hp:combatInteger(1400),maxHp:combatInteger(1800),visualSeed:163,movedLastTick:false,
  boss:{bossDefinitionId:kind,bossId:'boss:'+'7'.repeat(32),phase:2,abilitySequence:5,actionState:'telegraphing',
  pendingAction:{ability:kind==='marcus'?'coin_barrage':'gold_fall',startedTick:20,resolvesTick:120,targetPosition:{...hero.position}},
  lastAction:null,coinShots:[],shieldActive:false,shieldHp:'0',shieldMaxHp:'0'}};
 const model={tick:55,entitiesById:{[hero.entityId]:hero,[boss.entityId]:boss},bossHazards:{
  recoveredPools:[],recoveredTelegraphs:[{bossId:boss.boss.bossId,bossDefinitionId:kind,ability:boss.boss.pendingAction.ability,
    position:{...hero.position},originPosition:{...boss.position},startedTick:20,resolvesTick:120,sequence:5}]}};
 return {boss,hero,model};
}

test('Original uploaded Marcus and Gilded Canvas exports, not approximations',()=>{
 for(const fn of [drawMarcusTheOutlaw,drawMarcusGround,marcusDepthItems,drawGildedVaultKeeper,drawGildedGround,gildedDepthItems])assert.equal(typeof fn,'function');
 assert.ok(hasTreasuryBossPainter('marcus'));assert.ok(hasTreasuryBossPainter('gilded_vault_keeper'));
 assert.equal(hasTreasuryBossPainter('corrosive_abomination'),false);
});

test('Both authentic painters accept World boss DTOs while leaving saved state untouched',()=>{
 for(const kind of ['marcus','gilded_vault_keeper']){
  const {boss,model}=actors(kind),before=JSON.stringify(model),{c,counter}=painter();
  assert.equal(drawTreasuryBossV2(c,boss,55),true);
  drawTreasuryBossGroundV2(c,model,55);
  const layers=treasuryBossDepthItems(model,55,{x:0,y:0,width:1100,height:800});
  for(const item of layers){assert.equal(typeof item.draw,'function');item.draw(c);}
  assert.ok(counter.fill>3,'Original body rendered multiple filled shapes');
  assert.ok(counter.stroke>3,'Original body rendered outlined shapes');
  assert.equal(counter.save,0,'Every canvas save must be restored');
  assert.equal(JSON.stringify(model),before,'Visuals must not mutate game-state DTOs');
 }
});

test('Marcus original eight coin projectiles are depth-layered independently',()=>{
 const {boss,model}=actors('marcus');
 boss.boss.pendingAction=null;
 boss.boss.coinShots=Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return{id:'coin:'+i,ordinal:i,sequence:3,
  position:{x:boss.position.x+Math.cos(a)*60,y:boss.position.y+Math.sin(a)*60},velocity:{x:Math.cos(a)*4.2,y:Math.sin(a)*4.2},firedTick:50,expiresTick:170,bounces:0};});
 const {c,counter}=painter(),items=treasuryBossDepthItems(model,55,{x:0,y:0,width:1100,height:800});
 const coins=items.filter(row=>String(row.id).includes('/coin'));
 assert.equal(coins.length,8,'Exactly eight physically authoritative original coin sprites');
 for(const coin of coins)coin.draw(c);
 assert.equal(counter.save,0);
});

test('Original Gilded shield geometry remains animated with no fake stolen-gold effects',()=>{
 const {boss,model}=actors('gilded_vault_keeper');
 boss.boss.shieldActive=true;boss.boss.shieldHp='270';boss.boss.shieldMaxHp='270';boss.boss.pendingAction={ability:'taxation',startedTick:30,resolvesTick:270,targetPosition:{x:505,y:420}};
 const before=JSON.stringify(model),{c,counter}=painter();
 assert.equal(drawTreasuryBossV2(c,boss,55),true);
 drawTreasuryBossGroundV2(c,model,55);
 const layers=treasuryBossDepthItems(model,55,{x:0,y:0,width:1100,height:800});
 assert.ok(layers.some(x=>String(x.id).includes('/ward')),'Original angular shield must render');
 for(const layer of layers)layer.draw(c);
 assert.equal(drawTreasuryBossHudV2(c,{width:800,height:700},model),true);
 assert.equal(counter.save,0);
 assert.equal(JSON.stringify(model),before,'Gold and inventory unchanged by display');
});