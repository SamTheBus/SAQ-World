import {createPlannedWorldAssetStore} from '../storage/planned_world_assets_v1.js';
import {ACTIVITY_SAVE_NAMESPACE} from '../shared/content/forge_review.js';
import {createActivitySaveTask} from '../storage/activity_save_task.js';
import {createLocalIndexedDbCampaignStore} from '../storage/local_indexeddb_campaign_store.js';
import {activityCampaignCodec} from '../storage/activity_campaign_store.js';
import {createWorldWorkerTaskD9} from '../storage/world_worker_task_d9.js';

export function startActivitySaveWorker(environment){
  const population=new URL(environment.location.href).searchParams.get('sitePopulation')==='1';const review=new URL(environment.location.href).searchParams.get('plannedReview')==='1',databaseName=review?(population?(new URL(environment.location.href).searchParams.get('ferryReview')==='1'?'saq-world-ferry-v1-':new URL(environment.location.href).searchParams.get('multiroom')==='1'?'saq-world-multiroom-v1-':'saq-world-alpha-site-population-v1-'):(new URL(environment.location.href).searchParams.get('cryptReview')==='1'?(new URL(environment.location.href).searchParams.get('cryptVersion')==='2'?'saq-world-planned-crypts-v2-':'saq-world-planned-small-crypt-v1-'):new URL(environment.location.href).searchParams.get('ruinReview')==='1'?(new URL(environment.location.href).searchParams.get('ruinVersion')==='2'?'saq-world-planned-ruins-v2-':'saq-world-planned-ruins-v1-'):new URL(environment.location.href).searchParams.get('fortReview')==='1'?(new URL(environment.location.href).searchParams.get('fortVersion')==='2'?'saq-world-planned-forts-v2-':'saq-world-planned-forts-v1-'):new URL(environment.location.href).searchParams.get('cavePopulation')==='1'?'saq-world-planned-caves-v2-':new URL(environment.location.href).searchParams.get('caveReview')==='1'?'saq-world-planned-cave-v1-':new URL(environment.location.href).searchParams.get('townReview')==='1'?'saq-world-town-start-art-v2-':new URL(environment.location.href).searchParams.get('artV2')==='1'?'saq-world-art-v2-':new URL(environment.location.href).searchParams.get('artPilot')==='1'?'saq-world-art-pilot-v1-':new URL(environment.location.href).searchParams.get('waterReview')==='1'?'saq-world-water-v3-':new URL(environment.location.href).searchParams.get('shorelineReview')==='1'?'saq-world-shoreline-v2-':'saq-world-planned-foundation-v1-'))+new URL(environment.location.href).searchParams.get('plan'):ACTIVITY_SAVE_NAMESPACE;
  let timings=[];
  const timing=(name,ms)=>{const entry=timings.find(t=>t.name===name);if(entry){entry.ms+=ms;entry.maximum=Math.max(entry.maximum,ms);entry.count++;}else if(timings.length<32)timings.push({name,ms,maximum:ms,count:1});};
  const sha256=async bytes=>{const start=environment.performance.now();try{return [...new Uint8Array(await environment.crypto.subtle.digest('SHA-256',new Uint8Array(bytes)))];}finally{timing('saveHash',environment.performance.now()-start);}};
  const measureAsync=async(name,fn)=>{const start=environment.performance.now();try{return await fn();}finally{timing(name,environment.performance.now()-start);}};
  const measure=(name,fn)=>{const start=environment.performance.now();try{return fn();}finally{timing(name,environment.performance.now()-start);}};
  const task=createActivitySaveTask({sha256,measure,measureAsync,storeFactory:options=>createLocalIndexedDbCampaignStore({...options,indexedDB:environment.indexedDB,databaseName,codec:activityCampaignCodec,
    observe:timing,now:()=>environment.performance.now()})});
  const plannedAssets=createPlannedWorldAssetStore({sha256,readText:async file=>{const response=await environment.fetch(new URL('../../'+file,import.meta.url));if(!response.ok)throw new Error('Missing planned world asset');return response.text();}});
  const worldTask=createWorldWorkerTaskD9({sha256,plannedAssets,store:createLocalIndexedDbCampaignStore({indexedDB:environment.indexedDB,sha256,databaseName,codec:activityCampaignCodec})});
  // Serialized work also keeps per-message timings separate if a caller posts
  // another request while hashing/IndexedDB yields.
  let tail=Promise.resolve();
  environment.onmessage=({data})=>{tail=tail.then(async()=>{timings=[];try{
   const world=typeof data.kind==='string'&&data.kind.startsWith('world.');
   if(!world&&!['commit','reconcile'].includes(data.kind))throw new Error('Unknown save task');
   const result=await measureAsync(world?'worldWorkerTotal':'saveDurabilityTotal',()=>world?worldTask(data.kind,data.request):task[data.kind](data.request));environment.postMessage({id:data.id,result,timings});
  }catch(error){environment.postMessage({id:data.id,error:error.message,...(error.code?{code:error.code}:{}),...(error.actorGeometry?{actorGeometry:error.actorGeometry}:{}),...(error.stack?{stack:error.stack}:{}),timings});}});};
  environment.postMessage({ready:true});
}
