// A bounded Worker queue for D9 cold generation/page I/O. It never owns players,
// simulation ticks, exploration, content activation, or reward calculations.
// Legacy diagnosis markers: active=queue.shift();try{worker.postMessage(active.packet);}
// const job=active;active=null;
export function createWorldWorkerBridgeD9(worker,{record=()=>{},diagnostics=false,now=()=>performance.now()}={}){
 const queue=[],requestDiagnostics={},requestCounts={};let active=null,ready=false,closed=false,sequence=0;
 function fail(error){closed=true;active?.reject(error);active=null;for(const job of queue.splice(0))job.reject(error);}
 function pump(){if(!ready||closed||active||!queue.length)return;active=queue.shift();try{const at=now();worker.postMessage(active.packet);record('worker.postMessage',now()-at);}catch(e){fail(e);}}
 worker.onmessage=({data})=>{
  if(data.ready===true){ready=true;pump();return;}if(!active||data.id!==active.packet.id)return;
  const job=active;active=null;for(const t of data.timings??[]){record(t.name,t.ms);if(t.name==='worldWorkerTotal')record('worker.'+job.packet.kind.replace('world.',''),t.ms);}
  if(data.error){const error=new Error(data.error);if(data.code)error.code=data.code;if(data.actorGeometry)error.actorGeometry=data.actorGeometry;if(data.stack)error.stack=data.stack;job.reject(error);}else job.resolve(data.result);pump();
 };
 worker.onerror=worker.onmessageerror=()=>fail(new Error('D9 world Worker interrupted; the last confirmed root remains recoverable.'));
 function send(kind,request){
  if(closed)return Promise.reject(new Error('D9 world Worker is closed'));
  if(queue.length+(active?1:0)>=8)return Promise.reject(new Error('D9 world Worker queue admission exceeded'));
  requestCounts[kind]=(requestCounts[kind]??0)+1;if((typeof diagnostics==='function'?diagnostics():diagnostics)&&(requestCounts[kind]===1||requestCounts[kind]%64===0||!requestDiagnostics[kind])){const at=now(),encoder=new TextEncoder(),fields={};for(const [key,value] of Object.entries(request))fields[key]=encoder.encode(JSON.stringify(value)).byteLength;const bytes=encoder.encode(JSON.stringify(request)).byteLength;requestDiagnostics[kind]={bytes,fields,at,sample:requestCounts[kind]};record('worker.requestInspect',now()-at);}
  return new Promise((resolve,reject)=>{queue.push({packet:{id:++sequence,kind,request},resolve,reject});pump();});
 }
 return Object.freeze({bindPlanned:request=>send('world.bindPlanned',request),collect:()=>send('world.collect',{}),prepareNavigation:request=>send('world.prepareNavigation',request),mapWindow:request=>send('world.mapWindow',request),generate:request=>send('world.generate',request),siteClues:request=>send('world.siteClues',request),siteBootstrap:request=>send('world.siteBootstrap',request),siteReservations:request=>send('world.siteReservations',request),siteRegionReservations:request=>send('world.siteRegionReservations',request),prepareResidency:request=>send('world.prepareResidency',request),prepareEncounters:request=>send('world.prepareEncounters',request),prepareDeadlines:request=>send('world.prepareDeadlines',request),prepareGround:request=>send('world.prepareGround',request),publish:request=>send('world.publish',request),open:campaignId=>send('world.open',{campaignId}),commit:request=>send('world.commit',request),reconcile:()=>send('world.reconcile',{}),readRoot:campaignId=>send('world.readRoot',{campaignId}),readPage:id=>send('world.readPage',{id}),inspect:()=>({queued:queue.length,active:Boolean(active),ready,closed,requestDiagnostics:{...requestDiagnostics},requestCounts:{...requestCounts}}),destroy(){worker.terminate();fail(new Error('D9 world Worker closed'));}});
}
