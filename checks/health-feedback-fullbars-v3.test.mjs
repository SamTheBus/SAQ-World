// Regression: world enemy HP trails must use the same full-height bar geometry
// as the accepted World creature and elite painters. Run: node --test checks/health-feedback-fullbars-v3.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {actorHealthRatio,createHealthTrailsV3,enemyHealthBarRectV3,drawEnemyHealthEchoV3,drawBossHealthEchoV3} from '../src/client/health_feedback_v3.js';
import {creaturePresentationForRenderV3} from '../src/client/creature_presentation_profiles_v3.js';

const enemy=(family='sprout',affixId=null)=>({alive:true,enemyFamily:family,position:{x:25,y:60},elite:affixId?{affixId}:null});
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);
const context=()=>({rects:[],outlines:[],save(){},restore(){},translate(){},fillRect(...r){this.rects.push(r)},strokeRect(...r){this.outlines.push(r)}});

test('the damage trail holds briefly, catches up at Dungeon speed, and snaps forward on healing',()=>{
  const t=createHealthTrailsV3();
  assert.deepEqual(t.sample('enemy',1,0),{actual:1,trail:1,impact:0});
  const hit=t.sample('enemy',.45,16);close(hit.trail,1);close(hit.actual,.45);
  close(t.sample('enemy',.45,100).trail,1);
  const catching=t.sample('enemy',.45,190);
  assert.ok(catching.trail<1&&catching.trail>.45);
  const heal=t.sample('enemy',.85,206);close(heal.trail,.85);close(heal.actual,.85);
  assert.equal(t.count(),1);t.clear();assert.equal(t.count(),0);
});

test('normal enemy and proof fallback align exactly with native fill',()=>{
  for(const family of ['sprout','golem','rust_nibbler','mimic_shield']){
    const actor=enemy(family),p=creaturePresentationForRenderV3(family)||creaturePresentationForRenderV3('sprout'),r=enemyHealthBarRectV3(actor,100);
    const width=Math.max(18,Math.min(34,p.visualBounds.width*.68));
    close(r.w,width);close(r.x,-width/2);close(r.y,p.labels.healthBarY);
    assert.equal(r.h,p.visualScale<.72?3:4);
  }
  assert.deepEqual(enemyHealthBarRectV3({alive:true}),{x:-18,y:-26,w:36,h:4});
});

test('all nine elite affixes match native frame width, height and vertical offset',()=>{
 const types={
  vitality_weaver:[34,48,p=>p.visualBounds.width*.9],
  swift_commander:[38,52,p=>p.visualBounds.width],
  glacial_warden:[40,54,p=>p.visualBounds.width+4],
  toxic_decay:[38,52,p=>p.visualBounds.width],
  iron_citadel:[38,52,p=>p.visualBounds.width],
  blood_berserker:[40,54,p=>p.visualBounds.width+4],
  nullifier:[38,52,p=>p.visualBounds.width+2],
  web_weaver:[42,56,p=>p.visualBounds.width+6],
  slag_shaper:[42,56,p=>p.visualBounds.width+6]
 };
 for(const family of ['sprout','golem','clockwork_scarab']){
  const p=creaturePresentationForRenderV3(family);
  for(const [affix,[min,max,calc]] of Object.entries(types)){
   const r=enemyHealthBarRectV3(enemy(family,affix),100),width=Math.max(min,Math.min(max,calc(p)));
   close(r.x,-width/2);close(r.w,width);close(r.y,p.labels.healthBarY-3);assert.equal(r.h,6);
  }
 }
});

test('attached/recalling/landing Aegis Mimics match their real interior and cocoons have no fake bar',()=>{
 const a=enemy('mimic_shield');a.aegisMimic={stage:'orbiting',detachedTick:100};
 assert.deepEqual(enemyHealthBarRectV3(a,100),{x:-13,y:-54,w:26,h:3});
 a.aegisMimic.stage='recalling';
 assert.deepEqual(enemyHealthBarRectV3(a,110),{x:-13,y:-54,w:26,h:3});
 a.aegisMimic.stage='landing';
 assert.deepEqual(enemyHealthBarRectV3(a,115),{x:-13,y:-42,w:26,h:3});
 a.aegisMimic.stage='detached';
 assert.notEqual(enemyHealthBarRectV3(a,115).y,-42);
 const cocoon=enemy();cocoon.bossSummon={stage:'cocoon'};
 assert.equal(enemyHealthBarRectV3(cocoon,100),null);
});

test('the highlighted missing HP fills the COMPLETE bar height, never just the lower two pixels',()=>{
 for(const actor of [enemy('sprout'),enemy('golem','glacial_warden'),enemy('mimic_shield')]){
  const c=context(),reading={actual:.35,trail:.85,impact:.8},r=enemyHealthBarRectV3(actor,100);
  const snapshot=JSON.stringify(actor);
  drawEnemyHealthEchoV3(c,actor,reading,100);
  assert.equal(c.rects.length,1);
  const [x,y,w,h]=c.rects[0];close(x,r.x+r.w*.35);close(y,r.y);close(w,r.w*.5);close(h,r.h);
  assert.equal(c.outlines.length,1);
  assert.equal(JSON.stringify(actor),snapshot,'presentation must never modify saved actor');
 }
});

test('no phantom echo for healthy or unsupported actors, boss bars stay full height',()=>{
 const c=context();
 drawEnemyHealthEchoV3(c,enemy(),{actual:1,trail:1,impact:0},100);
 assert.equal(c.rects.length,0);
 const canvas={width:700,height:500},boss={alive:true,boss:{bossDefinitionId:'brimstone_colossus'}};
 drawBossHealthEchoV3(c,canvas,boss,{actual:.2,trail:.8,impact:.7},1000);
 assert.equal(c.rects.length>=2,true);assert.equal(c.rects[0][3],8);
});
