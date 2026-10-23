import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {webcrypto} from 'node:crypto';

import {RECOVERED_BOSS_IDS,RECOVERED_BOSSES,recoveredBossForReservation} from '../src/shared/content/recovered_boss_catalog_v1.js';
import {recoveredBossRecord,projectRecoveredBossV1} from '../src/shared/contracts/recovered_boss_v1.js';
import {loadPlannedReviewV1} from '../src/dev/planned_world_review_v1.js';
import {buildRuinFamilyV1} from '../src/shared/content/ruin_family_runtime_v1.js';
import {buildFortFamilyV1} from '../src/shared/content/fort_family_runtime_v1.js';
import {buildCryptFamilyV2} from '../src/shared/content/crypt_family_runtime_v2.js';
import {validateRuinFamily,validateRuinRuntimeV1} from '../src/shared/contracts/planned_ruin_v1.js';
import {validateFortFamily,validateFortRuntimeV1} from '../src/shared/contracts/planned_fort_v1.js';
import {initialBossCombatD12_5A,installBossRecordsD12_5A,validateBossCombatD12_5A,projectBossActorD12_5A,projectBossSummonD12_5A} from '../src/shared/contracts/boss_combat_d12_5.js';
import {ORDINARY_PROFILES} from '../src/shared/content/ordinary_enemies.js';
import {ARACHNID_TREANT_PROFILE} from '../src/shared/content/bosses_d12_5.js';
import {ruinPackageForVersion} from '../src/shared/content/planned_ruin_policy_v2.js';
import {fortPackageForVersion} from '../src/shared/content/planned_fort_policy_v2.js';
import {CRYPT_CONFIGURATION_V2,CRYPT_CONFIGURATION_V3} from '../src/shared/content/crypt_family_runtime_v2.js';

const sha256=async bytes=>[...new Uint8Array(await webcrypto.subtle.digest('SHA-256',new Uint8Array(bytes)))];
const flags={plannedWorldReview:'true',waterReview:'true',shorelineReview:'true',sitePopulation:'true',multiroom:'true',ferryReview:'true',settlementLife:'true',settlementServices:'v2',worldCombat:'v1',townReview:'true',caveReview:'true',cavePopulation:'true',fortReview:'true',fortVersion:'v2',ruinReview:'true',ruinVersion:'v2',cryptReview:'true',cryptVersion:'v2',wildernessV2:'true',wildernessV3:'true'};
const environment={document:{body:{dataset:flags}},async fetch(url){try {const data=await readFile(fileURLToPath(url),'utf8');return {ok:true,text:async()=>data};}catch{return {ok:false,text:async()=>''};}}};
const reviewPromise=loadPlannedReviewV1(environment,'alpha',sha256);
const families={ruin:{reviewKey:'ruinReservations',build:buildRuinFamilyV1,pkg:ruinPackageForVersion},
  fort:{reviewKey:'fortReservations',build:buildFortFamilyV1,pkg:fortPackageForVersion},
  crypt:{reviewKey:'cryptReservations',build:buildCryptFamilyV2,pkg:v=>v===CRYPT_CONFIGURATION_V3.version?CRYPT_CONFIGURATION_V3.package:CRYPT_CONFIGURATION_V2.package}};
test('Unique, deterministic post-Dungeon boss roster and sites',()=>{
 assert.equal(RECOVERED_BOSS_IDS.length,8);
 assert.equal(new Set(RECOVERED_BOSS_IDS.map(id=>RECOVERED_BOSSES[id].site)).size,8);
 for(const id of RECOVERED_BOSS_IDS){
  const row=RECOVERED_BOSSES[id];
  assert.equal(recoveredBossForReservation(row.site,row.family,2,3)?.id,id);
  assert.equal(recoveredBossForReservation(row.site,row.family,1,3),null);
  assert.equal(recoveredBossForReservation(row.site,'cave',2,3),null);
  assert.equal(recoveredBossForReservation(row.site,row.family,2,3,false),null);
 }
});

