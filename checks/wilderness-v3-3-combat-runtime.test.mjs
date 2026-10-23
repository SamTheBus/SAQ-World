// Native proof: node --test checks/wilderness-v3-3-combat-runtime.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {fortFixture} from './fixtures/planned_forts_v1_harness.js';
import {ordinaryEnemyForProfile} from '../src/shared/content/ordinary_enemies.js';
import {collidesWithTiles} from '../src/shared/rules/world_geometry.js';
import {validateActivityState} from '../src/shared/contracts/activity_state.js';
const options={version:'planned-fort-family-candidate-v2',ruin:true,ruinVersion:'planned-ruin-family-candidate-v2',crypt:true,cryptVersion:'planned-crypt-family-candidate-v2',population:true,multiroom:true,ferry:true,services:true,workshop:true,combat:true,wilderness:true,heroLevel:1,proofCase:'A',structuralBorrowReads:true};
test('native level-11 cave: one mob HP hit at a time and durable grace on reopen',{timeout:120000},async()=>{
 const h=await fortFixture(options),pid=h.ids[0];
 const r=[...h.caveReservations,...h.fortReservations,...h.ruinReservations].find(r=>r.socket.minimumLevel>=11&&r.parcel.tier==='small'&&r.parcel.packageId.includes('cave'));assert.ok(r);
 const site=await h.enter(r,pid);await h.prepareGround();const heroId=h.engine.withAuthorityState(s=>s.playersById[pid].entityId);
 let placed=false;h.engine.withAuthorityState(s=>{
  const hero=s.entitiesById[heroId],collision=s.spacesByInstanceId[hero.residency.spaceInstanceId].collision;
  for(const id of site.floors[0].enemyIds){const e=s.entitiesById[id];if(!e.alive||!ordinaryEnemyForProfile(e.contentDefinitionId))continue;
   for(const d of [42,36,46,32])for(const angle of [0,Math.PI/2,Math.PI,3*Math.PI/2]){
    const p={x:e.position.x+d*Math.cos(angle),y:e.position.y+d*Math.sin(angle)};
    if(!collidesWithTiles(collision,p.x,p.y,hero.hullRadius)){hero.position=p;placed=true;return;}
   }
  }
 });assert.ok(placed);
 const seen=new Set(),hits=[];
 for(let tick=0;tick<200;tick++){h.engine.advanceOneTick();const s=h.engine.readState();
  for(const event of h.engine.events()){if(seen.has(event.eventId))continue;seen.add(event.eventId);
   if(event.kind==='combat.damageApplied'&&event.subject.entityId===heroId&&ordinaryEnemyForProfile(s.entitiesById[event.source.entityId]?.contentDefinitionId))hits.push(event);
  }
  if(hits.length)break;
 }
 assert.equal(hits.length,1,'no same-tick mob damage stacking');
 const s=h.engine.readState(),attacker=s.entitiesById[hits[0].source.entityId];
 assert.ok(BigInt(hits[0].payload.damage)<=BigInt(attacker.attackDamage));
 assert.ok(s.entitiesById[heroId].alive);
 assert.equal(s.wildernessCrowdGraceByEntityId?.[heroId],s.tick+15);
 validateActivityState(s);
 const reopened=await h.save();
 assert.equal(reopened.wildernessCrowdGraceByEntityId?.[heroId],s.tick+15);
 assert.equal(reopened.entitiesById[heroId].hp,s.entitiesById[heroId].hp);
});
