// Native source-of-truth combat proof at a genuinely higher-level wilderness site.
// Run: node --test checks/wilderness-v3-2-fairness-runtime.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {fortFixture} from './fixtures/planned_forts_v1_harness.js';
import {ordinaryEnemyForProfile} from '../src/shared/content/ordinary_enemies.js';
import {collidesWithTiles} from '../src/shared/rules/world_geometry.js';
import {validateActivityState} from '../src/shared/contracts/activity_state.js';

const options={version:'planned-fort-family-candidate-v2',ruin:true,ruinVersion:'planned-ruin-family-candidate-v2',crypt:true,cryptVersion:'planned-crypt-family-candidate-v2',population:true,multiroom:true,ferry:true,services:true,workshop:true,combat:true,wilderness:true,heroLevel:1,proofCase:'A',structuralBorrowReads:true};

test('level-11 wilderness enemies deal only their attack stat to a level-1 hero, and save/reopen retains HP',{timeout:120000},async()=>{
 const h=await fortFixture(options),pid=h.ids[0];
 const r=[...h.caveReservations,...h.fortReservations,...h.ruinReservations].find(r=>r.socket.minimumLevel>=11&&r.parcel.tier==='small'&&r.parcel.packageId.includes('cave'));
 assert.ok(r,'a natural level-11+ cave exists');
 const site=await h.enter(r,pid),floor=site.floors[0];
 await h.prepareGround();
 const playerId=h.engine.withAuthorityState(s=>s.playersById[pid].entityId);
 let chosen=null;
 // Positioning is fixture-only, not a browser teleport. All attacks after
 // this setup use ordinary AI, spatial queries, collision and damage delivery.
 h.engine.withAuthorityState(s=>{
  const hero=s.entitiesById[playerId],collision=s.spacesByInstanceId[hero.residency.spaceInstanceId].collision;
  for(const id of floor.enemyIds){const enemy=s.entitiesById[id];
   if(!enemy.alive||!ordinaryEnemyForProfile(enemy.contentDefinitionId))continue;
   for(const distance of [42,36,46,32])for(const angle of [0,Math.PI/2,Math.PI,3*Math.PI/2]){
    const position={x:enemy.position.x+distance*Math.cos(angle),y:enemy.position.y+distance*Math.sin(angle)};
    if(!collidesWithTiles(collision,position.x,position.y,hero.hullRadius)){
     chosen={sourceId:id,position,heroBefore:hero.hp,enemyAttack:enemy.attackDamage};hero.position=position;return;
    }
   }
  }
 });
 assert.ok(chosen,'can place a hero in reachable melee range without clipping into a wall');
 const seen=new Set(),hits=[];
 for(let i=0;i<200;i++){
  h.engine.advanceOneTick();
  for(const event of h.engine.events()){
   if(seen.has(event.eventId))continue;seen.add(event.eventId);
   if(event.kind==='combat.damageApplied'&&event.subject.entityId===playerId)hits.push(event);
  }
  if(hits.length)break;
 }
 assert.ok(hits.length,'real hostility damaged the hero');
 const state=h.engine.readState();
 const regularHits=hits.filter(e=>ordinaryEnemyForProfile(state.entitiesById[e.source.entityId]?.contentDefinitionId));
 assert.ok(regularHits.length,'an ordinary, higher-level mob actually attacked');
 for(const event of regularHits){
  const enemy=state.entitiesById[event.source.entityId];
  assert.ok(BigInt(event.payload.damage)<=BigInt(enemy.attackDamage),'No level-gap damage bonus may exceed the basic hit before player defense');
 }
 assert.ok(BigInt(state.entitiesById[playerId].hp)<BigInt(chosen.heroBefore));
 assert.equal(state.playersById[pid].progression.level,1);
 validateActivityState(state);
 const reopened=await h.save();
 assert.equal(reopened.entitiesById[playerId].hp,state.entitiesById[playerId].hp);
 assert.equal(reopened.entitiesById[chosen.sourceId].attackDamage,state.entitiesById[chosen.sourceId].attackDamage);
 console.log('PASS Level 1 hero, minimum level 11 cave, '+hits.length+' real hostile attacks, attack cap obeyed and exact HP persisted');
});
