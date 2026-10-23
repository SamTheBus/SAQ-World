import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {createRecoveredBossV1} from '../src/shared/contracts/recovered_boss_v1.js';
import {initialBossCombatD12_5A,installBossRecordsD12_5A,validateBossCombatD12_5A,projectBossActorD12_5A} from '../src/shared/contracts/boss_combat_d12_5.js';
import {createRecoveredBossCombatV1} from '../src/simulation/recovered_boss_v1.js';
import {combatInteger} from '../src/shared/contracts/combat_amount.js';
import {integerBigInt} from '../src/shared/contracts/integer_domain.js';
import {ARACHNID_TREANT_PROFILE} from '../src/shared/content/bosses_d12_5.js';
import {drawTreasuryBossV2,drawTreasuryBossGroundV2,treasuryBossDepthItems,drawTreasuryBossHudV2,hasTreasuryBossPainter} from '../src/client/boss_presentation_treasury_v2.js';
const sha256=async bytes=>[...new Uint8Array(await webcrypto.subtle.digest('SHA-256',new Uint8Array(bytes)))];
const ent=n=>'ent:'+n.toString(16).padStart(32,'0');
const collision=()=>({tileSize:32,width:28,height:28,tiles:Array(28).fill('1'.repeat(28))});
function actor(id,kind,position,space){return {entityId:id,team:kind,contentDefinitionId:ARACHNID_TREANT_PROFILE.contentDefinitionId,
  hp:combatInteger(1800),maxHp:combatInteger(1800),attackDamage:combatInteger(40),position:{...position},hullRadius:34,
  combatRadius:16,alive:true,movementIntent:{x:0,y:0},attackTimer:0,residency:{spaceInstanceId:space,residencyRevision:1}};}
async function battle(kind){
 const space='spi:'+'5'.repeat(32),group='grp:'+'8'.repeat(32),boss=actor(ent(1),'hostile',{x:430,y:420},space),hero=actor(ent(2),'party',{x:510,y:420},space);
 hero.combatRadius=12;hero.hullRadius=12;
 const state={tick:0,entitiesById:{[boss.entityId]:boss,[hero.entityId]:hero},playersById:{p:{entityId:hero.entityId,connectionStatus:'connected'}},
   groupsById:{[group]:{entityIds:[boss.entityId],siteId:'site:test'}},spacesByInstanceId:{[space]:{collision:collision()}},
   bossCombat:initialBossCombatD12_5A(),content:{definitionsById:{[ARACHNID_TREANT_PROFILE.contentDefinitionId]:ARACHNID_TREANT_PROFILE}}};
 const r=await createRecoveredBossV1({kind,campaignSeed:'test',siteId:'site:test',floorId:'floor:test',groupId:group,roomId:'room:test',entityId:boss.entityId,
  homePosition:boss.position,activatedTick:0,spaceInstanceId:space,sourceResidencyRevision:1},{sha256});
 installBossRecordsD12_5A(state,[r]);const hits=[];
 const controller=createRecoveredBossCombatV1(state,{applyDirectDamage:(a,t,d,k,meta)=>{hits.push({a:a.entityId,t:t.entityId,d,k,meta});return true;}});
 const b=state.bossCombat.bossesByEntityId[boss.entityId];
 return {state,boss,hero,b,controller,hits};
}
const ctx=()=>new Proxy({createRadialGradient:()=>({addColorStop(){}})}, {get(o,key){if(key in o)return o[key];return ()=>{};},set(o,key,value){o[key]=value;return true;}});
function plan(b,hero,ability,tick,duration){b.phase=ability==='molten_shield'||ability==='taxation'?2:1;b.phase2Triggered=b.phase===2;
 b.actionState='telegraphing';b.activeAbility=ability;b.targetEntityId=hero.entityId;b.targetPosition={...hero.position};b.telegraphStartedTick=tick;b.resolvesTick=tick+duration;b.abilitySequence=1;}

