import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {WORLD_COMBAT_VERSION,WORLD_COMBAT_HASH} from '../src/shared/content/world_combat_v1.js';
import {WILDERNESS_VERSION,WILDERNESS_HASH} from '../src/shared/content/wilderness_v2.js';
import {WILDERNESS_PACK_PACING_V3_4,wildernessPackPursuitAllowed} from '../src/shared/content/wilderness_pack_pacing_v3_4.js';
const actor=(id,x)=>({entityId:id,kind:'actor',team:'hostile',alive:true,hp:'100',maxHp:'100',position:{x,y:0},attackReach:32,combatRadius:10,ai:{melee:{phase:'idle'}},residency:{spaceInstanceId:'world'}});
const fixture=(level=1)=>{
 const ids=['a','b','c','d','e','f'],actors=Object.fromEntries(ids.map((id,n)=>[id,actor(id,180+n*20)]));
 const hero={entityId:'hero',kind:'actor',team:'party',alive:true,position:{x:0,y:0},combatRadius:10,residency:{spaceInstanceId:'world'}};
 const group={groupId:'group',siteId:null,entityIds:ids,containment:{mode:'engaged'}};
 const state={tick:100,d9World:{plannedWorld:{combatVersion:WORLD_COMBAT_VERSION,combatHash:WORLD_COMBAT_HASH,wildernessVersion:WILDERNESS_VERSION,wildernessHash:WILDERNESS_HASH}},playersById:{one:{entityId:'hero',progression:{level}}},entitiesById:{...actors,hero}};
 return {state,group,hero,actors};
};
test('unprovoked early overworld pack sends the three nearest eligible pursuers',()=>{
 const {state,group,hero,actors}=fixture();
 assert.equal(WILDERNESS_PACK_PACING_V3_4.maxUnprovokedPursuersPerPack,3);
 assert.deepEqual(group.entityIds.filter(id=>wildernessPackPursuitAllowed(state,group,actors[id],hero)),['a','b','c']);
 const reversed={...group,entityIds:[...group.entityIds].reverse()};
 assert.deepEqual(reversed.entityIds.filter(id=>wildernessPackPursuitAllowed(state,reversed,actors[id],hero)).sort(),['a','b','c']);
 // One of the closest actors is obstructed. It cannot consume a pursuit slot.
 const visible=(member)=>member.entityId!=='a';
 assert.deepEqual(group.entityIds.filter(id=>wildernessPackPursuitAllowed(state,group,actors[id],hero,visible)),['b','c','d']);
});
test('provoking the group restores full retaliation; close combat and elites are exempt',()=>{
 const {state,group,hero,actors}=fixture();
 assert.equal(wildernessPackPursuitAllowed(state,group,actors.f,hero),false);
 actors.f.hp='99';
 assert.equal(wildernessPackPursuitAllowed(state,group,actors.f,hero),true);
 actors.f.hp='100';actors.f.alive=false;
 assert.equal(wildernessPackPursuitAllowed(state,group,actors.e,hero),true,'a one-shot pack kill must provoke every survivor');
 actors.f.alive=true;actors.f.position={x:40,y:0};
 assert.equal(wildernessPackPursuitAllowed(state,group,actors.f,hero),true);
 actors.f.position={x:280,y:0};actors.f.ai.melee.phase='windup';
 assert.equal(wildernessPackPursuitAllowed(state,group,actors.f,hero),true);
 actors.f.ai.melee.phase='idle';state.eliteCombat={elitesByEntityId:{f:{}}};
 assert.equal(wildernessPackPursuitAllowed(state,group,actors.f,hero),true);
});
test('higher-level heroes, existing sites, short packs and legacy rules do not change',()=>{
 const {state,group,hero,actors}=fixture(6);
 assert.equal(wildernessPackPursuitAllowed(state,group,actors.f,hero),true);
 state.playersById.one.progression.level=1;
 assert.equal(wildernessPackPursuitAllowed(state,{...group,siteId:'site:fort'},actors.f,hero),true);
 assert.equal(wildernessPackPursuitAllowed(state,{...group,entityIds:['a','b','c']},actors.c,hero),true);
 delete state.d9World.plannedWorld.wildernessHash;
 assert.equal(wildernessPackPursuitAllowed(state,group,actors.f,hero),true);
});
test('pacing only gates overworld auto-target selection, not damage/save/world generation',async()=>{
 const source=await fs.readFile(new URL('../src/simulation/encounter_containment_d11_2.js',import.meta.url),'utf8');
 assert.match(source,/wildernessPackPursuitAllowed\(state,group,actor,target,eligible\)/);
 assert.match(source,/function targetStillValid\(actor,target,eligible\)/);
 const sim=await fs.readFile(new URL('../src/simulation/activity_simulation.js',import.meta.url),'utf8');
 assert.match(sim,/wildernessCrowdHitBlocked\(state,source,target,attribution\)/);
 assert.match(sim,/wildernessCleaveTuning\(state,action.comboStep\)/);
 const html=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/data-world-release="wilderness-v3-starter-20261022"/);
 assert.match(html,/save-worker\.wilderness-v3-migrationfix-20261022-crowd-v3-3\.js/);
});
