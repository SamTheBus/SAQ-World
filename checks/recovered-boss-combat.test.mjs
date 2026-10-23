import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {RECOVERED_BOSSES} from '../src/shared/content/recovered_boss_catalog_v1.js';
import {createRecoveredBossV1} from '../src/shared/contracts/recovered_boss_v1.js';
import {initialBossCombatD12_5A,installBossRecordsD12_5A,validateBossCombatD12_5A} from '../src/shared/contracts/boss_combat_d12_5.js';
import {createRecoveredBossCombatV1} from '../src/simulation/recovered_boss_v1.js';
import {combatInteger} from '../src/shared/contracts/combat_amount.js';
import {ARACHNID_TREANT_PROFILE} from '../src/shared/content/bosses_d12_5.js';

const sha256=async bytes=>[...new Uint8Array(await webcrypto.subtle.digest('SHA-256',new Uint8Array(bytes)))];
const id=i=>'ent:'+i.toString(16).padStart(32,'0');
const arena=()=>({tileSize:32,width:28,height:28,tiles:Array(28).fill('1'.repeat(28))});
function hostile(entityId,pos,spaceInstanceId,maxHp=1000){
 return {entityId,kind:'actor',team:'hostile',contentDefinitionId:ARACHNID_TREANT_PROFILE.contentDefinitionId,
  hp:combatInteger(maxHp),maxHp:combatInteger(maxHp),attackDamage:combatInteger(20),
  position:{...pos},hullRadius:16,combatRadius:16,alive:true,movementIntent:{x:0,y:0},
  attackTimer:0,residency:{spaceInstanceId,residencyRevision:1}};
}

test('All eight recovered boss controllers preserve valid saved states while attacking and phasing', {timeout:120000}, async()=>{
 let i=0;
 for(const spec of Object.values(RECOVERED_BOSSES)){
  const space='spi:'+'5'.repeat(32),heroId=id(1),bossId=id(2),groupId='grp:'+'7'.repeat(32);
  const p={...hostile(heroId,{x:490,y:445},space,1000),team:'party',contentDefinitionId:'hero',hullRadius:13,combatRadius:13};
  const boss=hostile(bossId,{x:430,y:420},space,1000);boss.hullRadius=34;
  const entityMap={[heroId]:p,[bossId]:boss};
  const members=Array.from({length:spec.adds},(_,ordinal)=>{
   const eid=id(ordinal+3),pos={x:420+ordinal*25,y:505+(ordinal%2)*24};
   entityMap[eid]=hostile(eid,pos,space,110);
   return {entityId:eid,position:pos};
  });
  const state={tick:0,entitiesById:entityMap,playersById:{p:{entityId:heroId,connectionStatus:'connected'}},
   spacesByInstanceId:{[space]:{collision:arena()}},
   groupsById:{[groupId]:{entityIds:[bossId,...members.map(m=>m.entityId)],siteId:'site:test'}},
   bossCombat:initialBossCombatD12_5A(),content:{definitionsById:{[ARACHNID_TREANT_PROFILE.contentDefinitionId]:ARACHNID_TREANT_PROFILE}}};
  const record=await createRecoveredBossV1({kind:spec.id,campaignSeed:'test',siteId:'site:test',floorId:'floor:test',groupId,roomId:'room:test',
   entityId:bossId,homePosition:boss.position,activatedTick:0,spaceInstanceId:space,sourceResidencyRevision:1,addMembers:members},{sha256});
  installBossRecordsD12_5A(state,[record]);
  const cb=createRecoveredBossCombatV1(state,{applyDirectDamage:()=>true});
  let positionsChanged=false,wasDazed=false;
  for(let tick=0;tick<1050;tick++){
   state.tick=tick;
   if(tick===390)boss.hp=combatInteger(350);
   cb.beginTick();
   cb.observeTarget(boss,p);
   cb.advance();
   wasDazed ||= record.boss.actionState==='dazed';
   if(tick%40===0)validateBossCombatD12_5A(state);
   for(const m of members)if(entityMap[m.entityId].position.x!==m.position.x||entityMap[m.entityId].position.y!==m.position.y)positionsChanged=true;
  }
  validateBossCombatD12_5A(state);
  const r=state.bossCombat.bossesByEntityId[bossId],stats=cb.inspect();
  assert.equal(r.phase,spec.id==='void_overseer'?1:2,spec.id+' must keep its archived phase structure');
  assert.ok(stats.casts>=1,spec.id+' should perform authored actions');
  if(spec.id==='chronos_arbitrator')assert.equal(r.chunkStep,1,'Chronos Rewind should execute only one phase trigger');
  if(spec.id==='nexus_overseer')assert.equal(r.summonEntityIds.filter(id=>state.bossCombat.summonsByEntityId[id].stage==='hatched').length,2);
  if(spec.id==='corrosive_abomination'){assert.ok(r.chunkStep>=8);assert.ok(stats.summons>=5);}
  if(spec.id==='cinderhart'){
   assert.ok(r.summonEntityIds.some(id=>state.bossCombat.summonsByEntityId[id].stage==='hatched'),'Rabbits must actually spawn');
   assert.ok(positionsChanged,'Rabbit movement must not be decorative');
   assert.ok(r.pools.some(x=>x.kind==='fire'),'Independent hops ignite landing patches');
  }
  console.log('BOSS_COMBAT_REPLAY',spec.id,JSON.stringify({...stats,phase:r.phase,summons:r.summonEntityIds.length,pools:r.pools.length}));
  i++;
 }
 assert.equal(i,8);
});
