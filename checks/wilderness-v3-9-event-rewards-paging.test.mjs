import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {webcrypto} from 'node:crypto';
import {loadPlannedReviewV1} from '../src/dev/planned_world_review_v1.js';
import {createPlannedChunkGenerator} from '../src/shared/generation/planned_world_chunks_v1.js';
import {WOODLAND_EVENT_PILOT_V3_7,woodlandPilotWorldPosition,woodlandPilotEventAlreadyAdmitted,isWoodlandPilotTreasureAnchor} from '../src/shared/generation/woodland_event_pilot_v3_7.js';
import {planLocalFramesD9,projectToLocalFrameD9} from '../src/shared/contracts/local_world_frames_d9.js';
import {unfrozenEpisodeD9} from '../src/shared/contracts/episode_progression_d9.js';
import {episodeRewardId} from '../src/shared/content/economy_rewards.js';
import {resourceForCommand} from '../src/shared/contracts/encounter_economy.js';
import {captureChunkDeltaD9,hydrateChunkDeltaD9} from '../src/shared/contracts/world_chunk_delta_d9.js';

const groupId='ordinary:'+'f'.repeat(32);
const sourceId=episodeRewardId(groupId,0,'chest',0);
const chest={groupId,ordinal:0,kind:'chest',art:'chest',completion:true,position:{x:100,y:100},spaceInstanceId:'space:world'};
const minimalState=()=>({
 d9World:{origin:{resources:[]},runtime:{resources:[structuredClone(chest)],revision:1}},
 groupsById:{[groupId]:{groupId,cleared:false}},
 encounterEconomy:{groups:{[groupId]:{episode:0,usedResources:{}}}}
});
const command={groupId,ordinal:0,episode:0};

test('guarded chest cannot be looted before clearing, cannot be claimed twice, and survives serialization',()=>{
 const state=minimalState();
 assert.equal(resourceForCommand(state,null,command),null,'Uncleared defenders block the cache');
 state.groupsById[groupId].cleared=true;
 assert.equal(resourceForCommand(state,null,command)?.completion,true,'After victory the real chest becomes usable');
 const consumedId=episodeRewardId(groupId,0,'chest',0);
 assert.equal(consumedId,sourceId);
 state.encounterEconomy.groups[groupId].usedResources[consumedId]={tick:23,playerIds:['player:test']};
 const reopened=JSON.parse(JSON.stringify(state));
 assert.equal(resourceForCommand(reopened,null,command),null,'Collected chest stays used after serialization');
 assert.equal(reopened.groupsById[groupId].cleared,true,'Defeated group stays defeated');
});

