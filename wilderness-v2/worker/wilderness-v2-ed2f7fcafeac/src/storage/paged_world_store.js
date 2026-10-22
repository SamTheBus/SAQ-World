import {canonicalStringify,copyWire,requireContract as check} from '../shared/contracts/wire.js';
import {hashBytes,utf8,bytesToHex} from '../shared/contracts/hashing.js';
export const D9_PAGE_VERSION='world-delta-page-d9-v1',D9_PAGE_DATABASE='saq-world-pages-d9-v1';
// Exact canonical bytes, never a mutable object identity or an unverified ID.
// Validate the complete wire document on EVERY lookup. An identical document
// has already passed UTF-8/byte/digest validation under this same provider.
// Provider-scoped, bounded memoization cannot retain campaign/actor objects.
const digestMemos=new WeakMap(),DIGEST_ENTRIES=128,DIGEST_TOTAL_CHARS=2*1024*1024,DIGEST_ENTRY_CHARS=128*1024;
export async function pageDigest(value,sha256){
 const text=canonicalStringify(value);check(typeof sha256==='function','Explicit SHA-256 provider required');
 // Large one-off cuts do not displace the reusable chunk/trie documents.
 if(text.length>DIGEST_ENTRY_CHARS)return bytesToHex(await hashBytes(utf8(text),sha256));
 let memo=digestMemos.get(sha256);if(!memo){memo={entries:new Map(),characters:0};digestMemos.set(sha256,memo);}
 const cached=memo.entries.get(text);if(cached){memo.entries.delete(text);memo.entries.set(text,cached);return cached.promise;}
 const entry={promise:(async()=>bytesToHex(await hashBytes(utf8(text),sha256)))(),characters:text.length};
 memo.entries.set(text,entry);memo.characters+=text.length;
 while(memo.entries.size>DIGEST_ENTRIES||memo.characters>DIGEST_TOTAL_CHARS){const key=memo.entries.keys().next().value,old=memo.entries.get(key);memo.entries.delete(key);memo.characters-=old.characters;}
 entry.promise.catch(()=>{if(memo.entries.get(text)===entry){memo.entries.delete(text);memo.characters-=entry.characters;}});
 return entry.promise;
}
export function createPageTransaction({root=null,readPage,sha256}){
 const dirty=new Map(),cache=new Map();let current=root;
 const load=async id=>{if(!id)return null;if(dirty.has(id))return dirty.get(id);if(cache.has(id))return cache.get(id);const value=await readPage(id);check(value&&await pageDigest(value,sha256)===id,'Page commitment mismatch');if(cache.size>=64)cache.delete(cache.keys().next().value);cache.set(id,value);return value;};
 const put=async value=>{const body=copyWire(value),id=await pageDigest(body,sha256);dirty.set(id,body);return id;};
 async function get(key){check(/^[a-f0-9]{64}$/.test(key),'Page key requires full digest');let id=current;for(let depth=0;id;depth++){check(depth<=64,'Page trie depth');const node=await load(id);check(node.version===D9_PAGE_VERSION,'Page version');if(node.kind==='leaf')return node.values[key]??null;id=node.children[key[depth]]??null;}return null;}
 async function update(id,key,value,depth){const node=id?await load(id):{version:D9_PAGE_VERSION,kind:'leaf',values:{}};
  if(node.kind==='branch'){check(depth<64,'Page key collision');const children={...node.children},next=await update(children[key[depth]],key,value,depth+1);if(next)children[key[depth]]=next;else delete children[key[depth]];return Object.keys(children).length?put({version:D9_PAGE_VERSION,kind:'branch',children}):null;}
  const values={...node.values};if(value===null)delete values[key];else values[key]=copyWire(value);const keys=Object.keys(values).sort();if(!keys.length)return null;
  if(keys.length<=16)return put({version:D9_PAGE_VERSION,kind:'leaf',values});check(depth<64,'Page key collision');
  const children={};for(const k of keys)children[k[depth]]=await update(children[k[depth]],k,values[k],depth+1);return put({version:D9_PAGE_VERSION,kind:'branch',children});
 }
 async function range({after=null,through='f'.repeat(64),limit=64}={}){check((after===null||/^[a-f0-9]{64}$/.test(after))&&/^[a-f0-9]{64}$/.test(through)&&Number.isSafeInteger(limit)&&limit>=1&&limit<=128,'Invalid page range');const entries=[];
  async function visit(id,prefix){if(!id||entries.length>limit||prefix.padEnd(64,'0')>through||after!==null&&prefix.padEnd(64,'f')<=after)return;const node=await load(id);if(node.kind==='leaf'){for(const key of Object.keys(node.values).sort()){if((after===null||key>after)&&key<=through){entries.push({key,value:copyWire(node.values[key])});if(entries.length>limit)return;}}}else for(const edge of Object.keys(node.children).sort()){await visit(node.children[edge],prefix+edge);if(entries.length>limit)return;}}
  await visit(current,'');const complete=entries.length<=limit;if(!complete)entries.pop();return {entries,complete,cursor:entries.at(-1)?.key??after};
 }
 function pages(){const out=[],seen=new Set();function visit(id){if(!id||seen.has(id)||!dirty.has(id))return;seen.add(id);const value=dirty.get(id);out.push({id,value});if(value.kind==='branch')for(const child of Object.values(value.children))visit(child);}visit(current);return out;}
 return {get,range,async set(key,value){check(/^[a-f0-9]{64}$/.test(key),'Page key requires full digest');current=await update(current,key,value,0);return current;},root:()=>current,pages};
}
export function createIndexedDbWorldPages({indexedDB,databaseName=D9_PAGE_DATABASE}){
 check(indexedDB?.open,'IndexedDB capability required');
 let opening;
 const open=()=>opening??=new Promise((resolve,reject)=>{const r=indexedDB.open(databaseName,1);r.onupgradeneeded=()=>{for(const s of ['pages','roots'])if(!r.result.objectStoreNames.contains(s))r.result.createObjectStore(s);};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('D9 page database blocked'));});
 async function read(store,key){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction([store],'readonly'),r=tx.objectStore(store).get(key);r.onsuccess=()=>resolve(r.result??null);r.onerror=()=>reject(r.error);});}
 return {readPage:id=>read('pages',id),readRoot:id=>read('roots',id),async publish({campaignId,expectedRevision,root,pages}){
  const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction(['pages','roots'],'readwrite');let failure=null;
   const r=tx.objectStore('roots').get(campaignId);r.onsuccess=()=>{try{const prior=r.result??null;check((prior?.revision??null)===expectedRevision,'Stale D9 root revision');check(root.revision===(expectedRevision??0)+1,'D9 root revision gap');for(const p of pages){check(/^[a-f0-9]{64}$/.test(p.id),'Invalid page commitment');tx.objectStore('pages').put(p.value,p.id);}tx.objectStore('roots').put(root,campaignId);}catch(e){failure=e;tx.abort();}};
   tx.oncomplete=()=>resolve(copyWire(root));tx.onabort=()=>reject(failure??tx.error??new Error('D9 root publication aborted'));tx.onerror=()=>{failure??=tx.error;};
  });
 }};
}
