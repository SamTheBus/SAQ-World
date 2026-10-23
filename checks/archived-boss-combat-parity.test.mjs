import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {combatInteger,compareCombat} from '../src/shared/contracts/combat_amount.js';
import {createRecoveredBossV1} from '../src/shared/contracts/recovered_boss_v1.js';
import {initialBossCombatD12_5A,installBossRecordsD12_5A,validateBossCombatD12_5A,projectBossHazardsD12_5A} from '../src/shared/contracts/boss_combat_d12_5.js';
import {createRecoveredBossCombatV1} from '../src/simulation/recovered_boss_v1.js';
import {originalFireCone,originalCinderRushEndpoint,originalArenaRing,onOriginalRing} from '../src/simulation/archived_boss_attack_geometry_v1.js';
import {ARCHIVED_FIGHT_PROFILES} from '../src/shared/content/archived_boss_fight_profiles_v1.js';
import {ARACHNID_TREANT_PROFILE} from '../src/shared/content/bosses_d12_5.js';

const sha256=async bytes=>[...new Uint8Array(await webcrypto.subtle.digest('SHA-256',new Uint8Array(bytes)))];
const id=n=>'ent:'+n.toString(16).padStart(32,'0');
const space='spi:'+'4'.repeat(32),group='grp:'+'9'.repeat(32);
const collision=()=>({tileSize:32,width:28,height:28,tiles:Array(28).fill('1'.repeat(28))});
function actor(entityId,team,position){
 return {entityId,team,contentDefinitionId:ARACHNID_TREANT_PROFILE.contentDefinitionId,
  hp:combatInteger(1800),maxHp:combatInteger(1800),attackDamage:combatInteger(30),
  position:{...position},hullRadius:team==='party'?12:34,combatRadius:15,alive:true,
  movementIntent:{x:0,y:0},attackTimer:0,residency:{spaceInstanceId:space,residencyRevision:1}};
}
async function setup(kind,{heroPosition={x:475,y:420},bossPosition={x:420,y:420}}={}){
 const hero=actor(id(1),'party',heroPosition),boss=actor(id(2),'hostile',bossPosition);
 const state={tick:0,entitiesById:{[hero.entityId]:hero,[boss.entityId]:boss},
  playersById:{p:{entityId:hero.entityId,connectionStatus:'connected'}},groupsById:{[group]:{entityIds:[boss.entityId],siteId:'site:test'}},
  spacesByInstanceId:{[space]:{collision:collision()}},bossCombat:initialBossCombatD12_5A(),
  content:{definitionsById:{[ARACHNID_TREANT_PROFILE.contentDefinitionId]:ARACHNID_TREANT_PROFILE}}};
 const created=await createRecoveredBossV1({kind,campaignSeed:'archive-fidelity',siteId:'site:test',floorId:'floor:test',groupId:group,roomId:'room:test',entityId:boss.entityId,
  homePosition:boss.position,activatedTick:0,spaceInstanceId:space,sourceResidencyRevision:1},{sha256});
 installBossRecordsD12_5A(state,[created]);
 const hits=[];
 const controller=createRecoveredBossCombatV1(state,{applyDirectDamage:(source,target,value,mechanic,meta)=>{hits.push({target:target.entityId,mechanic,value,meta,tick:state.tick});return true;}});
 return {state,boss,hero,b:state.bossCombat.bossesByEntityId[boss.entityId],controller,hits};
}
function cast(env,ability,telegraphTicks){
 const {b,state,hero}=env;
 b.actionState='telegraphing';b.activeAbility=ability;b.targetEntityId=hero.entityId;
 b.targetPosition={...hero.position};b.telegraphStartedTick=state.tick;b.resolvesTick=state.tick+telegraphTicks;
 b.abilitySequence++;b.nextActionTick=b.resolvesTick+120;
}
function step(env,tick){env.state.tick=tick;env.controller.beginTick();env.controller.advance();validateBossCombatD12_5A(env.state);}

