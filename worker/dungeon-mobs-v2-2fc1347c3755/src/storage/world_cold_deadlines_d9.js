import {createPageTransaction} from './paged_world_store.js';
import {dueWorldDeadlines,validateWorldDeadline} from './world_deadlines_d9.js';
import {readOwnedGearD9,gearObligationKeyD9,prepareGearIndexD9,installGearIndexD9} from './world_gear_pages_d9.js';
import {autoSalvageReward} from '../shared/contracts/gear_salvage.js';
import {copyWire,canonicalStringify,safeInteger,requireContract as check} from '../shared/contracts/wire.js';
import {D9_PROFILE as P} from '../shared/content/world_profile_d9.js';
import {createWorldPageBufferD9} from './world_page_buffer_d9.js';
import {prepareGearKnowledgeD9,installGearKnowledgeD9} from './world_gear_knowledge_d9.js';
import {asWorldStreamCaptureD9,validateWorldStreamCaptureD9} from '../shared/contracts/world_stream_capture_d9.js';
import {worldTransferPatchD9} from '../shared/contracts/world_patch_d9.js';
const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);

// Runs only against a private prepared cut in the Worker. No distant actors or
// geometry are instantiated: the existing production salvage operation consumes
// its actual cold reward receipt and its exact fixed material quote.
export async function settleColdDeadlinesD9(state,buffer,{sha256,limit=8}){
 const deadlines=createPageTransaction({root:state.d9World.deadlineIndex,readPage:buffer.readPage,sha256}),due=await dueWorldDeadlines(deadlines,state.tick,limit),chunks=new Map(),additionalRows={},changedGroups=new Set();
 async function chunk(row){const key=row.chunkX+','+row.chunkY;if(!chunks.has(key))chunks.set(key,{delta:copyWire(await buffer.readChunk(state.d9World.regionIndex,row)),changed:false});return chunks.get(key);}
 for(const {key,value:row} of due.entries){validateWorldDeadline(row);await deadlines.set(key,null);
  const groupId='ordinary:'+row.anchorId.split(':').at(-1);if(state.groupsById[groupId])continue;
  const entry=await chunk(row),e=entry.delta?.encounters.find(e=>e.group.groupId===groupId);
  if(!e||e.economy.episode!==row.episode||e.episode.anchorId!==row.anchorId||!e.group.cleared||e.economy.vacatedTick===null||e.economy.vacatedTick!==row.vacatedTick)continue;
  if(row.kind==='gear-auto-salvage'){
   const r=e.players[row.ownerPlayerId]?.rewards[row.sourceId],p=state.playersById[row.ownerPlayerId];if(!r||!p||!r.generated||r.claimed||r.autoSalvageEligibleTick===null||r.autoSalvageEligibleTick>state.tick)continue;
   const itemId=`item:${p.playerId}:${r.sourceEntityId}`,owned=await readOwnedGearD9(state.d9World.ownershipIndex,p.playerId,itemId,{sha256,readPage:buffer.readPage});
   check(owned?.disposition==='UNCLAIMED'&&same(owned.item.generated,r.generated)&&owned.origin.groupId===groupId&&owned.origin.episode===e.economy.episode,'Cold salvage lacks current unclaimed ownership');
   check(!p.inventory.itemsById[itemId]&&!p.inventory.renewal.groundBySourceId[r.sourceEntityId],'Cold salvage item is locally owned');
   const working=copyWire(p),terminal=autoSalvageReward(state,working,r,owned.origin);
   // Keep the receipt with its cold source. Only the participant's actual
   // inventory revision and material/credit balances join the live cut.
   p.inventory.revision=working.inventory.revision;p.inventory.economy.materials=copyWire(working.inventory.economy.materials);p.inventory.d7.credits=copyWire(working.inventory.d7.credits);
   e.players[p.playerId].autoSalvaged[itemId]=copyWire(terminal);
   const credits=state.d9World.paging.players[p.playerId].salvageCredits;for(const [material,n] of Object.entries(terminal.materials))credits[material]=safeInteger((credits[material]??0)+n);
   const {location,drop,...base}=owned;(additionalRows[p.playerId]??=[]).push({...base,disposition:'AUTO_SALVAGED',terminal:{tick:terminal.tick,revision:terminal.revision,materials:copyWire(terminal.materials),eligibleTick:terminal.eligibleTick}});
  }
  entry.changed=true;changedGroups.add(groupId);
 }
 if(Object.keys(additionalRows).length){const index=await prepareGearIndexD9(state,{sha256,readPage:buffer.readPage,additionalRows});buffer.stage(index.pages);installGearIndexD9(state,index);}
 const owners=createPageTransaction({root:state.d9World.ownershipIndex,readPage:buffer.readPage,sha256});
 for(const entry of chunks.values())if(entry.changed){
  for(const e of entry.delta.encounters)if(changedGroups.has(e.group.groupId)&&e.economy.vacatedTick!==null&&state.tick-e.economy.vacatedTick>=P.renewalVacancyTicks){let unresolved=false;for(const pid of state.session.playerIds){const row=await owners.get(await gearObligationKeyD9(pid,e.group.groupId,sha256));if(row?.count)unresolved=true;}if(!unresolved)e.episode.renewalEligible=true;}
  entry.delta.savedTick=state.tick;const page=await buffer.prepareChunk(state.d9World.regionIndex,entry.delta);buffer.stage(page.pages);state.d9World.regionIndex=page.root;
 }
 buffer.stage(deadlines.pages());state.d9World.deadlineIndex=deadlines.root();return {processed:due.entries.length,coldGroups:[...changedGroups],more:!due.complete};
}

export async function prepareColdDeadlinePatchD9({state:before,stagedPages=[]},{sha256,readPage}){
 before=asWorldStreamCaptureD9(before,'deadlines');const state=copyWire(before),buffer=createWorldPageBufferD9({readPage,sha256});buffer.stage(stagedPages);const pageCheckpoint=buffer.capture();
 const index=await prepareGearIndexD9(state,{sha256,readPage:buffer.readPage});buffer.stage(index.pages);installGearIndexD9(state,index);
 const settled=await settleColdDeadlinesD9(state,buffer,{sha256}),knowledge=await prepareGearKnowledgeD9(state,{sha256,readPage:buffer.readPage});installGearKnowledgeD9(state,knowledge);validateWorldStreamCaptureD9(state,'deadlines');
 return {patch:worldTransferPatchD9(before,state,{coldGroups:settled.coldGroups}),pages:buffer.captureSince(pageCheckpoint),processed:settled.processed,more:settled.more};
}
