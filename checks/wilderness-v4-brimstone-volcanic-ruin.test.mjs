import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {webcrypto} from 'node:crypto';

import {loadPlannedReviewV1} from '../src/dev/planned_world_review_v1.js';
import {buildRuinFamilyV1} from '../src/shared/content/ruin_family_runtime_v1.js';
import {validateRuinFamily,validateRuinRuntimeV1} from '../src/shared/contracts/planned_ruin_v1.js';
import {initialBossCombatD12_5A,installBossRecordsD12_5A,validateBossCombatD12_5A} from '../src/shared/contracts/boss_combat_d12_5.js';
import {ORDINARY_PROFILES} from '../src/shared/content/ordinary_enemies.js';
import {ARACHNID_TREANT_PROFILE} from '../src/shared/content/bosses_d12_5.js';
import {worldBossStats} from '../src/shared/content/world_combat_v1.js';
import {BRIMSTONE_ID,BRIMSTONE_PROFILE,BRIMSTONE_VOLCANIC_LARGE_RUIN_V4,brimstoneVolcanicRuinFloorV4,chooseBrimstoneRuinAnchorV4,brimstoneRuinArenaProofV4} from '../src/shared/content/brimstone_colossus_v1.js';
import {brimstoneEruptionEnvelope} from '../src/client/brimstone_attack_effects_v2.js';
import {multiroomRecipe} from '../src/shared/generation/multiroom_v1.js';

const sha256=async bytes=>[...new Uint8Array(await webcrypto.subtle.digest('SHA-256',new Uint8Array(bytes)))];
const flags={plannedWorldReview:'true',waterReview:'true',shorelineReview:'true',
  sitePopulation:'true',multiroom:'true',ferryReview:'true',settlementLife:'true',
  settlementServices:'v2',worldCombat:'v1',townReview:'true',caveReview:'true',
  cavePopulation:'true',fortReview:'true',fortVersion:'v2',ruinReview:'true',
  ruinVersion:'v2',cryptReview:'true',cryptVersion:'v2',wildernessV2:'true',wildernessV3:'true'};
const environment={document:{body:{dataset:flags}},async fetch(url){
  try{const data=await readFile(fileURLToPath(url),'utf8');return {ok:true,text:async()=>data};}
  catch {return {ok:false,text:async()=>''};}
}};
const reviewPromise=loadPlannedReviewV1(environment,'alpha',sha256);

test('Only committed Large Volcanic Ruin final floor is Brimstone-eligible',async()=>{
 const review=await reviewPromise;
 const reservation=review.ruinReservations.find(r=>r.socket.provenance.reservationId===BRIMSTONE_VOLCANIC_LARGE_RUIN_V4);
 assert.ok(reservation,'Actual committed Volcanic Ruin is admitted in world');
 assert.equal(reservation.socket.region.biome,'volcanic');
 assert.equal(reservation.parcel.tier,'large');
 const candidate={familyId:'site-family:ruin',sizeTier:'large',floorCount:3,socket:reservation.socket};
 const state={d9World:{plannedWorld:review.binding}};
 assert.equal(brimstoneVolcanicRuinFloorV4(candidate,2,state),true);
 assert.equal(brimstoneVolcanicRuinFloorV4(candidate,1,state),false);
 assert.equal(brimstoneVolcanicRuinFloorV4({...candidate,sizeTier:'standard'},2,state),false);
 assert.equal(brimstoneVolcanicRuinFloorV4({...candidate,familyId:'site-family:fort'},2,state),false);
 assert.equal(brimstoneVolcanicRuinFloorV4({...candidate,socket:{...candidate.socket,region:{...candidate.socket.region,biome:'woodland'}}},2,state),false);
 assert.equal(brimstoneVolcanicRuinFloorV4(candidate,2,{d9World:{plannedWorld:{...review.binding,wildernessHash:'wrong'}}}),false);
});

test('Native seeded final floor has legal Brimstone body, full cross fissures and player retreat', {timeout:120000},async()=>{
 const review=await reviewPromise;
 const site=review.ruinReservations.find(r=>r.socket.provenance.reservationId===BRIMSTONE_VOLCANIC_LARGE_RUIN_V4);
 const recipe=multiroomRecipe(site.socket.siteSeed,'ruin','large',2,true);
 assert.ok(recipe.encounter.members.length>=6,'Ordinary support roster retained');
 const arena=chooseBrimstoneRuinAnchorV4(recipe);
 assert.ok(arena,'No collision-safe boss stage in the actual Volcanic Ruin seed');
 assert.ok(arena.shortest>=24&&arena.horizontal>=112&&arena.vertical>=112,'Orthogonal fissure corridors');
 const proof=brimstoneRuinArenaProofV4(recipe.collision,arena.position);
 assert.ok(proof&&proof.shortest===arena.shortest);
 assert.ok(Math.hypot(recipe.entrance.x-arena.position.x,recipe.entrance.y-arena.position.y)>=160,'Room to retreat from arrival');
 const vent={detonatesTick:200,expiresTick:218,presentationUntilTick:260};
 assert.equal(brimstoneEruptionEnvelope(vent,199).height,0,'No early eruption');
 assert.ok(brimstoneEruptionEnvelope(vent,208).height>0,'Fissure erupting rather than blinking');
 console.log('Brimstone native arena',JSON.stringify({site:site.siteId,position:arena.position,arms:arena.arms,roster:recipe.encounter.members.length}));
});

