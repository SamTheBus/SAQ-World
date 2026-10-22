import {WORLD_REF_STORE,trackWorldPublicationD9,collectWorldPagesD9} from './world_page_refs_d9.js';
import {canonicalStringify,copyWire,closedRecord,requireContract as check,safeInteger,validateWire} from '../shared/contracts/wire.js';
import {pageDigest,D9_PAGE_VERSION} from './paged_world_store.js';
import {D9_PROFILE} from '../shared/content/world_profile_d9.js';
export const WORLD_PAGE_STORE='worldPagesD9',WORLD_ROOT_STORE='worldRootsD9';
export const WORLD_PUBLICATION_VERSION='world-publication-d9-v1';
const digest=id=>check(typeof id==='string'&&/^[a-f0-9]{64}$/.test(id),'Invalid world-page commitment');
export function validateWorldPublication(root){
 validateWire(root);closedRecord(root,['version','campaignId','revision','tick','profile','originPage','runtimePage','regions','knowledge','deadlines','content','ownership','ground','previous']);
 check(root.version===WORLD_PUBLICATION_VERSION&&root.profile===D9_PROFILE.version,'Unsupported world publication');
 check(typeof root.campaignId==='string','Missing campaign identity');safeInteger(root.revision,1);safeInteger(root.tick);
 for(const k of ['originPage','runtimePage'])digest(root[k]);for(const k of ['regions','knowledge','deadlines','content','ownership','ground','previous'])if(root[k]!==null)digest(root[k]);
 return root;
}
export function pageReferences(value){
 validateWire(value);
 if(value.version===D9_PAGE_VERSION){
  if(value.kind==='branch'){closedRecord(value,['version','kind','children']);for(const [key,id] of Object.entries(value.children)){check(/^[a-f0-9]$/.test(key),'Invalid radix edge');digest(id);}return Object.values(value.children);}
  check(value.kind==='leaf','Invalid page node');closedRecord(value,['version','kind','values']);check(Object.keys(value.values).length<=16,'Oversize leaf');const refs=[];for(const [key,row] of Object.entries(value.values)){digest(key);if(row?.version==='world-page-ref-d9-v1'){closedRecord(row,['version','pageId']);digest(row.pageId);refs.push(row.pageId);}}return refs;
 }
 if(value.version===WORLD_PUBLICATION_VERSION){validateWorldPublication(value);return ['originPage','runtimePage','regions','knowledge','deadlines','content','ownership','ground'].map(k=>value[k]).filter(Boolean);}
 closedRecord(value,['version','kind','payload','references']);check(value.version==='world-document-d9-v1'&&typeof value.kind==='string'&&Array.isArray(value.references),'Invalid world document');for(const id of value.references)digest(id);return value.references;
}
export const worldDocument=(kind,payload,references=[])=>copyWire({version:'world-document-d9-v1',kind,payload,references});

