// V3 release regression: the Activity initial cut and World D9 migration must
// share one IndexedDB database in both Worker and browser. No save deletion.
// Run: node checks/wilderness-v3-database-routing.test.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveWildernessV3WorkerDatabaseName,startActivitySaveWorker}
  from '../worker/wilderness-v3-migrationfix-20261022/src/entrypoints/activity_save_worker.js';
import {createWorldWorkerBridgeD9} from '../src/client/world_worker_bridge_d9.js';
import {createActivitySaveBridge} from '../src/client/activity_save_bridge.js';
import {createWorldSaveTaskD9} from '../src/storage/world_save_task_d9.js';

const originalWorkerDb='saq-world-combat-v2-alpha';
const newCampaignDb='saq-world-wilderness-v3-alpha';
const workerUrl='https://example.invalid/SAQ-World/save-worker.wilderness-v3-migrationfix-20261022.js?plannedReview=1&worldCombat=1&sitePopulation=1&plan=alpha&wildernessV3=1';
assert.equal(resolveWildernessV3WorkerDatabaseName(workerUrl,originalWorkerDb),newCampaignDb);
assert.equal(resolveWildernessV3WorkerDatabaseName(workerUrl.replace('wildernessV3=1','wildernessV3=0'),originalWorkerDb),originalWorkerDb);
assert.throws(()=>resolveWildernessV3WorkerDatabaseName('https://example.invalid/worker.js?wildernessV3=1&plan=alpha',originalWorkerDb),/missing valid planned campaign namespace/);
assert.throws(()=>resolveWildernessV3WorkerDatabaseName('https://example.invalid/worker.js?plannedReview=1&wildernessV3=1&plan=%2F',originalWorkerDb),/missing valid planned campaign namespace/);
// Verify actual Worker constructor announces the database it will use.
const posted=[];
const fakeEnvironment={
  location:{href:workerUrl},indexedDB:{open(){throw Error('no IndexedDB work expected during Worker boot');}},
  performance:{now:()=>0},crypto:{subtle:{digest(){throw Error('no digest expected during Worker boot');}}},
  fetch(){throw Error('no fetch expected during Worker boot');},postMessage:(msg)=>posted.push(msg)
};
startActivitySaveWorker(fakeEnvironment);
assert.deepEqual(posted,[{ready:true,databaseName:newCampaignDb}]);

const clientSource=readFileSync(new URL('../src/entrypoints/playable_browser.js',import.meta.url),'utf8');
assert.match(clientSource,/plannedNamespace=environment\.document\.body\.dataset\.wildernessV3==='true'\?'saq-world-wilderness-v3-'/);
assert.match(clientSource,/workerUrl\.searchParams\.set\('wildernessV3','1'\)/);
assert.match(clientSource,/expectedDatabaseName:environment\.document\.body\.dataset\.wildernessV3==='true'\?databaseName:null/g);

function mockWorker(){return {sent:[],terminated:false,postMessage(p){this.sent.push(p);},terminate(){this.terminated=true;}};}
// Any mismatched Worker must fail WITHOUT dispatching a database operation.
const wrongWorld=mockWorker(),wrongWorldBridge=createWorldWorkerBridgeD9(wrongWorld,{expectedDatabaseName:newCampaignDb,now:()=>0});
const worldRequest=wrongWorldBridge.open('campaign:fixture');
wrongWorld.onmessage({data:{ready:true,databaseName:originalWorkerDb}});
await assert.rejects(worldRequest,/Worker campaign database mismatch/);
assert.equal(wrongWorld.sent.length,0);
const wrongActivity=mockWorker(),wrongActivityBridge=createActivitySaveBridge(wrongActivity,{expectedDatabaseName:newCampaignDb});
const activityRequest=wrongActivityBridge.commit({sentinel:'test'});
wrongActivity.onmessage({data:{ready:true,databaseName:originalWorkerDb}});
await assert.rejects(activityRequest,/Worker campaign database mismatch/);
assert.equal(wrongActivity.sent.length,0);

const goodWorld=mockWorker(),goodWorldBridge=createWorldWorkerBridgeD9(goodWorld,{expectedDatabaseName:newCampaignDb,now:()=>0});
const goodPromise=goodWorldBridge.open('campaign:fixture');
goodWorld.onmessage({data:{ready:true,databaseName:newCampaignDb}});
assert.equal(goodWorld.sent[0].kind,'world.open');
goodWorld.onmessage({data:{id:goodWorld.sent[0].id,result:null}});
assert.equal(await goodPromise,null);

// The exact screenshot error is thrown when the worker reads an EMPTY wrong
// database. This negative control exercises the actual migration gate.
const missing=createWorldSaveTaskD9({store:{
  worldPages:{readRoot:async()=>null},loadLatestCheckpoint:async()=>null
},sha256:async()=>[]});
const result=await missing.commit({state:{campaign:{campaignId:'test'}},expectedRoot:null,checkpointId:'test'});
assert.equal(result.status,'aborted');
assert.equal(result.reason,'Missing historical migration cut');

console.log('PASS Wilderness V3: same browser/Worker DB, explicit startup handshake, mismatches fail before any save operation; old migration error reproduced by negative control.');
