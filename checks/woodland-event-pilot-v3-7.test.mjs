import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {WOODLAND_EVENT_PILOT_V3_7,woodlandPilotWorldPosition,createWoodlandPilotEventAnchors,isWoodlandPilotEventAnchor,isWoodlandPilotTreasureAnchor} from '../src/shared/generation/woodland_event_pilot_v3_7.js';
import {WILDERNESS_VERSION,WILDERNESS_HASH} from '../src/shared/content/wilderness_v2.js';
import {WORLD_COMBAT_VERSION,WORLD_COMBAT_HASH} from '../src/shared/content/world_combat_v1.js';
import {createPlannedTerrain} from '../src/shared/generation/planned_world_foundation_v1.js';

const wilderness=JSON.parse(await readFile('assets/wilderness-v2/alpha.json','utf8'));
const original=JSON.stringify(wilderness);
const plan=JSON.parse(await readFile('assets/planned-world-water-v3/alpha.json','utf8'));
const terrain=createPlannedTerrain(plan);
const binding={wildernessVersion:WILDERNESS_VERSION,wildernessHash:WILDERNESS_HASH,combatVersion:WORLD_COMBAT_VERSION,combatHash:WORLD_COMBAT_HASH};
const asset={wildernessExtension:wilderness};
const sha256=async data=>[...new Uint8Array(await webcrypto.subtle.digest('SHA-256',new Uint8Array(data)))];
const byId=new Map(wilderness.eventCapacities.map(x=>[x.eventSlotId,x]));
const field=(slot,blocked=null)=>(x,y)=>{
  const base=terrain.base(x,y);
  return {collision:blocked&&x===blocked.x&&y===blocked.y?'2':base.walkable?'1':'2',
    landmassId:base.landmassId,kind:base.kind};
};

test('V3.7 uses exactly three existing Woodland capacities near the starter mainland',()=>{
  assert.equal(wilderness.eventCapacities.length,176);
  assert.deepEqual(WOODLAND_EVENT_PILOT_V3_7.map(x=>x.ordinal),[37,38,39]);
  assert.equal(new Set(WOODLAND_EVENT_PILOT_V3_7.map(x=>x.slotId)).size,3);
  for(const e of WOODLAND_EVENT_PILOT_V3_7){
    const slot=byId.get(e.slotId);
    assert.ok(slot,'Existing reserved slot');
    assert.equal(slot.biome,'woodland');
    assert.equal(slot.landmassId, 'landmass:primary-mainland:d14l1a:01:ccdbc2ca');
    assert.deepEqual(slot.position,{x:e.x,y:e.y});
    assert.ok(e.x<1800&&e.y>6200&&e.y<7000,'Starting mainland area');
    const w=woodlandPilotWorldPosition(e);
    assert.equal(Number(w.chunkX),1024+Math.floor(e.x/32));
    assert.equal(Number(w.chunkY),1024+Math.floor(e.y/26));
  }
});

test('V3.7 anchors are stable, real, nonoverlapping native groups with 6 walkable enemies',async()=>{
  for(const e of WOODLAND_EVENT_PILOT_V3_7){
    const slot=byId.get(e.slotId);
    const args={asset,binding,seed:plan.campaignSeedHex,sha256,tile:field(slot),cx:Math.floor(e.x/32),cy:Math.floor(e.y/26)};
    const one=await createWoodlandPilotEventAnchors(args);
    const again=await createWoodlandPilotEventAnchors(args);
    assert.deepEqual(one,again,'Generated identities and placements deterministic');
    assert.equal(one.length,1,'Actually possible to spawn in authored clearing: '+e.slotId);
    const anchor=one[0];
    assert.ok(isWoodlandPilotEventAnchor(anchor));
    assert.equal(isWoodlandPilotTreasureAnchor(anchor),e.kind==='treasure_cache');
    assert.equal(anchor.ordinal,e.ordinal);
    assert.equal(anchor.combatVersion,WORLD_COMBAT_VERSION);
    assert.equal(anchor.members.length,6);
    const cellSet=new Set(slot.cells.map(c=>c.x+','+c.y));
    for(const m of anchor.members){
      const cellX=Math.floor(e.x/32)*32+Math.floor(m.position.x/32);
      const cellY=Math.floor(e.y/26)*26+Math.floor(m.position.y/32);
      assert.ok(cellSet.has(cellX+','+cellY),'Actor originates on reserved clearing');
    }
    const p=anchor.members.map(x=>x.position);
    for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++)
      assert.ok(Math.hypot(p[i].x-p[j].x,p[i].y-p[j].y)>=40,'Actor separation');
    assert.deepEqual(await createWoodlandPilotEventAnchors({...args,binding:{...binding,wildernessHash:'not-committed'}}),[]);
    assert.equal((await createWoodlandPilotEventAnchors({...args,tile:field(slot,{x:e.x-2,y:e.y-1})})).length,0,'Unsafe anchors never appear');
  }
  assert.equal(JSON.stringify(wilderness),original,'No mutation of immutable site/trail/event capacities');
});
