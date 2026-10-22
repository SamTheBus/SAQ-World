// Only the browser composition supplies the worker capability. No simulation imports.
export function createActivitySaveBridge(worker,{record=()=>{},now=null,expectedDatabaseName=null}={}){
  let sequence=0,pending=null,failed=false,ready=false;
  const post=packet=>{if(!now)return worker.postMessage(packet);const start=now();try{return worker.postMessage(packet);}finally{record('saveWorkerHandoff',now()-start);}};
  worker.onmessage=({data})=>{if(data.ready===true){if(expectedDatabaseName!==null&&data.databaseName!==expectedDatabaseName){failed=true;if(pending){pending.reject(new Error('Save Worker campaign database mismatch; existing saves remain untouched'));pending=null;}return;}ready=true;if(pending)post(pending.packet);return;}if(!pending||data.id!==pending.id)return;const request=pending;pending=null;
    for(const entry of data.timings??[])record(entry.name,entry.ms);
    if(data.error)request.reject(new Error(data.error));else request.resolve(data.result);};
  worker.onerror=worker.onmessageerror=()=>{failed=true;if(pending){pending.reject(new Error('Save worker interrupted; reopen the last confirmed campaign.'));pending=null;}};
  function send(kind,request){if(failed)return Promise.reject(new Error('Save worker unavailable; reopen the last confirmed campaign.'));if(pending)return Promise.reject(new Error('Save task already pending'));return new Promise((resolve,reject)=>{
    pending={id:++sequence,resolve,reject,packet:{id:sequence,kind,request}};try{if(ready)post(pending.packet);}catch(error){pending=null;reject(error);}});}
  return Object.freeze({commit:request=>send('commit',request),reconcile:()=>send('reconcile'),destroy:()=>worker.terminate()});
}