test('Native Ruin admission installs boss, leaves all other floors intact, and passes world boss/ruin validators', {timeout:120000},async()=>{
 const review=await reviewPromise;
 const reservation=review.ruinReservations.find(r=>r.socket.provenance.reservationId===BRIMSTONE_VOLCANIC_LARGE_RUIN_V4);
 const socket=reservation.socket;
 const playerId='ply:'+'1'.repeat(32),entityId='ent:'+'2'.repeat(32),overworldInstanceId='spi:'+'3'.repeat(32);
 const actor={entityId,alive:true,residency:{spaceInstanceId:overworldInstanceId,residencyRevision:1}};
 const state={tick:0,overworldInstanceId,
   campaign:{seed:{seedHex:review.asset.campaignSeedHex}},
   playersById:{[playerId]:{playerId,entityId,progression:{level:'21'}}},
   entitiesById:{[entityId]:actor},groupsById:{},spacesByInstanceId:{},
   content:{definitionsById:Object.fromEntries([...ORDINARY_PROFILES,ARACHNID_TREANT_PROFILE].map(p=>[p.contentDefinitionId,p]))},
   encounterEconomy:{groups:{}},
   bossCombat:initialBossCombatD12_5A(),
   d9World:{plannedWorld:review.binding,positions:{[entityId]:socket.entrance},siteReservationsById:{[socket.siteId]:reservation},
     functionalSitesById:{},runtime:{groups:[],resources:[],revision:0},episodes:{}}
 };
 const binding={packageId:reservation.packageId,packageVersion:socket.provenance.placementVersion,
   contentHash:review.binding.ruinPrototype===undefined?null:undefined};
 // Use the committed package descriptor, not a guessed content fingerprint.
 const {ruinPackageForVersion}=await import('../src/shared/content/planned_ruin_policy_v2.js');
 const pkg=ruinPackageForVersion(socket.provenance.placementVersion);
 binding.contentHash=pkg.contentHash;
 const build=await buildRuinFamilyV1(state,socket,binding,{sha256});
 assert.equal(build.functionalSite.floorCount,3);
 assert.equal(build.bosses.length,1,'Exactly one Brimstone on the final floor');
 const boss=build.bosses[0].boss,last=build.functionalSite.floors.at(-1);
 assert.equal(boss.bossDefinitionId,BRIMSTONE_ID);
 assert.equal(boss.floorId,last.floorId);
 assert.equal(boss.groupId,last.groupId);
 assert.equal(build.actors.filter(a=>a.contentDefinitionId===BRIMSTONE_PROFILE.contentDefinitionId).length,1);
 assert.equal(build.actors.find(a=>a.entityId===boss.entityId).maxHp,worldBossStats(build.episodes.at(-1).snapshot.effectiveLevel).maxHp);
 assert.equal(build.resources.filter(r=>r.kind==='chest'&&r.completion).length,3,'Native gated rewards remain one per floor');
 for(let i=0;i<build.groups.length;i++){
  state.groupsById[build.groups[i].groupId]=structuredClone(build.groups[i]);
  state.encounterEconomy.groups[build.groups[i].groupId]=structuredClone(build.economies[i]);
  state.d9World.episodes[build.groups[i].groupId]=structuredClone(build.episodes[i]);
 }
 for(const a of build.actors)state.entitiesById[a.entityId]=structuredClone(a);
 for(const space of build.spaces)state.spacesByInstanceId[space.spaceInstanceId]=structuredClone(space);
 state.d9World.runtime.resources=structuredClone(build.resources);
 state.d9World.functionalSitesById[socket.siteId]=structuredClone(build.functionalSite);
 installBossRecordsD12_5A(state,build.bosses);
 validateRuinFamily(state.d9World.functionalSitesById[socket.siteId]);
 validateRuinRuntimeV1(state,state.d9World.functionalSitesById[socket.siteId]);
 validateBossCombatD12_5A(state);
 assert.equal(build.functionalSite.floors.slice(0,2).some(f=>f.enemyIds.includes(boss.entityId)),false);
 console.log('Native Volcanic Ruin boss admitted',boss.bossId,'floor',last.index);
});
