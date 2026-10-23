// Run: node --test checks/wilderness-v3-6-aegis-fort.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {AEGIS_DEEP_UPLAND_FORT_SITE_V3_6,aegisFortFloor,AEGIS_PHYSICAL_PROFILE} from '../src/shared/content/aegis_goliath_v1.js';
import {validateAegisFortBinding} from '../src/shared/contracts/aegis_goliath_v1.js';
import {ALPHA_POPULATION_RESERVATIONS} from '../src/shared/content/alpha_population_reservations_v1.js';
import {WORLD_COMBAT_VERSION,WORLD_COMBAT_HASH} from '../src/shared/content/world_combat_v1.js';
import {WILDERNESS_VERSION,WILDERNESS_HASH} from '../src/shared/content/wilderness_v2.js';
import {multiroomRecipe} from '../src/shared/generation/multiroom_v1.js';
import {collidesWithTiles} from '../src/shared/rules/world_geometry.js';
const reservation=ALPHA_POPULATION_RESERVATIONS.find(r=>r.socket.provenance.reservationId===AEGIS_DEEP_UPLAND_FORT_SITE_V3_6);
const world={d9World:{plannedWorld:{combatVersion:WORLD_COMBAT_VERSION,combatHash:WORLD_COMBAT_HASH,wildernessVersion:WILDERNESS_VERSION,wildernessHash:WILDERNESS_HASH}}};
const site=()=>({siteId:reservation.socket.siteId,socket:reservation.socket,familyId:'site-family:fort',sizeTier:'deep',floorCount:4});
test('exact Upland Deep Fort activates Aegis; other worlds and old Standard Fort stay unchanged',()=>{
 assert.equal(AEGIS_DEEP_UPLAND_FORT_SITE_V3_6,'repeatable-slot:fort:upland:deep:01');
 assert.ok(reservation);assert.equal(reservation.socket.region.biome,'upland');
 assert.equal(reservation.socket.minimumLevel,21);
 assert.equal(aegisFortFloor(site(),3,world),true);
 assert.equal(aegisFortFloor(site(),2,world),false);
 assert.equal(aegisFortFloor({...site(),sizeTier:'standard',floorCount:2},1),true);
 assert.equal(aegisFortFloor(site(),3,{d9World:{plannedWorld:{combatVersion:WORLD_COMBAT_VERSION,combatHash:WORLD_COMBAT_HASH}}}),false);
 assert.equal(aegisFortFloor({...site(),socket:{...reservation.socket,region:{...reservation.socket.region,biome:'desert'}}},3,world),false);
});
test('committed deep final-floor seed has 4+ members and safe 34px boss anchor',()=>{
 const floor=multiroomRecipe(reservation.socket.siteSeed,'fort','deep',3,true),leader=floor.encounter.members[0];
 assert.ok(floor.encounter.members.length>=4);
 assert.ok(floor.graph.rooms.some(r=>r.roomId===leader.roomId));
 assert.equal(collidesWithTiles(floor.collision,leader.position.x,leader.position.y,AEGIS_PHYSICAL_PROFILE.hullRadius),false);
 const s=site(),f={...floor,index:3,floorId:'floor:fixture',groupId:'group:fixture',spaceInstanceId:'space:fixture'};
 const a={entityId:'ent:fixture',residency:{spaceInstanceId:f.spaceInstanceId},contentDefinitionId:AEGIS_PHYSICAL_PROFILE.contentDefinitionId,hullRadius:AEGIS_PHYSICAL_PROFILE.hullRadius};
 const b={entityId:a.entityId,siteId:s.siteId,floorId:f.floorId,groupId:f.groupId,roomId:leader.roomId,homePosition:leader.position};
 assert.doesNotThrow(()=>validateAegisFortBinding({...world,eliteCombat:{elitesByEntityId:{}}},s,f,0,a,b));
});
test('worker mirrors boss policy, native Fort builder uses socket, old campaign namespace preserved',()=>{
 const get=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
 assert.equal(get('src/shared/content/aegis_goliath_v1.js'),get('worker/wilderness-v3-migrationfix-20261022/src/shared/content/aegis_goliath_v1.js'));
 for(const path of ['src/shared/content/fort_family_runtime_v1.js','worker/wilderness-v3-migrationfix-20261022/src/shared/content/fort_family_runtime_v1.js'])assert.ok(get(path).includes('sizeTier:tier,floorCount:recipes.length,socket},i,state)'));
 const html=get('index.html');
 assert.ok(html.includes('data-world-release="wilderness-v3-starter-20261022"'));
 assert.ok(html.includes('save-worker.wilderness-v3-migrationfix-20261022-aegis-v3-6.js'));
});