test('Marcus and Gilded have distinct hand-reconstructed boss renderers',()=>{
 assert.equal(hasTreasuryBossPainter('marcus'),true);assert.equal(hasTreasuryBossPainter('gilded_vault_keeper'),true);
 assert.equal(hasTreasuryBossPainter('hooktail'),false);
 for(const id of ['marcus','gilded_vault_keeper']){
  const body={position:{x:430,y:420},alive:true,boss:{bossDefinitionId:id,bossId:'boss:aa',phase:2,
   shieldHp:'270',shieldMaxHp:'270',stolenGold:'240',coinShots:[]}};
  for(const tick of [0,22,60,148,242])assert.equal(drawTreasuryBossV2(ctx(),body,tick),true);
  const model={tick:98,entitiesById:{boss:body},bossHazards:{recoveredPools:[],recoveredTelegraphs:[{bossId:body.boss.bossId,bossDefinitionId:id,
   position:{x:500,y:440},ability:id==='marcus'?'coin_barrage':'gold_fall',startedTick:20,resolvesTick:120}]}};
  drawTreasuryBossGroundV2(ctx(),model,98);
  drawTreasuryBossHudV2(ctx(),{width:768,height:704},model);
  assert.deepEqual(treasuryBossDepthItems(model,98),[]);
 }
});

test('Marcus fires exactly eight authoritative ricochet coins with persisted state',async()=>{
 const {state,boss,hero,b,controller,hits}=await battle('marcus');
 plan(b,hero,'coin_barrage',0,75);state.tick=75;controller.beginTick();controller.advance();
 assert.equal(b.coinShots.length,8);assert.equal(controller.inspect().coinsSpawned,8);
 validateBossCombatD12_5A(state);
 const projection=projectBossActorD12_5A(state,boss.entityId);
 assert.equal(projection.coinShots.length,8);
 const model={tick:state.tick,entitiesById:{boss:{position:boss.position,alive:true,boss:projection}},bossHazards:{recoveredPools:[],recoveredTelegraphs:[]}};
 assert.equal(treasuryBossDepthItems(model,state.tick).length,8,'Eight separate depth-layered coin sprites');
 for(let t=76;t<=195;t++){
  state.tick=t;controller.beginTick();controller.advance();
  if(t%9===0)validateBossCombatD12_5A(state);
 }
 assert.ok(controller.inspect().coinHits>=1,'A real coin should hit the hero instead of just showing a fake volley');
 assert.ok(hits.some(h=>h.k==='marcus_ricochet_coin'&&h.meta?.projectileImpact),'Coin contacts use projectile provenance');
});

test('Treasury shield remains active after cast, intercepts damage, breaks into real daze',async()=>{
 for(const [kind,ability,duration]of[['marcus','molten_shield',210],['gilded_vault_keeper','taxation',240]]){
  const {state,boss,hero,b,controller}=await battle(kind);
  plan(b,hero,ability,0,duration);b.phase=2;b.phase2Triggered=true;
  b.shieldMaxHp=kind==='marcus'?'360':'270';b.shieldHp=b.shieldMaxHp;
  state.tick=duration;controller.beginTick();controller.advance();
  assert.equal(b.actionState,'idle',kind+' cast should resolve without forcing a permanent telegraph');
  assert.ok(BigInt(b.shieldHp)>0n,'Shield must remain breakable after cast');
  validateBossCombatD12_5A(state);
  const first=controller.mitigateIncoming(boss,combatInteger(100),hero);
  assert.equal(first.shielded,true);assert.equal(integerBigInt(first.damage),0n);
  const broke=controller.mitigateIncoming(boss,combatInteger(500),hero);
  assert.equal(broke.shielded,true);assert.equal(b.actionState,'dazed');
  assert.equal(b.shieldHp,'0');validateBossCombatD12_5A(state);
 }
});