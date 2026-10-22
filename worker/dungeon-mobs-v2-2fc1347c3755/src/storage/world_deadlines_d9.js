import {safeInteger,requireContract as check,closedRecord} from '../shared/contracts/wire.js';
import {pageDigest} from './paged_world_store.js';
import {createPageTransaction} from './paged_world_store.js';
import {D9_PROFILE as P} from '../shared/content/world_profile_d9.js';
import {signedAddress} from '../shared/contracts/world_address.js';
export const D9_DEADLINE_VERSION='world-deadline-d9-v1';
export function validateWorldDeadline(row){closedRecord(row,['version','kind','tick','chunkX','chunkY','anchorId','episode','sourceId','ownerPlayerId'],['vacatedTick']);check(row.version===D9_DEADLINE_VERSION&&['renewal-vacancy','gear-auto-salvage'].includes(row.kind),'Unknown world deadline');safeInteger(row.tick);signedAddress(row.chunkX);signedAddress(row.chunkY);safeInteger(row.episode);if(row.vacatedTick!==undefined)safeInteger(row.vacatedTick,0,row.tick);return row;}
export async function worldDeadlineKey(row,sha256){validateWorldDeadline(row);return row.tick.toString(16).padStart(14,'0')+(await pageDigest(row,sha256)).slice(0,50);}
// Ordered keys allow bounded due-page traversal without visiting distant chunks.
// Callers apply the exact epoch/owner witness and delete the deadline in the SAME
// prepared root publication. A stale entry is retired, never reused as an award.
export async function dueWorldDeadlines(index,tick,limit=64){safeInteger(tick);return index.range({through:tick.toString(16).padStart(14,'0')+'f'.repeat(50),limit});}

export async function prepareChunkDeadlinesD9(root,delta,{readPage,sha256}){
 const tx=createPageTransaction({root,readPage,sha256});
 for(const e of delta.encounters){if(!e.group.cleared||e.economy.vacatedTick===null)continue;
  const base={version:D9_DEADLINE_VERSION,chunkX:delta.chunkX,chunkY:delta.chunkY,anchorId:e.episode.anchorId,episode:e.economy.episode,vacatedTick:e.economy.vacatedTick};
  const add=async row=>{await tx.set(await worldDeadlineKey(row,sha256),row);};
  if(!e.episode.renewalEligible)await add({...base,kind:'renewal-vacancy',tick:safeInteger(e.economy.vacatedTick+P.renewalVacancyTicks),sourceId:null,ownerPlayerId:null});
  for(const [ownerPlayerId,rows] of Object.entries(e.players))for(const r of Object.values(rows.rewards))if(r.generated&&!r.claimed&&r.autoSalvageEligibleTick!==null)await add({...base,kind:'gear-auto-salvage',tick:Math.max(r.autoSalvageEligibleTick,e.economy.vacatedTick),sourceId:r.sourceEntityId,ownerPlayerId});
 }
 return {root:tx.root(),pages:tx.pages()};
}
