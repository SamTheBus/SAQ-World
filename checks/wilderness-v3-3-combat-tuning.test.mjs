// Unit and source integration regressions. Run with node --test.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {WORLD_COMBAT_VERSION,WORLD_COMBAT_HASH,WORLD_COMBAT_POLICY} from '../src/shared/content/world_combat_v1.js';
import {WILDERNESS_VERSION,WILDERNESS_HASH} from '../src/shared/content/wilderness_v2.js';
import {wildernessCleaveTuning,wildernessCrowdHitEligible,wildernessCrowdHitBlocked,rememberWildernessCrowdHit,expireWildernessCrowdGrace,clearWildernessCrowdGrace} from '../src/shared/content/wilderness_combat_tuning_v3_3.js';
import {selectForwardActors} from '../src/simulation/primary_rules.js';
const world=()=>({tick:100,d9World:{plannedWorld:{combatVersion:WORLD_COMBAT_VERSION,combatHash:WORLD_COMBAT_HASH,wildernessVersion:WILDERNESS_VERSION,wildernessHash:WILDERNESS_HASH}},entitiesById:{hero:{alive:true}},wildernessCrowdGraceByEntityId:{}});
const mob=(id,x=20,y=0)=>({entityId:id,team:'hostile',kind:'actor',alive:true,position:{x,y}});
const hero={entityId:'hero',team:'party',kind:'actor',alive:true,position:{x:0,y:0}};
test('Wilderness narrows to 127 degree forward 2/3/4 cleave; legacy frozen',()=>{
 const targets=[mob('a',20),mob('b',24,4),mob('c',28,-9),mob('d',30),mob('side',5,25),mob('behind',-8)];
 for(const [step,limit] of [[1,2],[2,3],[3,4]]){
  const tune=wildernessCleaveTuning(world(),step);
  assert.equal(tune.forwardDotMinimum,.45);assert.equal(tune.maxTargets,limit);
  assert.deepEqual(selectForwardActors(hero,targets,{x:1,y:0},tune.forwardDotMinimum,()=>true,tune.maxTargets),['a','b','c','d'].slice(0,limit));
 }
 assert.equal(WORLD_COMBAT_POLICY.primary.forwardDotMinimum,.1);
 assert.deepEqual(WORLD_COMBAT_POLICY.primary.cleaveTargetsByCombo,[4,6,8]);
 assert.equal(wildernessCleaveTuning({d9World:{plannedWorld:{combatVersion:WORLD_COMBAT_VERSION,combatHash:WORLD_COMBAT_HASH}}},1),null);
});
test('15-tick HP grace survives wire reopen, expires, is player-specific',()=>{
 const s=world(),a=mob('a'),b=mob('b');assert.equal(wildernessCrowdHitBlocked(s,a,hero),false);
 assert.equal(rememberWildernessCrowdHit(s,a,hero),true);
 assert.equal(s.wildernessCrowdGraceByEntityId.hero,115);
 assert.equal(wildernessCrowdHitBlocked(s,b,hero),true);
 const copy=JSON.parse(JSON.stringify(s));copy.tick=114;
 assert.equal(wildernessCrowdHitBlocked(copy,b,hero),true);
 copy.tick=115;expireWildernessCrowdGrace(copy);
 assert.equal(wildernessCrowdHitBlocked(copy,b,hero),false);
 assert.equal(wildernessCrowdHitBlocked(s,b,{...hero,entityId:'player2'}),false);
 clearWildernessCrowdGrace(s,'hero');assert.deepEqual(s.wildernessCrowdGraceByEntityId,{});
});
test('bosses and periodic/scripted attacks bypass ordinary hit grace',()=>{
 const s=world(),a=mob('a');rememberWildernessCrowdHit(s,a,hero);
 assert.equal(wildernessCrowdHitBlocked(s,{...a,boss:{}},hero),false);
 assert.equal(wildernessCrowdHitBlocked(s,a,hero,{scripted:true}),false);
 assert.equal(wildernessCrowdHitBlocked(s,a,hero,{periodic:true}),false);
 assert.equal(wildernessCrowdHitBlocked(s,a,hero,{trigger:'periodic'}),false);
 s.bossCombat={bossesByEntityId:{a:{}}};assert.equal(wildernessCrowdHitEligible(s,a,hero),false);
});
test('authoritative delivery, unchanged reach, signed saves and equal Worker schema',async()=>{
 const sim=await fs.readFile(new URL('../src/simulation/activity_simulation.js',import.meta.url),'utf8');
 const a=await fs.readFile(new URL('../src/shared/contracts/activity_state.js',import.meta.url),'utf8');
 const b=await fs.readFile(new URL('../worker/wilderness-v3-migrationfix-20261022/src/shared/contracts/activity_state.js',import.meta.url),'utf8');
 assert.equal(a,b.replaceAll('?v=wilderness-v3-5-ecology-20261022',''));
 assert.match(a,/safeInteger\(untilTick,s\.tick\+1,s\.tick\+15\)/);
 assert.match(sim,/wildernessCrowdHitBlocked\(state,source,target,attribution\)/);
 assert.ok(sim.indexOf('wildernessCrowdHitBlocked(state,source,target,attribution)')<sim.indexOf('incomingSubweaponHit({combat:'));
 assert.match(sim,/target\.alive&&compareCombat\(result\.damage,0\)>0\)rememberWildernessCrowdHit/);
 assert.match(sim,/cleave\?\.maxTargets/);
 assert.match(sim,/clearHullGap\(source,target\)<=\(hasWorldCombat\(state\)\?a\.attackReach:20\)/);
 assert.match(sim,/usesWildernessFairnessV3_2\(state\) \? wildernessFairLevelGap : worldLevelGapMultiplier/);
});