test('Every restored boss is in its seeded real site and passes save and floor contracts',{timeout:180000},async()=>{
 const review=await reviewPromise;
 for(const id of RECOVERED_BOSS_IDS){
  const row=RECOVERED_BOSSES[id],family=families[row.family];
  const reservation=review[family.reviewKey].find(r=>r.socket.provenance.reservationId===row.site);
  assert.ok(reservation,'Committed native reservation missing for '+id+' '+row.site);
  assert.equal(reservation.socket.region.biome,row.biome,id+' biome placement drift');
  const socket=reservation.socket;
  const playerId='ply:'+'1'.repeat(32),entityId='ent:'+'2'.repeat(32),overworldInstanceId='spi:'+'3'.repeat(32);
  const origin={entityId,alive:true,residency:{spaceInstanceId:overworldInstanceId,residencyRevision:1}};
  const state={tick:0,overworldInstanceId,campaign:{seed:{seedHex:review.asset.campaignSeedHex}},
   playersById:{[playerId]:{playerId,entityId,progression:{level:'21'}}},
   entitiesById:{[entityId]:origin},groupsById:{},spacesByInstanceId:{},
   content:{definitionsById:Object.fromEntries([...ORDINARY_PROFILES,ARACHNID_TREANT_PROFILE].map(p=>[p.contentDefinitionId,p]))},
   encounterEconomy:{groups:{}},bossCombat:initialBossCombatD12_5A(),
   d9World:{plannedWorld:review.binding,positions:{[entityId]:socket.entrance},siteReservationsById:{[socket.siteId]:reservation},
   functionalSitesById:{},runtime:{groups:[],resources:[],revision:0},episodes:{}}};
  const pkg=family.pkg(socket.provenance.placementVersion);
  assert.ok(pkg,id+' missing committed family package');
  const built=await family.build(state,socket,{packageId:reservation.packageId,packageVersion:socket.provenance.placementVersion,contentHash:pkg.contentHash},{sha256});
  assert.equal(built.bosses.length,1,id+' must generate one unique boss');
  const boss=built.bosses[0].boss,last=built.functionalSite.floors.at(-1);
  assert.equal(boss.bossDefinitionId,id);
  assert.equal(boss.floorId,last.floorId);
  assert.equal(boss.groupId,last.groupId);
  assert.ok(recoveredBossRecord(boss));
  assert.equal(built.resources.length,built.functionalSite.floors.length,'Every floor keeps its resource');
  for(let i=0;i<built.groups.length;i++){
   state.groupsById[built.groups[i].groupId]=structuredClone(built.groups[i]);
   state.encounterEconomy.groups[built.groups[i].groupId]=structuredClone(built.economies[i]);
   state.d9World.episodes[built.groups[i].groupId]=structuredClone(built.episodes[i]);
  }
  for(const actor of built.actors)state.entitiesById[actor.entityId]=structuredClone(actor);
  for(const space of built.spaces)state.spacesByInstanceId[space.spaceInstanceId]=structuredClone(space);
  state.d9World.runtime.resources=structuredClone(built.resources);
  state.d9World.functionalSitesById[socket.siteId]=structuredClone(built.functionalSite);
  installBossRecordsD12_5A(state,built.bosses);
  if(row.family==='fort'){
   validateFortFamily(state.d9World.functionalSitesById[socket.siteId]);
   validateFortRuntimeV1(state,state.d9World.functionalSitesById[socket.siteId]);
  }else{
   // Crypts share the Ruin runtime validator with their generated floor model.
   if(row.family==='ruin')validateRuinFamily(state.d9World.functionalSitesById[socket.siteId]);
   if(row.family==='ruin')validateRuinRuntimeV1(state,state.d9World.functionalSitesById[socket.siteId]);
  }
  validateBossCombatD12_5A(state);
  const projected=projectBossActorD12_5A(state,boss.entityId);
  assert.equal(projected.label,row.label);
  assert.equal(projected.phase,1);
  for(const summonId of boss.summonEntityIds){
   const summon=projectBossSummonD12_5A(state,summonId);
   assert.equal(summon.stage,'dormant',id+' summon should not aggro before phase');
   assert.ok(summon.kind,'Recovered minion identity must be projected');
  }
  console.log('RECOVERED_BOSS_PROOF',JSON.stringify({id,site:row.site,tier:reservation.parcel.tier,floors:built.functionalSite.floorCount,bossId:boss.bossId,addCount:boss.summonEntityIds.length}));
 }
});
