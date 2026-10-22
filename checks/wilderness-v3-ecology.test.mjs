// Self-contained deterministic ecology regression for the published game source.
// Run: node --test checks/wilderness-v3-ecology.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {ALPHA_POPULATION_SELECTIONS} from '../src/shared/content/alpha_site_population_v1.js';
import {WILDERNESS_SITE_SELECTIONS} from '../src/shared/content/wilderness_v2.js';
import {auditWildernessEcologyV3,starterWildernessPoolV3,WILDERNESS_V3_STARTER_POOLS} from '../src/shared/content/wilderness_ecology_v3.js';

const all=[...ALPHA_POPULATION_SELECTIONS,...WILDERNESS_SITE_SELECTIONS];
test('all 108 sites have stable ecology decisions and flagged coverage gaps',()=>{
 const a=auditWildernessEcologyV3(all),b=auditWildernessEcologyV3(all);
 assert.deepEqual(a,b);assert.equal(a.siteCount,108);assert.equal(new Set(a.entries.map(x=>x.siteId)).size,108);
 assert.equal(a.bossCandidates.length,2);assert.equal(a.byBiome.desert.sites,15);
 assert.ok(a.byBiome.desert.coverageGaps>0);
 assert.equal(a.entries.filter(x=>x.activation==='live-starter-roster').length,3);
});
test('only three exact starter reservations activate safe native family pools',()=>{
 for(const selection of all){
  const actual=starterWildernessPoolV3({socket:{region:{biome:selection.biome},provenance:{reservationId:selection.id}},familyId:selection.familyId,sizeTier:selection.tier});
  if(WILDERNESS_V3_STARTER_POOLS[selection.id]){
   assert.ok(actual);assert.deepEqual(actual.ranged,[]);assert.ok(actual.melee.length>=2);
  }else assert.equal(actual,null);
 }
 assert.throws(()=>starterWildernessPoolV3({socket:{region:{biome:'volcanic'},provenance:{reservationId:'repeatable-slot:cave:woodland:small:089'}},familyId:'site-family:cave',sizeTier:'small'}),/geometry drift/);
});
