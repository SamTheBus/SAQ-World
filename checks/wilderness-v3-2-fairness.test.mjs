// Test using: node --test checks/wilderness-v3-2-fairness.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {worldLevelGapMultiplier,WORLD_COMBAT_HASH,WORLD_COMBAT_VERSION,WORLD_COMBAT_POLICY} from '../src/shared/content/world_combat_v1.js';
import {WILDERNESS_VERSION,WILDERNESS_HASH} from '../src/shared/content/wilderness_v2.js';
import {wildernessFairLevelGap,usesWildernessFairnessV3_2,WILDERNESS_FAIRNESS_V3_2} from '../src/shared/content/wilderness_fairness_v3_2.js';
import {presentCombat} from '../src/shared/contracts/combat_amount.js';
import fs from 'node:fs/promises';

const live = {d9World:{plannedWorld:{combatVersion:WORLD_COMBAT_VERSION,combatHash:WORLD_COMBAT_HASH,wildernessVersion:WILDERNESS_VERSION,wildernessHash:WILDERNESS_HASH}}};
const old = {d9World:{plannedWorld:{combatVersion:WORLD_COMBAT_VERSION,combatHash:WORLD_COMBAT_HASH}}};

test('only committed Wilderness World Combat worlds opt in; legacy and classic saves retain old rules',()=>{
 assert.equal(usesWildernessFairnessV3_2(live),true);
 assert.equal(usesWildernessFairnessV3_2(old),false);
 assert.equal(usesWildernessFairnessV3_2({d9World:{plannedWorld:{...live.d9World.plannedWorld,wildernessHash:'nope'}}}),false);
 assert.equal(usesWildernessFairnessV3_2(null),false);
 assert.equal(WORLD_COMBAT_POLICY.levelGap.incoming,'min(4,(4+max(enemy level-hero level-2,0)^2)/4)');
 assert.equal(WILDERNESS_FAIRNESS_V3_2.version,'wilderness-v3-2-level-fairness-1');
});

test('higher-level enemies no longer receive damage boost; offense stays deterministic, monotonic and exact',()=>{
 const deltas=[0,1,2,3,4,5,8,10,20,50];
 for(const hero of [1,6,11,21,41])for(const delta of deltas){
  const enemy=hero+delta;
  const base=worldLevelGapMultiplier(hero,enemy),fair=wildernessFairLevelGap(hero,enemy),repeated=wildernessFairLevelGap(hero,enemy);
  assert.deepEqual(fair,repeated);
  assert.deepEqual(fair.outgoing,base.outgoing,'existing MapleStory-like offense resistance must remain exactly unchanged');
  assert.equal(fair.incoming.n,'1');assert.equal(fair.incoming.d,'1');
  assert.ok(presentCombat(fair.outgoing)<=1);
 }
 assert.equal(presentCombat(worldLevelGapMultiplier(1,11).incoming),4,'legacy combat still exhibits old multiplier');
 assert.equal(presentCombat(wildernessFairLevelGap(1,11).incoming),1);
 assert.equal(presentCombat(wildernessFairLevelGap(1,4).outgoing),.8);
 assert.equal(presentCombat(wildernessFairLevelGap(1,11).outgoing),1/17);
 assert.throws(()=>wildernessFairLevelGap(0,1));
 assert.equal(wildernessFairLevelGap('9007199254740993000',1).incoming.n,'1');
});

test('authoritative combat selects fairness at damage delivery, even when the world is bound after genesis',async()=>{
 const s=await fs.readFile(new URL('../src/simulation/activity_simulation.js',import.meta.url),'utf8');
 assert.match(s,/usesWildernessFairnessV3_2\(state\) \? wildernessFairLevelGap : worldLevelGapMultiplier/);
 assert.match(s,/\?levelGapForWorld\(progression\.combatLevel/);
 assert.match(s,/source\.team==='hostile'&&levelGap&&levelGap\.incoming/);
 assert.match(s,/source\.team==='party'&&!resolvedComponent/);
});