test('Recovered source footprints: direction-only Scarlet Fire, traversable stag path, seeded arena ring',()=>{
 const origin={x:350,y:350},right={x:450,y:350};
 assert.equal(originalFireCone(origin,right,{x:430,y:350},110,.8,9),true);
 assert.equal(originalFireCone(origin,right,{x:230,y:350},110,.8,9),false,'Dragon breath must not strike behind Hooktail');
 assert.equal(originalFireCone(origin,right,{x:420,y:500},110,.8,9),false,'Dragon breath must not be a giant circle');
 const c=collision(),end=originalCinderRushEndpoint(c,{x:320,y:320},{x:460,y:320},28);
 assert.ok(end.x>450&&end.x<=525,'Original charge runs past its locked target but respects max distance');
 const ring=originalArenaRing(c,{x:420,y:420},0);
 assert.ok(ring?.tiles.length>=20,'Actual stage tile coordinates, not a circular warning');
 assert.ok(onOriginalRing(ring,{x:ring.tiles[0].x+10,y:ring.tiles[0].y+10}));
 assert.equal(onOriginalRing(ring,{x:420,y:420}),false);
});

test('Cinderhart 24-tick cast becomes 24-tick physical rush with saved connected fire',async()=>{
 const env=await setup('cinderhart',{bossPosition:{x:300,y:420},heroPosition:{x:500,y:420}});
 const origin=env.boss.position.x;
 cast(env,'fire_charge',54);
 step(env,54);
 assert.equal(env.b.actionState,'rushing');
 assert.equal(env.boss.position.x,origin,'Rush cannot teleport to the target in a single cast tick');
 assert.equal(env.b.archive.charge.endsTick,78,'Real attack lasts 24 simulation ticks');
 step(env,55);
 assert.ok(env.boss.position.x>origin);
 assert.ok(env.boss.position.x<500,'The stag cannot teleport 200px within one frame');
 for(let i=56;i<=78;i++)step(env,i);
 assert.equal(env.b.actionState,'idle');
 assert.equal(env.b.archive.charge,null);
 assert.ok(env.boss.position.x>500,'The charge crosses the committed position');
 const patches=env.b.pools.filter(p=>p.kind==='fire');
 assert.ok(patches.length>=8,'Actual 24-tick rush paints connected ground fire');
 assert.ok(patches.every(p=>p.expiresTick===p.createdTick+180));
});

test('Corrosive spore storm creates independently saved, seeking and poisonous projectiles',async()=>{
 const env=await setup('corrosive_abomination',{heroPosition:{x:465,y:420},bossPosition:{x:420,y:420}});
 cast(env,'spore_storm',85);
 step(env,85);
 assert.equal(Object.keys(env.b.archive.sporesById).length,3,'Three original drifting pods spawn');
 assert.equal(env.b.pools.filter(p=>p.kind==='acid').length,0,'Spore storm is not a fake acid pool attack');
 for(let t=86;t<=90;t++)step(env,t);
 assert.ok(env.hits.some(h=>h.mechanic==='corrosive_spore'),'Live spore hits a real target');
 assert.ok(env.b.archive.poisonByEntityId[env.hero.entityId]?.stacks>=1,'Hit applies stackable real poison');
 const screen=projectBossHazardsD12_5A(env.state,space);
 assert.ok(Array.isArray(screen.recoveredSpores));
});

test('Hooktail produces real physical collapsed tile rings without rerolling floor collision',async()=>{
 const env=await setup('hooktail',{heroPosition:{x:510,y:420},bossPosition:{x:420,y:420}});
 const original=structuredClone(env.state.spacesByInstanceId[space].collision);
 env.b.phase=2;env.b.phase2Triggered=true;
 cast(env,'arena_collapse',85);
 step(env,85);
 assert.equal(env.b.archive.collapsedRings.length,1);
 assert.ok(env.b.archive.collapsedRings[0].tiles.length>=20);
 assert.deepEqual(env.state.spacesByInstanceId[space].collision,original,'Never rewrite seeded dungeon floor');
 assert.equal(projectBossHazardsD12_5A(env.state,space).recoveredCollapsedRings.length,1);
});

test('Original ability timing and Void single phase apply to freshly activated native site records',async()=>{
 for(const kind of Object.keys(ARCHIVED_FIGHT_PROFILES)){
  const env=await setup(kind);
  assert.ok(env.b.archive,'New native site boss should own archive authority state');
  const attacks=ARCHIVED_FIGHT_PROFILES[kind].attack;
  const ability=Object.keys(attacks)[0];
  cast(env,ability,attacks[ability]);
  validateBossCombatD12_5A(env.state);
  step(env,attacks[ability]);
  if(kind==='void_overseer'){
   env.boss.hp=combatInteger(300);step(env,attacks[ability]+1);
   assert.equal(env.b.phase,1,'Original Void is a single-phase encounter');
  }
 }
});
