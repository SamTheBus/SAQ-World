import {pageDigest,D9_PAGE_VERSION} from './paged_world_store.js';
import {copyWire,canonicalStringify,requireContract as check} from '../shared/contracts/wire.js';

// Compare only changed radix paths. Equal immutable subtree commitments skip
// all historical contents; this is bounded by the current publication's work.
export async function changedPageEntriesD9({before,after,readPage,sha256,limit=128}){
 const cache=new Map(),entries=[];let visits=0;
 async function load(id){if(!id)return null;if(cache.has(id))return cache.get(id);const node=await readPage(id);check(node?.version===D9_PAGE_VERSION&&await pageDigest(node,sha256)===id,'Changed page commitment mismatch');if(cache.size>=64)cache.delete(cache.keys().next().value);cache.set(id,node);return node;}
 async function visit(aId,bId,depth,aNode=null,bNode=null){if(aId&&aId===bId)return;if(!aId&&!bId&&!aNode&&!bNode)return;check(++visits<=2048&&depth<=64,'World cut requires a smaller page comparison');
  const a=aNode??await load(aId),b=bNode??await load(bId);
  if(a?.kind!=='branch'&&b?.kind!=='branch'){for(const key of new Set([...Object.keys(a?.values??{}),...Object.keys(b?.values??{})])){const old=a?.values[key]??null,next=b?.values[key]??null;if(canonicalStringify(old)!==canonicalStringify(next)){check(entries.length<limit,'World cut changed-entry comparison bound');entries.push({key,before:copyWire(old),after:copyWire(next)});}}return;}
  const edges=new Set([...Object.keys(a?.children??{}),...Object.keys(b?.children??{}),...Object.keys(a?.values??{}).map(k=>k[depth]),...Object.keys(b?.values??{}).map(k=>k[depth])]);
  const partition=(node,edge)=>node?.kind==='leaf'?{version:D9_PAGE_VERSION,kind:'leaf',values:Object.fromEntries(Object.entries(node.values).filter(([k])=>k[depth]===edge))}:null;
  for(const edge of [...edges].sort())await visit(a?.children?.[edge]??null,b?.children?.[edge]??null,depth+1,partition(a,edge),partition(b,edge));
 }
 await visit(before,after,0);return entries;
}