// Shared with the existing campaign database. Hashing/validation finish before
// opening the write transaction; pages and the sole published root commit together.
export function createWorldPagePublication({openDatabase,sha256}){
 async function read(store,key){const db=await openDatabase();return new Promise((resolve,reject)=>{const tx=db.transaction([store],'readonly');let value=null;const r=tx.objectStore(store).get(key);r.onsuccess=()=>{value=r.result??null;};tx.oncomplete=()=>{db.close();resolve(value);};tx.onabort=()=>{db.close();reject(tx.error??new Error('World page read aborted'));};});}
 async function readPage(id){digest(id);const value=await read(WORLD_PAGE_STORE,id);check(value&&await pageDigest(value,sha256)===id,'Missing/corrupt world page');pageReferences(value);return value;}
 async function readRoot(campaignId){const record=await read(WORLD_ROOT_STORE,campaignId);if(!record)return null;digest(record.id);const root=await readPage(record.id);validateWorldPublication(root);check(root.campaignId===campaignId&&record.revision===root.revision,'World root identity mismatch');return {id:record.id,root};}
 async function publish({root,pages,expectedRoot=null,legacyCheckpoint=null}){
  validateWorldPublication(root);check(Array.isArray(pages)&&pages.length<=256,'World publication batch bound');if(expectedRoot!==null)digest(expectedRoot);
  check(root.previous===expectedRoot,'World root parent mismatch');check(expectedRoot!==null||root.revision===1,'Initial root revision');
  // Validate each incoming document in full, then retain its reference list
  // for this single publication. These private owned copies never mutate.
  // Reachability and reference accounting need the edges, not repeated full
  // traversal of origin/runtime payloads inside the IndexedDB transaction.
  const staged=new Map(),referenceLists=new Map();for(const {id,value} of pages){digest(id);check(await pageDigest(value,sha256)===id,'Page commitment mismatch');const refs=pageReferences(value);check(!staged.has(id)||canonicalStringify(staged.get(id))===canonicalStringify(value),'Conflicting staged page');const owned=copyWire(value);staged.set(id,owned);referenceLists.set(owned,[...refs]);}
  const rootId=await pageDigest(root,sha256),ownedRoot=copyWire(root);staged.set(rootId,ownedRoot);referenceLists.set(ownedRoot,pageReferences(ownedRoot));
  const references=value=>{const refs=referenceLists.get(value);check(refs,'Publication reference list was not validated');return refs;};
  const reachable=new Set();const visit=id=>{if(reachable.has(id)||!staged.has(id))return;reachable.add(id);for(const ref of references(staged.get(id)))visit(ref);};visit(rootId);for(const id of staged.keys())if(!reachable.has(id))staged.delete(id);
  const referenced=new Set([...staged.values()].flatMap(references));for(const id of staged.keys())referenced.delete(id);
  const db=await openDatabase();return new Promise((resolve,reject)=>{
   const tx=db.transaction([WORLD_PAGE_STORE,WORLD_ROOT_STORE,'campaigns',...(db.objectStoreNames.contains(WORLD_REF_STORE)?[WORLD_REF_STORE]:[])],'readwrite',{durability:'strict'});let failure=null,remaining=2+referenced.size,current,legacy;const found=new Set();
   const abort=e=>{failure=e;tx.abort();};
   function ready(){if(--remaining!==0)return;try{
    if(current?.id===rootId){check(current.revision===root.revision,'Replay revision mismatch');return;}
    check((current?.id??null)===expectedRoot,'Stale world publication');check(root.revision===(current?.revision??0)+1,'World revision gap');
    if(expectedRoot===null){check(typeof legacyCheckpoint==='string'&&legacy===legacyCheckpoint,'Origin migration checkpoint changed');}
    check(found.size===referenced.size,'World publication references missing pages');
    trackWorldPublicationD9(tx,{staged,rootId,previous:expectedRoot,references,abort});
    for(const [id,value] of staged)tx.objectStore(WORLD_PAGE_STORE).put(value,id);
    tx.objectStore(WORLD_ROOT_STORE).put({id:rootId,revision:root.revision},root.campaignId);
   }catch(e){abort(e);}}
   const r=tx.objectStore(WORLD_ROOT_STORE).get(root.campaignId);r.onsuccess=()=>{current=r.result??null;ready();};
   const old=tx.objectStore('campaigns').get(root.campaignId);old.onsuccess=()=>{legacy=old.result??null;ready();};
   for(const id of referenced){const r=tx.objectStore(WORLD_PAGE_STORE).getKey(id);r.onsuccess=()=>{if(r.result!==undefined)found.add(id);ready();};}
   tx.oncomplete=()=>{db.close();resolve({status:'committed',id:rootId,revision:root.revision});};tx.onabort=()=>{db.close();reject(failure??tx.error??new Error('World publication aborted'));};
  });
 }
 return {readPage,readRoot,publish,collect:()=>collectWorldPagesD9(openDatabase,WORLD_PAGE_STORE)};
}
