import {createEnvironmentLayout,prepareEnvironmentLayout,obstacleTileVisualId,obstacleTileVisualCoverage} from './environment_layout.js';
import {environmentWorldOffset,environmentIdentity,drawCanopy,drawFlower,flowerMotion} from './environment_motifs.js';
import {celShadeContext} from './cel_materials_v1.js';

// Same 256px artwork, prepared a tile at a time ahead of the viewport.
export function createEnvironmentCache(canvas,{diagnostics=null,prepareDrawing,prepareDepthItems=null,drawFallback=null,drawRequiredObstacle=null}={}){
 if(drawFallback){const paint=drawFallback;drawFallback=(c,...args)=>paint(celShadeContext(c,{mode:'world'}),...args);}
 const SIZE=256,BASE_LIMIT=32,MAX_LIMIT=128,DESCRIPTORS=64,PREFETCH=8,RECENT=24,LAYOUTS=4;
 const pages=new Map(),fallbacks=new Map(),descriptors=new Map(),layouts=new Map(),stamps=new Map(),flowerStamps=[],rasterPool=[];
 const win=canvas.ownerDocument.defaultView??globalThis;
 let lastView=null,travelX=0,travelY=0;
 let layoutJob=null,activeJob=null,planKey=null,planVisual=null,key=null,scaleKey=null,queue=[],pending=null,generation=0,visualGeneration=0,rasterGeneration=0,currentVisual=null,frameSequence=0,visibleIds=new Set(),preloadIds=new Set(),recentIds=new Set(),recentSeen=new Map(),protectedIds=new Set(),lastFlowers=[],requiredTasks=[],builds=0,created=0,worstBuildMs=0,descriptorReuses=0,retentionHits=0,peakNeeded=0,peakPrefetched=0,capacity=BASE_LIMIT,evictions=0,misses=0,fallbackBuilds=0,fallbackHits=0,peakFallbackPages=0,visibleRasterPages=0,fallbackPages=0,activeColliderVisuals=0,missingColliderVisuals=0,underCoveredColliderVisuals=0,lastColliderRepair=null,lastColliderAudit=null,lastRasterLifecycle=null,staleRasterDiscards=0,atomicRasterReplacements=0,rasterCompletenessRepairs=0,clearCount=0,lastClearReason='none',lastMissReason='none',clearReasons=Object.create(null);
 const emit=(kind,values={})=>{if(diagnostics)diagnostics({kind,at:performance.now(),...values});};
 const art={tree(ctx,x,y,size,n){const variant=n%12;let tile=stamps.get(variant);if(!tile){tile=canvas.ownerDocument.createElement('canvas');tile.width=128;tile.height=128;drawCanopy(celShadeContext(tile.getContext('2d'),{mode:'world'}),0,0,128,variant);stamps.set(variant,tile);}ctx.drawImage(tile,x,y,size,size);}};
 const touch=(map,id,value)=>{map.delete(id);map.set(id,value);};
 function releaseRaster(raster){if(!raster)return;rasterPool.push(raster);while(rasterPool.length>RECENT)rasterPool.shift();}
 function clear(reason='manual'){clearCount++;lastClearReason=reason;clearReasons[reason]=(clearReasons[reason]??0)+1;emit('clear',{reason,pages:pages.size,descriptors:descriptors.size,layouts:layouts.size,protected:protectedIds.size});generation++;if(pending!==null){if(win.requestIdleCallback)win.cancelIdleCallback(pending);else win.clearTimeout(pending);}pending=null;queue=[];if(activeJob)releaseRaster(activeJob.raster);activeJob=null;layoutJob=null;pages.clear();fallbacks.clear();rasterPool.length=0;descriptors.clear();layouts.clear();visibleIds.clear();preloadIds.clear();recentIds.clear();recentSeen.clear();protectedIds.clear();key=null;scaleKey=null;planKey=null;planVisual=null;currentVisual=null;lastFlowers=[];requiredTasks=[];lastView=null;travelX=travelY=0;capacity=BASE_LIMIT;visibleRasterPages=0;fallbackPages=0;activeColliderVisuals=0;missingColliderVisuals=0;underCoveredColliderVisuals=0;lastColliderRepair=null;lastColliderAudit=null;}
 function signature(space,x,y){const v=space.visual,t=space.collision.tileSize,ox=v.originTile?.x??0,oy=v.originTile?.y??0;let text=JSON.stringify(environmentWorldOffset(space))+'|';
  for(let row=y/t-2;row<(y+SIZE)/t+2;row++)text+=(v.terrain[row-oy]??'').slice(Math.max(0,x/t-2-ox),Math.max(0,(x+SIZE)/t+2-ox))+'|';
  for(let row=y/t-2;row<(y+SIZE)/t+2;row++)text+=(v.biomes?.[row-oy]??'').slice(Math.max(0,x/t-2-ox),Math.max(0,(x+SIZE)/t+2-ox))+'|';
  for(const b of v.blockers)if((b.x+b.width)*t>=x-64&&(b.y+b.height)*t>=y-64&&b.x*t<x+SIZE+64&&b.y*t<y+SIZE+64)text+=JSON.stringify(b);
  for(const d of v.decorations??[])if(d.x*t>=x-640&&d.y*t>=y-360&&d.x*t<x+SIZE+640&&d.y*t<y+SIZE+360)text+=JSON.stringify(d);return text;
 }
 function layoutFor(space){let layout=layouts.get(space.visual);if(layout){touch(layouts,space.visual,layout);return layout;}
  const at=performance.now();layout=createEnvironmentLayout(space);touch(layouts,space.visual,layout);while(layouts.size>LAYOUTS)layouts.delete(layouts.keys().next().value);emit('layout',{at,end:performance.now(),ms:performance.now()-at});return layout;
 }
 function obstacleVisuals(space,bounds){const found=new Map(),v=space.visual,tile=space.collision.tileSize,tileOx=v.originTile?.x??0,tileOy=v.originTile?.y??0;
  for(const b of v.blockers)if(['thicket','trees','rock','building','fence'].includes(b.kind)||(b.kind==='ruin-exterior-masonry'&&b.plannedRuinExterior===true))for(let ty=b.y;ty<b.y+b.height;ty++)for(let tx=b.x;tx<b.x+b.width;tx++){const x=tx*tile,y=ty*tile;if(x+tile<=bounds.x||y+tile<=bounds.y||x>=bounds.x+bounds.width||y>=bounds.y+bounds.height)continue;const code=v.biomes?.[ty-tileOy]?.[tx-tileOx]??(b.kind==='rock'?'r':'w'),visualKind=b.kind==='building'||b.kind==='fence'||b.plannedRuinExterior===true?'solid':code==='r'?'rock':code==='m'?'tree':'base',id=obstacleTileVisualId(b,tx,ty,visualKind),ownerPageId=Math.floor(x/SIZE)*SIZE+'/'+Math.floor(y/SIZE)*SIZE,coverageRatio=obstacleTileVisualCoverage(b,visualKind);found.set(id,{b,tx,ty,visualKind,ownerPageId,coverageRatio});}
  return found;
 }
 function startJob(task,mode){const {space,x,y,id,sig,scale}=task,at=performance.now();emit('buildStart',{id,mode});let raster=rasterPool.pop();
  // A committed page is immutable while visible. Rebuild into a separate
  // staging canvas, then replace it atomically only after coherence checks.
  if(!raster&&pages.size>=capacity){const ids=[...pages.keys()].filter(k=>k!==id&&!visibleIds.has(k)),victim=ids.find(k=>!preloadIds.has(k)&&!recentIds.has(k))??(mode==='sync'?ids.find(k=>!preloadIds.has(k))??ids[0]:undefined);if(victim!==undefined){raster=pages.get(victim).raster;pages.delete(victim);recentSeen.delete(victim);recentIds.delete(victim);evictions++;emit('evict',{id:victim,reason:'capacity',required:requiredTasks.length,protected:protectedIds.size,pages:pages.size,capacity});}}
  if(!raster){raster=canvas.ownerDocument.createElement('canvas');created++;emit('allocate',{id});}
  const pixels=Math.ceil(SIZE*scale);if(raster.width!==pixels||raster.height!==pixels){raster.width=pixels;raster.height=pixels;}
  const rc=celShadeContext(raster.getContext('2d'),{mode:'world'});let descriptor=descriptors.get(id),drawing=null,commands=null;
  if(descriptor?.signature===sig){descriptorReuses++;touch(descriptors,id,descriptor);}
  else{
   commands=[];const methods=new Map();
   // Derive exact drawing commands without rasterizing. Text measurement uses
   // the real font metrics; all accepted geometry and motif calls are unchanged.
   const recording=new Proxy(rc,{set(target,name,value){commands.push(['=',[name,value]]);target[name]=value;return true;},get(target,name){const value=target[name];if(typeof value!=='function')return value;if(!methods.has(name))methods.set(name,(...args)=>{if(name==='measureText')return value.apply(target,args);commands.push([name,args]);});return methods.get(name);}});
   drawing=prepareDrawing(recording,space,{x,y,width:SIZE,height:SIZE},layoutFor(space),art);

  }
  rc.resetTransform();rc.clearRect(0,0,pixels,pixels);rc.scale(pixels/SIZE,pixels/SIZE);rc.translate(-x,-y);
  lastRasterLifecycle={phase:'staging',pageId:id,visualGeneration:task.visualGeneration,signature:sig};emit('stage',{id,visualGeneration:task.visualGeneration});return {task,mode,raster,rc,descriptor,drawing,commands,index:0,at,cpu:performance.now()-at};
 }
 function advance(job,complete=false){const start=performance.now(),{rc}=job;
  if(job.drawing){let next;do{next=job.drawing.next();}while(!next.done&&(complete||performance.now()-start<2));
   if(next.done){job.descriptor={signature:job.task.sig,commands:job.commands,result:next.value};job.drawing=null;touch(descriptors,job.task.id,job.descriptor);while(descriptors.size>DESCRIPTORS)descriptors.delete(descriptors.keys().next().value);}
   const ms=performance.now()-start;job.cpu+=ms;emit('descriptor',{id:job.task.id,ms});if(!complete)return false;
  }
  const descriptor=job.descriptor,rasterStart=performance.now();
  while(job.index<descriptor.commands.length){const [method,args]=descriptor.commands[job.index++];if(method==='=')rc[args[0]]=args[1];else rc[method](...args);
   if(!complete&&job.index%32===0&&performance.now()-rasterStart>=2)break;
  }
  const ms=performance.now()-rasterStart;job.cpu+=ms;emit('raster',{id:job.task.id,ms});if(job.index<descriptor.commands.length)return false;
  const {id,sig,space}=job.task;
  if(job.task.visualGeneration!==visualGeneration||space.visual!==currentVisual){staleRasterDiscards++;lastRasterLifecycle={phase:'discarded-stale',pageId:id,jobVisualGeneration:job.task.visualGeneration,currentVisualGeneration:visualGeneration,signature:sig};emit('staleDiscard',lastRasterLifecycle);releaseRaster(job.raster);return true;}
  const expected=obstacleVisuals(space,{x:job.task.x,y:job.task.y,width:SIZE,height:SIZE}),recorded=new Set(descriptor.result.obstacleVisualIds??[]);let repaired=0;
  for(const [visualId,o] of expected)if(o.ownerPageId===id&&!recorded.has(visualId)){drawRequiredObstacle?.(rc,space,o.b,o.tx,o.ty);recorded.add(visualId);repaired++;}
  const result=repaired?{...descriptor.result,obstacleVisualIds:[...recorded]}:descriptor.result;if(repaired)rasterCompletenessRepairs+=repaired;
  const replaced=pages.get(id);touch(pages,id,{raster:job.raster,signature:sig,visual:space.visual,visualGeneration,rasterGeneration:++rasterGeneration,result});fallbacks.delete(id);if(replaced?.raster&&replaced.raster!==job.raster){releaseRaster(replaced.raster);atomicRasterReplacements++;}
  builds++;worstBuildMs=Math.max(worstBuildMs,job.cpu);lastRasterLifecycle={phase:'installed',pageId:id,visualGeneration,rasterGeneration,signature:sig,requiredVisuals:expected.size,completenessRepairs:repaired};emit('insert',lastRasterLifecycle);emit('build',{id,mode:job.mode,reason:job.task.missReason??'prefetch',at:job.at,end:performance.now(),ms:job.cpu});return true;
 }
 function build(task,mode){const existing=activeJob?.task.id===task.id&&activeJob.task.sig===task.sig?activeJob:null;const job=existing??startJob(task,mode);if(!job)return false;advance(job,true);if(existing)activeJob=null;return true;}
 function schedule(){if(pending!==null||(!queue.length&&!activeJob))return;const token=generation;
  const run=()=>{pending=null;if(token!==generation)return;
   if(activeJob){if(advance(activeJob))activeJob=null;schedule();return;}
   const task=queue[0];if(!task)return;
   // Layout, command derivation and raster slices get separate opportunities.
   if(!descriptors.has(task.id)&&!layouts.has(task.space.visual)){
    if(layoutJob?.visual!==task.space.visual)layoutJob={visual:task.space.visual,work:prepareEnvironmentLayout(task.space)};
    const at=performance.now();let next;do{next=layoutJob.work.next();}while(!next.done&&performance.now()-at<2);
    if(next.done){touch(layouts,task.space.visual,next.value);while(layouts.size>LAYOUTS)layouts.delete(layouts.keys().next().value);layoutJob=null;}
    emit('layout',{at,end:performance.now(),ms:performance.now()-at});schedule();return;
   }
   queue.shift();const existing=pages.get(task.id);if(existing?.signature!==task.sig)activeJob=startJob(task,'prefetch');schedule();
  };
  pending=win.requestIdleCallback?win.requestIdleCallback(run,{timeout:16}):win.setTimeout(run,0);
 }
 function draw(ctx,space,view,renderScale=1){
  const nextKey=environmentIdentity(space)+'/'+space.exits.map(e=>e.x+'/'+e.y+'/'+e.label).join('|');if(key!==nextKey||scaleKey!==renderScale){const reason=key===null?'initial':key!==nextKey?'visual-identity-change':'render-scale-change';clear(reason);key=nextKey;scaleKey=renderScale;}
  if(currentVisual!==space.visual){currentVisual=space.visual;visualGeneration++;emit('visualGeneration',{visualGeneration});}
  if(lastView){const dx=view.x-lastView.x,dy=view.y-lastView.y;if(dx||dy){travelX=Math.sign(dx);travelY=Math.sign(dy);}}lastView={x:view.x,y:view.y};
  frameSequence++;const endless=space.collision.endless,required=[],requiredObstacleIds=obstacleVisuals(space,view),x0=(endless?Math.floor(view.x/SIZE):Math.max(0,Math.floor(view.x/SIZE)))*SIZE,y0=(endless?Math.floor(view.y/SIZE):Math.max(0,Math.floor(view.y/SIZE)))*SIZE;
  const xmax=endless?view.x+view.width+SIZE*2:space.collision.width*32,ymax=endless?view.y+view.height+SIZE*2:space.collision.height*32;
  for(let y=y0;y<view.y+view.height&&y<ymax;y+=SIZE)for(let x=x0;x<view.x+view.width&&x<xmax;x+=SIZE)required.push({x,y,id:x+'/'+y});
  const nextVisible=new Set(required.map(t=>t.id)),returnedIds=new Set([...nextVisible].filter(id=>recentSeen.has(id)));for(const id of visibleIds)if(!nextVisible.has(id)&&pages.has(id))recentSeen.set(id,frameSequence);for(const id of nextVisible)recentSeen.delete(id);visibleIds=nextVisible;
  for(const id of [...recentSeen.keys()])if(!pages.has(id))recentSeen.delete(id);recentIds=new Set([...recentSeen].sort((a,b)=>b[1]-a[1]).slice(0,RECENT).map(([id])=>id));for(const id of [...recentSeen.keys()])if(!recentIds.has(id))recentSeen.delete(id);
  protectedIds=new Set([...visibleIds,...preloadIds,...recentIds]);capacity=Math.min(MAX_LIMIT,Math.max(BASE_LIMIT,required.length+PREFETCH+RECENT));while(pages.size>capacity){const victim=[...pages.keys()].find(k=>!protectedIds.has(k));if(victim===undefined)break;releaseRaster(pages.get(victim).raster);pages.delete(victim);recentSeen.delete(victim);evictions++;emit('evict',{id:victim,reason:'capacity-trim',required:required.length,protected:protectedIds.size,pages:pages.size,capacity});}peakNeeded=Math.max(peakNeeded,required.length);lastFlowers=[];requiredTasks=[];visibleRasterPages=0;fallbackPages=0;const visibleObstacleIds=new Map();let paintedTerrainTiles=0,paintedBlockers=0;
  for(const t of required){let entry=pages.get(t.id);const sig=entry?.visual===space.visual?entry.signature:signature(space,t.x,t.y);
   if(!entry||entry.signature!==sig){const missReason=!entry?'page-absent':entry.visual!==space.visual?'visual-projection-change':'signature-change',task={...t,space,sig,scale:renderScale,missReason,visualGeneration};requiredTasks.push(task);if(!queue.some(q=>q.id===task.id&&q.sig===task.sig)){queue.unshift(task);queue=queue.slice(0,PREFETCH);}schedule();
    fallbackPages++;let fallback=fallbacks.get(t.id),result;
    if(!fallback||fallback.signature!==sig||fallback.scale!==renderScale){misses++;lastMissReason=missReason;emit('miss',{id:t.id,reason:missReason,required:required.length,protected:protectedIds.size,pages:pages.size});const raster=canvas.ownerDocument.createElement('canvas'),pixels=Math.ceil(SIZE*renderScale);raster.width=pixels;raster.height=pixels;const rc=raster.getContext('2d');rc.scale(pixels/SIZE,pixels/SIZE);rc.translate(-t.x,-t.y);result=drawFallback?.(rc,space,{x:t.x,y:t.y,width:SIZE,height:SIZE});fallback={raster,signature:sig,scale:renderScale,result};fallbacks.set(t.id,fallback);fallbackBuilds++;}
    else{result=fallback.result;fallbackHits++;}
    ctx.save();ctx.beginPath();ctx.rect(t.x,t.y,SIZE,SIZE);ctx.clip();ctx.drawImage(fallback.raster,t.x,t.y,SIZE,SIZE);ctx.restore();
    if(result){paintedTerrainTiles+=result.paintedTerrainTiles;paintedBlockers+=result.paintedBlockers;for(const id of result.obstacleVisualIds??[])if(requiredObstacleIds.get(id)?.ownerPageId===t.id)visibleObstacleIds.set(id,{pageId:t.id,visualGeneration,source:'fallback'});}continue;
   }else{if(returnedIds.has(t.id))retentionHits++;entry.visual=space.visual;entry.visualGeneration=visualGeneration;emit('hit',{id:t.id});}
   if(entry){visibleRasterPages++;touch(pages,t.id,entry);const at=diagnostics?performance.now():0;ctx.drawImage(entry.raster,t.x,t.y,SIZE,SIZE);emit('compose',{id:t.id,ms:diagnostics?performance.now()-at:0});paintedTerrainTiles+=entry.result.paintedTerrainTiles;paintedBlockers+=entry.result.paintedBlockers;lastFlowers.push(...entry.result.flowers);for(const id of entry.result.obstacleVisualIds??[])if(requiredObstacleIds.get(id)?.ownerPageId===t.id)visibleObstacleIds.set(id,{pageId:t.id,visualGeneration:entry.visualGeneration,rasterGeneration:entry.rasterGeneration,source:'raster'});}
  }
  peakFallbackPages=Math.max(peakFallbackPages,fallbackPages);const v=space.visual;
  activeColliderVisuals=requiredObstacleIds.size;missingColliderVisuals=0;underCoveredColliderVisuals=0;for(const [id,o] of requiredObstacleIds){const presented=visibleObstacleIds.get(id),coverageCoherent=o.coverageRatio>=.8,coherent=presented?.pageId===o.ownerPageId&&presented.visualGeneration===visualGeneration&&coverageCoherent;lastColliderAudit={id,obstacleId:o.b.id??null,footprint:{x:o.b.x,y:o.b.y,width:o.b.width,height:o.b.height},tile:{x:o.tx,y:o.ty},coverageRatio:o.coverageRatio,minimumCoverage:.8,ownerPageId:o.ownerPageId,visualGeneration,presented:presented??null,coherent};if(coherent)continue;missingColliderVisuals++;if(!coverageCoherent)underCoveredColliderVisuals++;const ownerDescriptor=descriptors.get(o.ownerPageId),ownerRaster=pages.get(o.ownerPageId),descriptorPresent=ownerDescriptor?.result?.obstacleVisualIds?.includes(id)??false,rasterPresent=ownerRaster?.result?.obstacleVisualIds?.includes(id)??false;drawRequiredObstacle?.(ctx,space,o.b,o.tx,o.ty);visibleObstacleIds.set(id,{pageId:o.ownerPageId,visualGeneration,source:'local-repair'});lastColliderRepair={...lastColliderAudit,descriptorPresent,rasterPresent,ownerRasterGeneration:ownerRaster?.rasterGeneration??null,ownerVisualGeneration:ownerRaster?.visualGeneration??null,fallbackConsideredPresent:presented?.source==='fallback'};emit('colliderVisualRepair',lastColliderRepair);}
  // One nearby ring, nearest to the actual view first; never expand beyond it.
  const nextPlan=x0+'/'+y0+'/'+Math.floor((view.x+view.width)/SIZE)+'/'+Math.floor((view.y+view.height)/SIZE)+'/'+travelX+'/'+travelY;
  if(planKey===nextPlan&&planVisual===v)return {paintedTerrainTiles,paintedBlockers,totalTerrainTiles:space.collision.width*space.collision.height};
  planKey=nextPlan;planVisual=v;
  const ox=(v.originTile?.x??0)*32,oy=(v.originTile?.y??0)*32,right=ox+(v.terrain[0]?.length??0)*32,bottom=oy+v.terrain.length*32,candidates=[];
  for(let y=endless?y0-SIZE:Math.max(0,y0-SIZE);y<=Math.min(ymax-1,view.y+view.height+SIZE);y+=SIZE)for(let x=endless?x0-SIZE:Math.max(0,x0-SIZE);x<=Math.min(xmax-1,view.x+view.width+SIZE);x+=SIZE){const id=x+'/'+y;if(visibleIds.has(id))continue;
   // Only prepare tiles whose placement halo is present in the supplied projection.
   if(endless?(x-64<ox||y-64<oy||x+SIZE+64>right||y+SIZE+64>bottom):(x-64<Math.max(0,ox)&&ox>0||y-64<Math.max(0,oy)&&oy>0||x+SIZE+64>right&&right<xmax||y+SIZE+64>bottom&&bottom<ymax))continue;
   const entry=pages.get(id),sig=entry?.visual===v?entry.signature:signature(space,x,y);if(entry?.signature===sig)continue;
   const distance=Math.max(0,view.x-x-SIZE,x-view.x-view.width)+Math.max(0,view.y-y-SIZE,y-view.y-view.height);const ahead=(x+SIZE/2-view.x-view.width/2)*travelX+(y+SIZE/2-view.y-view.height/2)*travelY;
   candidates.push({id,x,y,space,sig,scale:renderScale,distance:distance-(ahead>0?SIZE:0),visualGeneration});
  }
  candidates.sort((a,b)=>a.distance-b.distance||a.y-b.y||a.x-b.x);const urgent=queue.filter(q=>visibleIds.has(q.id)),planned=[];
  for(const task of [...urgent,...candidates])if(!planned.some(q=>q.id===task.id))planned.push(task);queue=planned.slice(0,PREFETCH);preloadIds=new Set(queue.map(task=>task.id));protectedIds=new Set([...visibleIds,...preloadIds,...recentIds]);peakPrefetched=Math.max(peakPrefetched,queue.length);schedule();
  return {paintedTerrainTiles,paintedBlockers,totalTerrainTiles:space.collision.width*space.collision.height};
 }
 function drawFlowers(ctx,view,time){let count=0;for(const f of lastFlowers){if(count>=96)break;if(f.x<view.x||f.y<view.y||f.x>view.x+view.width||f.y>view.y+view.height)continue;const color=f.n%6;let tile=flowerStamps[color];if(!tile){tile=canvas.ownerDocument.createElement('canvas');tile.width=32;tile.height=32;const c=tile.getContext('2d');c.scale(2,2);drawFlower(c,8,13,color);flowerStamps[color]=tile;}
   const motion=flowerMotion(f.motionX??f.x,f.motionY??f.y,f.n,time);ctx.save();ctx.translate(f.x,f.y);ctx.transform(1,0,motion,1,0,0);ctx.drawImage(tile,-8,-13,16,16);ctx.restore();count++;
  }return count;
 }
 function prepareVisible(){
  if(pending!==null){if(win.requestIdleCallback)win.cancelIdleCallback(pending);else win.clearTimeout(pending);pending=null;}
  for(const task of requiredTasks)if(pages.get(task.id)?.signature!==task.sig)build(task,'sync');
  queue=queue.filter(task=>!protectedIds.has(task.id));requiredTasks=[];activeJob=null;schedule();return true;
 }
 return Object.freeze({draw,drawFlowers,depthItems:(space,view,time)=>prepareDepthItems?.(space,view,layoutFor(space),art,time)??[],prepareVisible,clear,resources:()=>({overworldRasterPages:pages.size,overworldRasterBytes:[...pages.values()].reduce((n,p)=>n+p.raster.width*p.raster.height*4,0),environmentRetainedCanvasBytes:[...pages.values()].reduce((n,p)=>n+p.raster.width*p.raster.height*4,0)+[...fallbacks.values()].reduce((n,p)=>n+(p.raster?.width??0)*(p.raster?.height??0)*4,0)+rasterPool.reduce((n,c)=>n+c.width*c.height*4,0)+[...stamps.values(),...flowerStamps.filter(Boolean)].reduce((n,c)=>n+c.width*c.height*4,0),overworldRasterBuilds:builds,overworldRasterCanvasesCreated:created,overworldRasterEvictions:evictions,environmentRasterMisses:misses,environmentFallbackBuilds:fallbackBuilds,environmentFallbackHits:fallbackHits,environmentFallbackCachePages:fallbacks.size,environmentLastMissReason:lastMissReason,environmentCacheClears:clearCount,environmentLastClearReason:lastClearReason,environmentClearReasons:{...clearReasons},environmentProtectedRasters:protectedIds.size,environmentVisibleRetained:visibleIds.size,environmentPreloadRetained:preloadIds.size,environmentRecentRetained:recentIds.size,environmentRetentionHits:retentionHits,visibleRasterPages,fallbackRasterPages:fallbackPages,environmentPeakFallbackPages:peakFallbackPages,activeColliderVisuals,missingColliderVisuals,underCoveredColliderVisuals,lastColliderAudit,lastColliderRepair,lastRasterLifecycle,environmentVisualGeneration:visualGeneration,environmentRasterGeneration:rasterGeneration,environmentStaleRasterDiscards:staleRasterDiscards,environmentAtomicRasterReplacements:atomicRasterReplacements,environmentRasterCompletenessRepairs:rasterCompletenessRepairs,environmentArtStamps:stamps.size+flowerStamps.filter(Boolean).length,environmentDescriptorTiles:descriptors.size,environmentDescriptorCommands:[...descriptors.values()].reduce((n,d)=>n+d.commands.length,0),environmentDescriptorReuses:descriptorReuses,environmentLayoutPages:layouts.size,environmentRequiredMissing:requiredTasks.length,environmentPrefetchQueued:queue.length,environmentPrefetchActive:Boolean(activeJob||layoutJob||pending!==null),environmentPeakNeeded:peakNeeded,environmentPeakPrefetch:peakPrefetched,environmentRasterLimit:capacity,environmentRasterMaximum:MAX_LIMIT,environmentDescriptorLimit:DESCRIPTORS,environmentPrefetchLimit:PREFETCH,environmentRecentLimit:RECENT})});
}
