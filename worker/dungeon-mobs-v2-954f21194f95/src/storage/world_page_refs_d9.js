import {D9_RUNTIME_POLICY as B} from '../shared/content/world_runtime_policy_d9.js';
export const WORLD_REF_STORE='worldPageRefsD9';
export function trackWorldPublicationD9(tx,{staged,rootId,previous,references,abort}){
 if(!tx.objectStoreNames.contains(WORLD_REF_STORE))return;
 const store=tx.objectStore(WORLD_REF_STORE),ids=new Set([rootId,...staged.keys(),...(previous?[previous]:[])]);for(const value of staged.values())for(const id of references(value))ids.add(id);
 const found=new Map();let remaining=ids.size;
 for(const id of ids){const r=store.get(id);r.onsuccess=()=>{found.set(id,r.result??null);if(--remaining)return;try{
   // Pre-release stores without accounting remain recoverable and untouched.
   // D8→D9 publications start with a complete reference graph.
   if(previous&&!found.get(previous)){store.put({reason:'pre-release root lacks reference accounting'},'untracked');return;}
   const updates=new Map();const value=id=>{if(!updates.has(id)){const prior=found.get(id);if(!prior&&!staged.has(id))throw new Error('World reference graph lacks a referenced page');updates.set(id,prior?{...prior,references:[...prior.references]}:{count:0,references:references(staged.get(id))});}return updates.get(id);};
   for(const [id,doc] of staged)if(!found.get(id)){value(id);for(const ref of references(doc))value(ref).count++;}
   value(rootId).count++;if(previous)value(previous).count--;
   for(const [id,row] of updates){if(!Number.isSafeInteger(row.count)||row.count<0)throw new Error('World reference accounting underflow');store.put(row,id);}
  }catch(e){abort(e);}};}
}
// One inexpensive Worker maintenance slice. A page becomes collectible only
// after every document edge and every currently published campaign root releases it.
export async function collectWorldPagesD9(openDatabase,pageStore,limit=B.garbageCollectionPages){
 const db=await openDatabase();if(!db.objectStoreNames.contains(WORLD_REF_STORE)){db.close();return {deleted:0};}
 return new Promise((resolve,reject)=>{const tx=db.transaction([WORLD_REF_STORE,pageStore],'readwrite'),refs=tx.objectStore(WORLD_REF_STORE);let deleted=0,failure=null;
  const guard=refs.get('untracked');guard.onsuccess=()=>{if(guard.result)return;const r=refs.index('count').getAllKeys(0,limit);r.onsuccess=()=>{const roots=r.result;if(!roots.length)return;const candidates=new Map();let pending=roots.length;
   const ready=()=>{if(--pending)return;const children=new Set([...candidates.values()].flatMap(v=>v.references)),values=new Map();let count=children.size;
    const apply=()=>{try{for(const row of candidates.values())for(const id of row.references){const v=values.get(id);if(!v||v.count<=0)throw new Error('World GC reference accounting mismatch');v.count--;}
     for(const [id,row] of values)refs.put(row,id);for(const id of candidates.keys()){refs.delete(id);tx.objectStore(pageStore).delete(id);deleted++;}
    }catch(e){failure=e;tx.abort();}};
    if(!count){apply();return;}for(const id of children){const q=refs.get(id);q.onsuccess=()=>{values.set(id,q.result);if(--count===0)apply();};}
   };
   for(const id of roots){const q=refs.get(id);q.onsuccess=()=>{if(q.result?.count===0)candidates.set(id,q.result);ready();};}
  };};
  tx.oncomplete=()=>{db.close();resolve({deleted});};tx.onabort=()=>{db.close();reject(failure??tx.error??new Error('World page maintenance aborted'));};
 });
}
