// Run: node --test checks/wilderness-v3-6-ecology-atlas.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildWildernessEcologyAtlasV3_6,WILDERNESS_ATLAS_CONCEPTS,wildernessCreatureNameV3_6} from '../src/dev/wilderness_ecology_atlas_v3_6.js';
import {WILDERNESS_ECOLOGY_V3_MATRIX,WILDERNESS_V3_STARTER_POOLS} from '../src/shared/content/wilderness_ecology_v3.js';
const model=buildWildernessEcologyAtlasV3_6();
test('published V3.5 ecology covers 74 of 108 sites with 34 gaps',()=>{
 assert.deepEqual(model.totals,{sites:108,covered:74,gaps:34,starters:3});
 assert.deepEqual(model.priorities,['desert','grassland','tropical']);
 assert.equal(new Set(model.sites.map(x=>x.id)).size,108);
 assert.equal(model.prototypesLive,false);
});
test('uncovered sites are only in the three content-gap biomes',()=>{
 const by=Object.fromEntries(model.biomes.map(b=>[b.id,[b.covered,b.gaps]]));
 assert.deepEqual(by.desert,[0,15]);assert.deepEqual(by.grassland,[3,10]);assert.deepEqual(by.tropical,[2,9]);
 for(const id of ['woodland','wetland','upland','volcanic','frostland'])assert.equal(by[id][1],0);
 for(const b of model.biomes)assert.equal(Object.values(b.roles).reduce((n,r)=>n+r.total,0),b.total);
});
test('only real families, no fake desert mobs or accidentally changed starters',()=>{
 for(const s of model.sites){
  if(s.starter){assert.equal(s.status,'starter');assert.deepEqual(s.melee,WILDERNESS_V3_STARTER_POOLS[s.id].melee);}
  else{
   const valid=WILDERNESS_ECOLOGY_V3_MATRIX[s.biome][s.family];
   for(const family of s.all)assert.ok(valid.includes(family),s.id+' contains unrelated '+family);
   if(s.status==='gap')assert.equal(s.all.length,0);
  }
 }
 assert.equal(model.biomes.find(b=>b.id==='desert').surfaceFamilies.length,0);
 assert.equal(wildernessCreatureNameV3_6('rust_nibbler'),'Rust Nibbler');
});
test('Desert concepts are strictly review-only and atlas is independent of saves',()=>{
 assert.equal(WILDERNESS_ATLAS_CONCEPTS.desert.length,3);
 const html=readFileSync(new URL('../wilderness-ecology-atlas.html',import.meta.url),'utf8');
 assert.match(html,/src\/dev\/wilderness_ecology_atlas_v3_6\.js/);
 for(const name of ['Dune Strider','Sunbound Warden','Tomb Scarab'])assert.ok(html.includes(name));
 assert.ok(!html.includes('indexedDB')&&!html.includes('localStorage'));
});
