import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {webcrypto} from 'node:crypto';
import {loadPlannedReviewV1} from '../src/dev/planned_world_review_v1.js';
import {WOODLAND_EVENT_PILOT_V3_7,woodlandPilotWorldPosition} from '../src/shared/generation/woodland_event_pilot_v3_7.js';
import {woodlandEventCluesV3_8,woodlandEventDistanceV3_8,WOODLAND_RUMOR_RADIUS_TILES,WOODLAND_SIGHT_RADIUS_TILES} from '../src/shared/content/wilderness_event_discovery_v3_8.js';
import {normalizeWorldPosition} from '../src/shared/contracts/world_address.js';

const offset=(pos,x=0,y=0)=>normalizeWorldPosition({...pos,localX:pos.localX+x*32,localY:pos.localY+y*32});
test('nearby discovery is directional, gradual, and never reveals a distant destination',()=>{
 const camp=WOODLAND_EVENT_PILOT_V3_7[0],point=woodlandPilotWorldPosition(camp);
 assert.equal(woodlandEventCluesV3_8(offset(point,-WOODLAND_RUMOR_RADIUS_TILES-1)).find(c=>c.slotId===camp.slotId),undefined);
 const rumors=woodlandEventCluesV3_8(offset(point,-34));
 const clue=rumors.find(c=>c.slotId===camp.slotId);
 assert.equal(clue.stage,'rumor');
 assert.equal(clue.direction,'east');
 assert.ok(!Object.hasOwn(clue,'position'),'No remote location exposed in distant clue');
 const nearby=woodlandEventCluesV3_8(offset(point,-WOODLAND_SIGHT_RADIUS_TILES+1)).find(c=>c.slotId===camp.slotId);
 assert.equal(nearby.stage,'sighted');
 assert.deepEqual(nearby.position,point);
 const complete=woodlandEventCluesV3_8(point,[{slotId:camp.slotId,state:'completed'}]);
 assert.equal(complete[0].text,camp.label+' · cleared');
 assert.ok(woodlandEventCluesV3_8(offset(point,25),[{slotId:camp.slotId,state:'completed'}]).every(c=>c.slotId!==camp.slotId));
 assert.equal(woodlandEventDistanceV3_8(point,point),0);
 assert.deepEqual(woodlandEventCluesV3_8(null),[]);
});

test('all three events survive the actual planned-world generator and form native legal six-actor encounters', {timeout:240000}, async()=>{
 const sha256=async bytes=>[...new Uint8Array(await webcrypto.subtle.digest('SHA-256',new Uint8Array(bytes)))];
 const dataset={
   plannedWorldReview:'true',waterReview:'true',shorelineReview:'true',
   sitePopulation:'true',multiroom:'true',ferryReview:'true',
   settlementLife:'true',settlementServices:'v2',worldCombat:'v1',
   townReview:'true',caveReview:'true',cavePopulation:'true',
   fortReview:'true',fortVersion:'v2',ruinReview:'true',ruinVersion:'v2',
   cryptReview:'true',cryptVersion:'v2',wildernessV2:'true',wildernessV3:'true'
 };
 const environment={document:{body:{dataset}},
   async fetch(url){
     try{const content=await readFile(fileURLToPath(url),'utf8');
       return {ok:true,text:async()=>content};}
     catch(error){return {ok:false,text:async()=>''};}
   }};
 const {generator,asset,binding}=await loadPlannedReviewV1(environment,'alpha',sha256);
 assert.equal(binding.wildernessVersion,'wilderness-distribution-v2-native');
 assert.equal(asset.wildernessExtension.eventCapacities.length,176);
 for(const event of WOODLAND_EVENT_PILOT_V3_7){
   const p=woodlandPilotWorldPosition(event);
   const generated=await generator.generate({seed:asset.campaignSeedHex,chunkX:p.chunkX,chunkY:p.chunkY});
   const anchor=generated.anchors.find(a=>a.ordinal===event.ordinal);
   assert.ok(anchor,'Absent native event anchor: '+event.slotId);
   assert.equal(anchor.members.length,6,event.slotId+' has complete six-actor encounter');
   assert.ok(anchor.id.startsWith('anchor:'),'Official encounter identity');
   assert.deepEqual(anchor.position,{x:p.localX,y:p.localY});
   assert.equal(generated.region.biome,'woodland');
   for(const member of anchor.members){
     const ix=Math.floor(member.position.x/32),iy=Math.floor(member.position.y/32);
     assert.equal(generated.collision.tiles[iy]?.[ix],'1',event.slotId+' actor not on walkable ground');
   }
   assert.equal(generated.anchors.filter(a=>a.ordinal===event.ordinal).length,1,'One event per matching slot');
   console.log('Generated playable event '+event.slotId+' '+anchor.members.length+' actors');
 }
});