test('cleared Woodland event and chest receipt survive native cold-page capture and restore', {timeout:240000},async()=>{
 const seedData={plannedWorldReview:'true',waterReview:'true',shorelineReview:'true',
  sitePopulation:'true',multiroom:'true',ferryReview:'true',settlementLife:'true',
  settlementServices:'v2',worldCombat:'v1',townReview:'true',caveReview:'true',
  cavePopulation:'true',fortReview:'true',fortVersion:'v2',ruinReview:'true',
  ruinVersion:'v2',cryptReview:'true',cryptVersion:'v2',wildernessV2:'true',wildernessV3:'true'};
 const environment={document:{body:{dataset:seedData}},async fetch(url){
  try{const content=await readFile(fileURLToPath(url),'utf8');return {ok:true,text:async()=>content};}
  catch{return {ok:false,text:async()=>''};}
 }};
 const sha256=async bytes=>[...new Uint8Array(await webcrypto.subtle.digest('SHA-256',new Uint8Array(bytes)))];
 const {asset,binding}=await loadPlannedReviewV1(environment,'alpha',sha256);
 const generator=createPlannedChunkGenerator(asset,binding,sha256);
 const event=WOODLAND_EVENT_PILOT_V3_7.find(e=>e.kind==='treasure_cache');
 const tile=woodlandPilotWorldPosition(event);
 const chunk=await generator.generate({seed:asset.campaignSeedHex,chunkX:tile.chunkX,chunkY:tile.chunkY});
 const anchor=chunk.anchors.find(a=>a.ordinal===event.ordinal);
 assert.ok(anchor&&isWoodlandPilotTreasureAnchor(anchor),'Real native cache encounter exists');
 const frames=planLocalFramesD9([{playerId:'player:test',position:tile}]);
 const local=p=>{
  const q=projectToLocalFrameD9({chunkX:chunk.chunkX,chunkY:chunk.chunkY,localX:p.x,localY:p.y},frames);
  assert.ok(q,'Projected point must be in live frame');return {x:q.x,y:q.y};
 };
 const id='ordinary:'+anchor.id.split(':').at(-1);
 const members=anchor.members.map((m,i)=>({
  entityId:'ent:'+String(i+1).padStart(32,'0'),
  enemyDefinitionId:'def:'+String(i+1).padStart(32,'1'),profileId:'def:'+String(i+1).padStart(32,'2'),
  position:local(m.position)
 }));
 const actors=members.map(m=>({
  entityId:m.entityId,position:{...m.position},alive:false,hp:'0',maxHp:'100',
  team:'hostile',ai:{melee:{phase:'idle'}},residency:{spaceInstanceId:'space:world'}
 }));
 const ids=members.map(m=>m.entityId),anchorPosition=local(anchor.position);
 const receiptId=episodeRewardId(id,0,'chest',0);
 const resource={...chest,groupId:id,position:local(anchor.position)};
 const stored={...unfrozenEpisodeD9(anchor.id,0),clearedTick:30,vacatedTick:40,
  geography:{chunkX:chunk.chunkX,chunkY:chunk.chunkY,anchorOrdinal:anchor.ordinal,minimumLevel:1,rank:anchor.rank}};
 const group={groupId:id,entityIds:ids,siteId:null,spaceInstanceId:'space:world',cleared:true,
  containment:{mode:'guard',homeAnchor:{...anchorPosition},
   memberHomesById:Object.fromEntries(members.map(m=>[m.entityId,{...m.position}]))}};
 const player={inventory:{
   rewardsByEntityId:{},goldAwardsByEntityId:{},economy:{soulAwardsByEntityId:{}},
   d7:{salvaged:{},autoSalvaged:{}},renewal:{groundBySourceId:{}}
  },d8:{causalXp:{}}};
 const state={
  tick:55,overworldInstanceId:'space:world',
  d9World:{runtime:{frames,groups:[{groupId:id,anchor:anchorPosition,members}],resources:[resource]},
   episodes:{[id]:stored},functionalSitesById:{}},
  groupsById:{[id]:group},entitiesById:Object.fromEntries(actors.map(a=>[a.entityId,a])),
  playersById:{'player:test':player},subweaponCombat:{projectiles:{},effects:{},controls:{},mastery:{}},
  hostileCombat:{actionsByEntityId:{},projectiles:{}},
  encounterEconomy:{groups:{[id]:{episode:0,startedTick:0,clearedTick:30,vacatedTick:40,
   usedResources:{[receiptId]:{tick:50,playerIds:['player:test']}}}}}
 };
 const delta=captureChunkDeltaD9(state,chunk);
 assert.equal(delta.encounters.length,1,'Native cold page retains completed encounter');
 const saved=JSON.parse(JSON.stringify(delta));
 const restored=hydrateChunkDeltaD9(saved,chunk,frames);
 const entry=restored.encounters[0];
 assert.equal(entry.group.cleared,true,'Group clearance survives paging');
 assert.equal(entry.episode.anchorId,anchor.id,'Same original identity after paging');
 assert.equal(entry.episode.geography.anchorOrdinal,event.ordinal);
 assert.equal(entry.economy.usedResources[receiptId]?.tick,50,'Chest collection receipt survived');
 assert.equal(entry.resources[0].completion,true,'Guarded completion chest survived');
 assert.equal(entry.actors.length,6,'Defeated enemies are not regenerated');
 assert.equal(woodlandPilotEventAlreadyAdmitted(anchor,entry.episode),true,
  'Restored event cannot be scheduled as a fresh pack');
 const after=minimalState();after.groupsById={[id]:entry.group};
 after.encounterEconomy.groups={[id]:entry.economy};
 after.d9World.runtime.resources=entry.resources;
 assert.equal(resourceForCommand(after,null,{groupId:id,episode:0,ordinal:0}),null,
  'Reopened game does not grant already-collected chest again');
});
