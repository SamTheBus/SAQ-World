// Run: node --test checks/wilderness-v3-5-biome-ecology.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ALPHA_POPULATION_SELECTIONS} from '../src/shared/content/alpha_site_population_v1.js';
import {WILDERNESS_SITE_SELECTIONS} from '../src/shared/content/wilderness_v2.js';
import {WILDERNESS_ECOLOGY_V3_MATRIX,WILDERNESS_V3_STARTER_POOLS} from '../src/shared/content/wilderness_ecology_v3.js';
import {WILDERNESS_ECOLOGY_V3_5_COVERAGE,wildernessSiteEcologyV3_5,wildernessSurfaceEcologyV3_5,isWildernessEcologyRosterV3_5} from '../src/shared/content/wilderness_ecology_runtime_v3_5.js';
const selections=[...ALPHA_POPULATION_SELECTIONS,...WILDERNESS_SITE_SELECTIONS];
const site=row=>({familyId:row.familyId,sizeTier:row.tier,socket:{region:{biome:row.biome},provenance:{reservationId:row.id}},floors:[{},{},{}]});
const find=(b,f)=>selections.find(x=>x.biome===b&&x.familyId==='site-family:'+f&&!WILDERNESS_V3_STARTER_POOLS[x.id]);
test('108 exact site commitments; 74 covered and 34 honest content gaps',()=>{
 assert.deepEqual(WILDERNESS_ECOLOGY_V3_5_COVERAGE,{total:108,covered:74,gaps:34});
 assert.equal(new Set(selections.map(r=>r.id)).size,108);
 for(const row of selections){const c=wildernessSiteEcologyV3_5(site(row),0),available=WILDERNESS_ECOLOGY_V3_MATRIX[row.biome][row.familyId.split(':').at(-1)];
  if(WILDERNESS_V3_STARTER_POOLS[row.id])assert.equal(c,null,'Existing starter roster must stay fixed');
  else{assert.ok(c);assert.ok(isWildernessEcologyRosterV3_5(c.key));assert.equal(c.coverage,available.length?'native-family':'needs-new-biome-family');}
 }
});
test('biome-appropriate overworld V1 ranged and V2 melee; Desert stays unfilled',()=>{
 const wet=wildernessSurfaceEcologyV3_5('wetland');
 assert.deepEqual(wet.v1.ranged,['toxic_fly']);assert.deepEqual(wet.v1.melee,['marsh_ghost']);
 assert.ok(wildernessSurfaceEcologyV3_5('woodland').v1.melee.includes('sprout'));
 assert.ok(wildernessSurfaceEcologyV3_5('upland').v2.families.includes('gilded_scuttler'));
 assert.ok(wildernessSurfaceEcologyV3_5('volcanic').v1.melee.includes('hell_bat'));
 const desert=wildernessSurfaceEcologyV3_5('desert');
 assert.equal(desert.coverage,'needs-new-biome-family');
 assert.deepEqual(desert.v1.melee,[]);assert.deepEqual(desert.v1.ranged,[]);assert.deepEqual(desert.v2.families,[]);
});
test('site role themed enemies and rare anomaly eligibility',()=>{
 assert.ok(wildernessSiteEcologyV3_5(site(find('woodland','crypt')),0).v1.melee.includes('cursed_blade'));
 assert.ok(wildernessSiteEcologyV3_5(site(find('wetland','cave')),0).v1.melee.includes('swamp_basilisk'));
 assert.ok(wildernessSiteEcologyV3_5(site(find('upland','fort')),0).v2.families.includes('mimic_shield'));
 assert.ok(wildernessSiteEcologyV3_5(site(find('volcanic','ruin')),0).v1.ranged.includes('magma_elemental'));
 let rare=0;
 for(const row of selections){const c=site(row),first=wildernessSiteEcologyV3_5(c,0);assert.deepEqual(first,wildernessSiteEcologyV3_5(c,0));if(first)assert.equal(first.v2.rareAnomaly,null);
  for(const floor of [1,2]){const x=wildernessSiteEcologyV3_5(c,floor);if(x?.v2.rareAnomaly){rare++;assert.ok(['ruin','crypt'].includes(x.role));assert.equal(x.coverage,'native-family');}}
 }
 assert.ok(rare<15,'Rare anomalies must remain rare');
});
test('client and save Worker use exactly matching deterministic V1/V2 roster sources',()=>{
 const load=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
 for(const file of ['ordinary_roster_v1.js','ordinary_roster_v2.js'])assert.equal(load('src/shared/contracts/'+file),load('worker/wilderness-v3-migrationfix-20261022/src/shared/contracts/'+file));
 assert.equal(load('src/shared/content/wilderness_ecology_runtime_v3_5.js'),load('worker/wilderness-v3-migrationfix-20261022/src/shared/content/wilderness_ecology_runtime_v3_5.js'));
});
