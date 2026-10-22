import {D9_RUNTIME_POLICY as B} from '../shared/content/world_runtime_policy_d9.js';
import {copyWire,freezeWire,canonicalStringify,requireContract as check} from '../shared/contracts/wire.js';
import {createPageTransaction,pageDigest} from './paged_world_store.js';
import {worldDocument} from './world_page_publication_d9.js';
import {signedAddress} from '../shared/contracts/world_address.js';

export const chunkDeltaKeyD9=(address,sha256)=>pageDigest({version:'world-chunk-key-d9-v1',chunkX:signedAddress(address.chunkX),chunkY:signedAddress(address.chunkY)},sha256);
// A bounded dirty-page handoff. The host must capture these pages and their root
// in the same durability cut before it acknowledges or releases the handoff.
export function createWorldPageBufferD9({readPage,sha256,limit=B.dirtyPages,now=()=>Date.now()}){
 const staged=new Map(),stagedAt=new Map();
 const read=async id=>staged.get(id)?.value??readPage(id);
 function prepareStage(pages){const rows=new Map(pages.map(p=>[p.id,freezeWire(p)])),added=[...rows.keys()].filter(id=>!staged.has(id));check(staged.size+added.length<=limit,'D9 pending page buffer needs a save before more eviction');return ()=>{const at=now();for(const [id,p] of rows){if(!staged.has(id))stagedAt.set(id,at);staged.set(id,p);}};}
 function stage(pages){prepareStage(pages)();}
 async function readChunk(root,address){
  if(!root)return null;const tx=createPageTransaction({root,readPage:read,sha256}),ref=await tx.get(await chunkDeltaKeyD9(address,sha256));if(!ref)return null;
  check(ref.version==='world-page-ref-d9-v1','Chunk index reference version');const doc=await read(ref.pageId);check(doc&&await pageDigest(doc,sha256)===ref.pageId&&doc.kind==='chunk-delta','Missing/corrupt chunk delta');
  check(doc.payload.chunkX===address.chunkX&&doc.payload.chunkY===address.chunkY,'Chunk delta address mismatch');return copyWire(doc.payload);
 }
 async function prepareChunk(root,delta){
  const doc=worldDocument('chunk-delta',delta),pageId=await pageDigest(doc,sha256),tx=createPageTransaction({root,readPage:read,sha256});
  await tx.set(await chunkDeltaKeyD9(delta,sha256),{version:'world-page-ref-d9-v1',pageId});
  return {expectedRoot:root,root:tx.root(),pages:[{id:pageId,value:doc},...tx.pages()]};
 }
 // Stage validates and owns one deeply frozen copy. Repeated handoffs need a
 // fresh bounded list, not another validation/copy of every immutable page.
 // Worker/storage publication still validates content hashes and full cuts.
 return {readPage:read,readChunk,prepareChunk,stage,prepareStage,
  // A background save can acknowledge input pages while the Worker yields.
  // Restore any now-missing request pages before installing its delta, exactly
  // as the former full-page response did. Already-owned pages need no recopy.
  prepareStageDelta(pages,checkpoint){return prepareStage([...checkpoint.filter(p=>!staged.has(p.id)),...pages]);},
  capture:()=>[...staged.values()],
  // A Worker receives pages already owned by the host. Return only changes
  // since that request's immutable checkpoint, avoiding a redundant clone and
  // freeze of the complete dirty inventory on every small live handoff.
  // Equal-ID replacements are compared by content; differing content is never
  // hidden and remains subject to normal publication/hash validation.
  captureSince(pages){const before=new Map(pages.map(p=>[p.id,p]));return [...staged.values()].filter(p=>{const old=before.get(p.id);return !old||old!==p&&canonicalStringify(old)!==canonicalStringify(p);});},
  acknowledge(pages){for(const p of pages){staged.delete(p.id);stagedAt.delete(p.id);}},resources:()=>{const at=now(),oldest=stagedAt.size?Math.min(...stagedAt.values()):null;return {dirtyPages:staged.size,capacity:limit,oldestDirtyPageAgeMs:oldest===null?0:Math.max(0,at-oldest),oldestDirtyPageSinceMs:oldest};}};
}
