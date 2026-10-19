import {drawPlannedCartographyV2,PLANNED_MAP_MAX_LEVEL} from './planned_cartography_v2.js';
import {D9_RUNTIME_POLICY as B} from '../shared/content/world_runtime_policy_d9.js';
import {normalizeWorldPosition,floorDiv} from '../shared/contracts/world_address.js';
import {formatLarge} from '../shared/contracts/large_number.js';

const UNKNOWN='#090712';
const TERRAIN={o:'#477652',w:'#33714f',r:'#77715e',m:'#37695f',a:'#819552',d:'#bcaa7a',s:'#b8cbd0',t:'#236347',l:'#555057',O:'#23536a',W:'#4b8b8d',L:'#326d76'};
const CARTOGRAPHY_STYLE='world-cartography-d9-v1',MINIMAP_PIXEL_RATIO=2,MINIMAP_CACHE_PADDING_PX=64,MINIMAP_RECENTER_SCREEN_PX=32;

export function mapViewportD9(center,level,width,height,scale){
 const size=1n<<BigInt(level),cx=floorDiv(BigInt(center.chunkX),size),cy=floorDiv(BigInt(center.chunkY),size),cellW=1024*Number(size)*scale,cellH=832*Number(size)*scale;
 const localX=(Number(BigInt(center.chunkX)-cx*size)*1024+center.localX)*scale,localY=(Number(BigInt(center.chunkY)-cy*size)*832+center.localY)*scale;
 const left=Math.floor((localX-width/2)/cellW),top=Math.floor((localY-height/2)/cellH),right=Math.floor((localX+width/2)/cellW),bottom=Math.floor((localY+height/2)/cellH);
 return {x:String(cx+BigInt(left)),y:String(cy+BigInt(top)),width:right-left+1,height:bottom-top+1,level,cellW,cellH,screenX:width/2+left*cellW-localX,screenY:height/2+top*cellH-localY};
}
export function panMapD9(center,dx,dy,scale){return normalizeWorldPosition({...center,localX:center.localX-dx/scale,localY:center.localY-dy/scale});}
export function worldScreenDeltaD9(position,anchor,scale){return {x:(Number(BigInt(position.chunkX)-BigInt(anchor.chunkX))*1024+position.localX-anchor.localX)*scale,y:(Number(BigInt(position.chunkY)-BigInt(anchor.chunkY))*832+position.localY-anchor.localY)*scale};}

function addLandBlob(ctx,x,y,w,h,px,py){
 const n=Math.imul(px+17,73856093)^Math.imul(py+29,19349663),jx=((n>>>3)&3)-1.5,jy=((n>>>7)&3)-1.5;
 ctx.ellipse(x+w/2+jx*w*.035,y+h/2+jy*h*.035,w*.79,h*.79,((n>>>11)&7)*.025,0,Math.PI*2);
}
function addJoinedKnowledge(ctx,page,x,y,cw,ch,cols,rows,predicate){
 for(let py=0;py<rows;py++)for(let px=0;px<cols;px++){
  const index=py*cols+px;if(!predicate(page.tiles[index]))continue;addLandBlob(ctx,x+px*cw,y+py*ch,cw,ch,px,py);
  if(px+1<cols&&predicate(page.tiles[index+1]))ctx.rect(x+(px+.45)*cw,y+(py+.16)*ch,cw*1.1,ch*.68);
  if(py+1<rows&&predicate(page.tiles[index+cols]))ctx.rect(x+(px+.16)*cw,y+(py+.45)*ch,cw*.68,ch*1.1);
 }
}
function addRoadShape(ctx,road,x,y,cw,ch,radius){
 for(const key of road){const [px,py]=key.split(',').map(Number);ctx.roundRect(x+px*cw-radius*.35,y+py*ch-radius*.35,cw+radius*.7,ch+radius*.7,radius);}
}

// Map paint consumes only already-revealed page cells. Expanded, overlapping
// cel-shaded blobs generalize the stored samples into cartography without
// exposing the tile/chunk lattice or consulting procedural geography.
export function drawCartographyD9(ctx,{pages,pending=[],viewport,width,height,scale=1,level=0,boundSite=null,boundSitesById=null,navigableSitesById=null,planned=false}){
 ctx.fillStyle=UNKNOWN;ctx.fillRect(0,0,width,height);
 const byKey=new Map(pages.filter(p=>p.level===level).map(p=>[p.chunkX+','+p.chunkY,p]));
 if(level===0)for(const p of pending){const key=p.chunkX+','+p.chunkY,old=byKey.get(key);byKey.set(key,{...p,level:0,tiles:[...p.tiles].map((c,i)=>c==='?'?old?.tiles[i]??'?':c).join(''),markers:[...(old?.markers??[]),...p.markers]});}
 const visible=[],markers=[];
 for(const page of byKey.values()){
  const dx=BigInt(page.chunkX)-BigInt(viewport.x),dy=BigInt(page.chunkY)-BigInt(viewport.y);if(dx<0n||dy<0n||dx>=BigInt(viewport.width)||dy>=BigInt(viewport.height))continue;
  const x=viewport.screenX+Number(dx)*viewport.cellW,y=viewport.screenY+Number(dy)*viewport.cellH,cols=level===0?32:8,rows=level===0?26:8,cw=viewport.cellW/cols,ch=viewport.cellH/rows;
  visible.push({page,x,y,w:viewport.cellW,h:viewport.cellH});
  if(planned){drawPlannedCartographyV2(ctx,page,x,y,cw,ch,cols,rows,(px,py,channel)=>{const dx=Math.floor(px/cols),dy=Math.floor(py/rows),next=byKey.get(String(BigInt(page.chunkX)+BigInt(dx))+','+String(BigInt(page.chunkY)+BigInt(dy))),index=((py%rows+rows)%rows)*cols+(px%cols+cols)%cols;return next?.[channel]?.[index]??(channel==='features'?next?.tiles?.[index]:null)??'?';});}else{ctx.beginPath();addJoinedKnowledge(ctx,page,x,y,cw,ch,cols,rows,code=>code!=='?');ctx.fillStyle='#24302d';ctx.fill();
  for(const code of Object.keys(TERRAIN)){ctx.beginPath();addJoinedKnowledge(ctx,page,x,y,cw,ch,cols,rows,value=>value===code);ctx.fillStyle=TERRAIN[code];ctx.fill();}
  }
  if(level===0){
   const road=new Set();for(let py=0;py<rows;py++)for(let px=0;px<cols;px++)if(page.tiles[py*cols+px]==='p')road.add(px+','+py);
   if(road.size&&!planned){const unit=Math.min(cw,ch);ctx.beginPath();addRoadShape(ctx,road,x,y,cw,ch,Math.max(1.5,unit*.3));ctx.fillStyle='#4b3825';ctx.fill();ctx.beginPath();addRoadShape(ctx,road,x,y,cw,ch,Math.max(1,unit*.19));ctx.fillStyle='#c6aa70';ctx.fill();}
   for(const mark of page.markers){const sx=x+mark.x*scale,sy=y+mark.y*scale;if(markers.some(p=>Math.hypot(p.x-sx,p.y-sy)<14))continue;const siteMarker=mark.kind==='site',resolved=siteMarker?navigableSitesById?.[mark.id]:null;if(siteMarker&&!resolved)continue;const site=boundSitesById?.[mark.id]??(boundSite?.siteId===mark.id?boundSite:null)??resolved,matched=siteMarker&&Boolean(site),state=matched?site.state:'unidentified',identity=siteMarker?(site.label??mark.label):mark.label,status=state==='completed'?'Completed':state==='active'?'Active':'Unidentified';markers.push({x:sx,y:sy,kind:mark.kind,state:siteMarker?state:null,label:identity+(siteMarker?' · '+status:'')+(page.region?' · '+page.region.name+' · Minimum Lv. '+formatLarge(typeof page.region.minimumLevel==='number'?String(page.region.minimumLevel):page.region.minimumLevel):'')});}
  }
 }
 for(const mark of markers){ctx.save();ctx.translate(mark.x,mark.y);ctx.fillStyle=mark.kind==='ferry'?'#8ce1f1':mark.kind==='settlement'?'#ffe093':mark.state==='completed'?'#89d9a0':mark.state==='active'?'#d2a7ee':'#f0c967';ctx.strokeStyle='#17101f';ctx.lineWidth=2;if(mark.kind==='settlement'){ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(7,0);ctx.lineTo(0,7);ctx.lineTo(-7,0);ctx.closePath();}else{ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(7,0);ctx.lineTo(0,7);ctx.lineTo(-7,0);ctx.closePath();}ctx.fill();ctx.stroke();if(mark.kind==='ferry'){ctx.fillStyle='#12313a';ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('F',0,.5);}else if(mark.state==='completed'){ctx.strokeStyle='#102318';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(-3,0);ctx.lineTo(-.5,3);ctx.lineTo(4,-3);ctx.stroke();}else if(mark.state==='unidentified'){ctx.fillStyle='#33243b';ctx.font='bold 9px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('?',0,.5);}ctx.restore();}
 return {visible,markers};
}

function drawPlayer(ctx,x,y,facing,size=8){const angle=Math.atan2(facing?.y??-1,facing?.x??0)+Math.PI/2;ctx.save();ctx.translate(x,y);ctx.scale(size/8,size/8);ctx.rotate(angle);ctx.fillStyle='#fff2bd';ctx.strokeStyle='#33243b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(6,6);ctx.lineTo(0,3);ctx.lineTo(-6,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}

export function createWorldMapD9({document:doc,environment,port,releaseInput}){
 const planned=doc.body.dataset.shorelineReview==='true';
 if(!port.mapWindow)return {refresh(){},isOpen:()=>false,destroy(){}};
 const style=doc.createElement('style');style.textContent=`
.world-mini{position:fixed;right:calc(8px + var(--world-safe-right));top:calc(78px + var(--world-safe-top));z-index:6;width:116px;padding:3px;background:#100b18c7;border:1px solid #8f7135;border-radius:7px;color:#ffe5a2;box-shadow:0 3px 12px #0008;overflow:hidden}
.world-mini canvas{display:block;width:110px;height:76px;cursor:pointer;border-radius:4px}
.world-mini button,.world-atlas button{min-height:44px;background:#251b33;border:1px solid #967739;color:#ffe5a2;border-radius:5px;font:700 12px system-ui;padding:5px 10px}
.world-mini footer{position:absolute;inset:3px 3px auto;display:flex;justify-content:space-between;align-items:flex-start;font:700 10px system-ui;pointer-events:none;text-shadow:0 1px 3px #000}
.world-mini footer button{pointer-events:auto;min-width:34px;min-height:30px;padding:2px 6px;background:#151020c9}
.world-atlas{position:fixed;top:calc(8px + var(--world-safe-top));right:calc(8px + var(--world-safe-right));bottom:calc(8px + var(--world-safe-bottom));left:calc(8px + var(--world-safe-left));max-width:1200px;max-height:calc(100dvh - 16px - var(--world-safe-top) - var(--world-safe-bottom));margin:auto;z-index:40;background:#090712;border:2px solid #c5a64f;border-radius:9px;display:flex;flex-direction:column;box-shadow:0 8px 40px #000d;contain:strict;overflow:hidden;overscroll-behavior:contain}
.world-atlas[hidden],.world-mini[hidden]{display:none}
.world-atlas header{display:flex;gap:6px;align-items:center;padding:7px;background:#241b32;color:#ffe29a;flex:0 0 auto}
.world-atlas strong{margin-right:auto;white-space:nowrap;font:700 15px Georgia,serif}
.world-atlas canvas{display:block;width:100%;height:0;min-height:0;min-width:0;touch-action:none;flex:1 1 0;background:${UNKNOWN}}
.world-atlas p{margin:0;padding:7px;color:#d9cadf;font:12px system-ui;min-height:32px;flex:0 0 auto}
.world-atlas .map-close{min-width:44px;font-size:22px;line-height:1}
@media(max-width:520px){.world-atlas header{display:grid;grid-template-columns:minmax(64px,1fr) 44px 44px minmax(64px,76px) 44px}.world-atlas strong{min-width:0;font-size:13px}.world-atlas header button{min-width:44px;padding:4px;font-size:11px}}
@media(max-height:550px){.world-mini{top:calc(56px + var(--world-safe-top));width:104px}.world-mini canvas{width:98px;height:62px}.world-atlas header{padding:3px}.world-atlas p{padding:3px;min-height:24px}}
`;doc.head.append(style);
 const el=(tag,text)=>{const e=doc.createElement(tag);if(text)e.textContent=text;return e;},mini=el('section'),small=el('canvas'),footer=el('footer'),atlas=el('section'),header=el('header'),large=el('canvas'),detail=el('p','Drag to explore known geography. Pinch or use + / − to zoom.');
 mini.className='world-mini';mini.dataset.gameplayHud='';atlas.className='world-atlas';atlas.hidden=true;atlas.setAttribute('role','dialog');atlas.setAttribute('aria-modal','true');atlas.setAttribute('aria-label','World map');small.width=110*MINIMAP_PIXEL_RATIO;small.height=76*MINIMAP_PIXEL_RATIO;small.setAttribute('aria-label','Minimap — open world map');small.tabIndex=0;
 const button=(text,fn,parent,className='')=>{const b=el('button',text);b.type='button';b.className=className;let held=null;b.addEventListener('pointerdown',e=>{if(e.button===0)held=e.pointerId;});b.addEventListener('pointercancel',()=>{held=null;});b.addEventListener('pointerup',e=>{if(held!==e.pointerId)return;held=null;const r=b.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return;e.preventDefault();fn();});b.addEventListener('click',e=>{e.preventDefault();if(e.detail===0)fn();});parent.append(b);return b;};
 header.append(el('strong','WORLD MAP'));mini.append(small,footer);footer.append(el('span','N ↑'));atlas.append(header,large,detail);doc.body.append(mini,atlas);
 let open=false,hudAllowed=true,center=null,level=0,miniZoom=1,busy=false,closed=false,lastKey=null,cache=[],cacheRevision=0,lastModel=null,marks=[],miniMarks=[],reviewMarks=[],terrainHits=[],lastTime=-1000,staticLayer=null,staticKey=null,staticBuilds=0,staticHits=0,miniBackingCenter=null,miniRequestedCenter=null,miniRecenters=0;
 const pointers=new Map();let gesture=null;
 function syncVisibility(){atlas.hidden=!open;mini.hidden=open||!hudAllowed||!lastModel?.navigation?.position;doc.documentElement.dataset.worldMapOpen=String(open);}
 function recenter(){center={...lastModel.navigation.position};lastKey=null;detail.textContent='Centered on player';}
 function show(selected=null){if(!hudAllowed||!lastModel?.navigation?.position)return;releaseInput();open=true;syncVisibility();recenter();if(selected)detail.textContent=selected;closeButton.focus({preventScroll:true});}
 function hide(){open=false;syncVisibility();pointers.clear();gesture=null;lastKey=null;releaseInput();}
 const zoom=(delta,anchor=null)=>{const next=Math.max(0,Math.min(planned?PLANNED_MAP_MAX_LEVEL:B.mapOverviewLevels,level+delta));if(next===level)return;const old=.25/2**level,fresh=.25/2**next;if(anchor)center=panMapD9(center,anchor.x*(1-old/fresh),anchor.y*(1-old/fresh),old);level=next;lastKey=null;if(planned)detail.textContent='Observed terrain · zoom '+(2**level)+'× span · solid gold road / dashed trail / white bridge';};
 button('−',()=>zoom(1),header,'map-zoom-out');button('+',()=>zoom(-1),header);button('Recenter',recenter,header);const closeButton=button('×',hide,header,'map-close');closeButton.setAttribute('aria-label','Close world map');const miniButton=button('1×',()=>{miniZoom=miniZoom===1?2:1;miniButton.textContent=miniZoom+'×';lastKey=null;},footer);
 small.addEventListener('click',e=>{const r=small.getBoundingClientRect(),x=(e.clientX-r.left)*small.width/r.width,y=(e.clientY-r.top)*small.height/r.height,mark=miniMarks.find(value=>Math.hypot(value.x-x,value.y-y)<20);show(mark?.label??null);});small.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show();}});
 const keyboard=e=>{if(e.code==='Escape'&&open){e.preventDefault();hide();}else if(e.code==='KeyM'&&!['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName)){e.preventDefault();open?hide():show();}};environment.addEventListener('keydown',keyboard);
 const position=e=>{const r=large.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
 large.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();try{large.setPointerCapture(e.pointerId);}catch{}pointers.set(e.pointerId,position(e));gesture={points:[...pointers.values()],moved:false};});
 large.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)||!gesture)return;e.preventDefault();const before=[...pointers.values()];pointers.set(e.pointerId,position(e));const after=[...pointers.values()];if(after.length===1){const dx=after[0].x-before[0].x,dy=after[0].y-before[0].y;center=panMapD9(center,dx,dy,.25/2**level);gesture.moved||=Math.hypot(dx,dy)>1;lastKey=null;}else if(after.length===2){const distance=p=>Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),ratio=distance(after)/Math.max(1,distance(gesture.points));if(ratio>1.5||ratio<.67){const r=large.getBoundingClientRect();zoom(ratio>1?-1:1,{x:(after[0].x+after[1].x-r.width)/2,y:(after[0].y+after[1].y-r.height)/2});gesture.points=after;}gesture.moved=true;}});
 const end=e=>{const q=position(e);if(!gesture?.moved){const mark=[...marks,...reviewMarks].find(m=>Math.hypot(m.x-q.x,m.y-q.y)<18);if(mark)detail.textContent=mark.label;else{const hit=terrainHits.find(h=>q.x>=h.x&&q.y>=h.y&&q.x<h.x+h.w&&q.y<h.y+h.h);detail.textContent=hit?.label??'Only explored terrain is shown.';}}pointers.delete(e.pointerId);gesture=pointers.size?{points:[...pointers.values()],moved:true}:null;};
 large.addEventListener('pointerup',end);large.addEventListener('pointercancel',end);large.addEventListener('wheel',e=>{e.preventDefault();const p=position(e),r=large.getBoundingClientRect();zoom(e.deltaY>0?1:-1,{x:p.x-r.width/2,y:p.y-r.height/2});},{passive:false});
 function refresh(model,time=environment.performance.now(),presentation={gameplayHudVisible:true}){
  lastModel=model;hudAllowed=Boolean(presentation.gameplayHudVisible);const n=model.navigation;if(!n?.position){if(open)hide();syncVisibility();return;}syncVisibility();if(!open&&!hudAllowed)return;if(!open&&!miniBackingCenter)miniBackingCenter={...n.position};if(open&&!center)center={...n.position};
  const canvas=open?large:small,rect=canvas.getBoundingClientRect(),pixelRatio=open?1:MINIMAP_PIXEL_RATIO,width=open?Math.min(1200,Math.max(1,Math.round(rect.width))):110*pixelRatio,height=open?Math.min(1000,Math.max(1,Math.round(rect.height))):76*pixelRatio,scale=open?.25/2**level:(planned?.055:.11)*miniZoom*pixelRatio,lod=open?level:0;
  // The atlas is flex-sized by CSS. Keep its drawing buffer in lockstep with
  // that presented size or centered geography can be clipped outside the
  // browser's default 300x150 canvas buffer on a phone.
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;staticKey=null;}
  const cachePadding=open?MINIMAP_CACHE_PADDING_PX:MINIMAP_CACHE_PADDING_PX*pixelRatio,recenterDistance=open?MINIMAP_RECENTER_SCREEN_PX:MINIMAP_RECENTER_SCREEN_PX*pixelRatio,backingWidth=open?width:width+cachePadding*2,backingHeight=open?height:height+cachePadding*2,displayCenter=open?center:n.position,backingCenter=open?center:miniBackingCenter;
  if(!open){const drift=worldScreenDeltaD9(n.position,miniBackingCenter,scale);if(Math.abs(drift.x)>=recenterDistance||Math.abs(drift.y)>=recenterDistance)miniRequestedCenter={...n.position};}
  const requestCenter=open?center:(miniRequestedCenter??miniBackingCenter),requestViewport=mapViewportD9(requestCenter,lod,backingWidth,backingHeight,scale),query={playerId:model.localPlayerId,spaceInstanceId:model.context.spaceInstanceId,level:lod,x:requestViewport.x,y:requestViewport.y,width:requestViewport.width,height:requestViewport.height},key=JSON.stringify([query,n.root,n.revision]),requestMode=open?'atlas':'minimap',requestedMiniCenter=!open?{...requestCenter}:null;
  if(!busy&&key!==lastKey&&time-lastTime>=150){busy=true;lastTime=time;lastKey=key;port.mapWindow(query).then(r=>{if(!closed){cache=r.pages;if(requestMode==='minimap'&&requestedMiniCenter){if(miniBackingCenter&&(miniBackingCenter.chunkX!==requestedMiniCenter.chunkX||miniBackingCenter.chunkY!==requestedMiniCenter.chunkY||miniBackingCenter.localX!==requestedMiniCenter.localX||miniBackingCenter.localY!==requestedMiniCenter.localY))miniRecenters++;miniBackingCenter=requestedMiniCenter;miniRequestedCenter=null;}cacheRevision++;staticKey=null;}}).catch(e=>{lastKey=null;if(open)detail.textContent=e.message;}).finally(()=>{busy=false;});}
  const renderCenter=open?center:miniBackingCenter,v=mapViewportD9(renderCenter,lod,backingWidth,backingHeight,scale),ctx=canvas.getContext('2d'),nextStaticKey=JSON.stringify([CARTOGRAPHY_STYLE,open,lod,backingWidth,backingHeight,scale,v.x,v.y,v.width,v.height,v.screenX,v.screenY,open?n.root:null,open?n.revision:0,n.boundSitesById??n.boundSite??null,n.navigableSitesById??null,cacheRevision]);
  if(!staticLayer||staticLayer.width!==backingWidth||staticLayer.height!==backingHeight){staticLayer=doc.createElement('canvas');staticLayer.width=backingWidth;staticLayer.height=backingHeight;staticKey=null;}
  if(staticKey!==nextStaticKey){const paint=drawCartographyD9(staticLayer.getContext('2d'),{pages:cache,pending:n.pending,viewport:v,width:backingWidth,height:backingHeight,scale,level:lod,boundSitesById:n.boundSitesById,boundSite:n.boundSite,navigableSitesById:n.navigableSitesById,planned});marks=paint.markers;terrainHits=paint.visible.map(({page,x,y,w,h})=>({x,y,w,h,label:page.region?page.region.name+' · '+page.region.biome.replaceAll('-',' ')+' · Minimum Lv. '+formatLarge(typeof page.region.minimumLevel==='number'?String(page.region.minimumLevel):page.region.minimumLevel):'Explored territory'}));staticKey=nextStaticKey;staticBuilds++;}else staticHits++;
  ctx.clearRect(0,0,width,height);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';if(open){miniMarks=[];ctx.drawImage(staticLayer,0,0);}else{const drift=worldScreenDeltaD9(displayCenter,miniBackingCenter,scale),sourceX=cachePadding+drift.x,sourceY=cachePadding+drift.y;miniMarks=marks.map(mark=>({...mark,x:mark.x-sourceX,y:mark.y-sourceY})).filter(mark=>mark.x>=0&&mark.y>=0&&mark.x<=width&&mark.y<=height);ctx.drawImage(staticLayer,sourceX,sourceY,width,height,0,0,width,height);}
  reviewMarks=[];if(planned)for(const r of environment.__SAQ_PLANNED_REVIEW__?.mapReservations?.()??[]){const delta=worldScreenDeltaD9({chunkX:String(1024+Math.floor(r.tile.x/32)),chunkY:String(1024+Math.floor(r.tile.y/26)),localX:(r.tile.x%32+.5)*32,localY:(r.tile.y%26+.5)*32},displayCenter,scale),x=width/2+delta.x,y=height/2+delta.y;if(x<5||y<5||x>width-5||y>height-5)continue;ctx.strokeStyle='#deb8ed';ctx.lineWidth=1.5;ctx.setLineDash([2,2]);ctx.strokeRect(x-5,y-5,10,10);ctx.setLineDash([]);ctx.fillStyle='#deb8ed';ctx.font='bold 8px system-ui';ctx.fillText('R',x-2,y+3);if(open)reviewMarks.push({x,y,label:'UNBUILT REVIEW RESERVATION · '+r.id});}
  if(!open)for(const pip of n.pips??[]){const delta=worldScreenDeltaD9(pip.position,displayCenter,scale),x=width/2+delta.x,y=height/2+delta.y;if(x<3||y<3||x>width-3||y>height-3)continue;ctx.fillStyle=pip.kind==='ally'?'#76d6ef':'#f36a73';ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.fill();}
  const actual=n.position,local=model.playersById[model.localPlayerId],facing=model.primary?.actorsById?.[local.entityId]?.facing;if(!open)drawPlayer(ctx,width/2,height/2,facing,planned?16:8);else{const size=1n<<BigInt(lod),cx=floorDiv(BigInt(actual.chunkX),size),cy=floorDiv(BigInt(actual.chunkY),size),dx=cx-BigInt(v.x),dy=cy-BigInt(v.y);if(dx>=0n&&dy>=0n&&dx<BigInt(v.width)&&dy<BigInt(v.height)){const x=v.screenX+Number(dx)*v.cellW+(Number(BigInt(actual.chunkX)-cx*size)*1024+actual.localX)*scale,y=v.screenY+Number(dy)*v.cellH+(Number(BigInt(actual.chunkY)-cy*size)*832+actual.localY)*scale;drawPlayer(ctx,x,y,facing,planned?10:8);}}
 }
 syncVisibility();
 return {refresh,isOpen:()=>open,resources:()=>({cartographyStaticBuilds:staticBuilds,cartographyStaticHits:staticHits,cartographyStaticKey:staticKey,minimapPixelRatio:MINIMAP_PIXEL_RATIO,minimapCachePaddingPx:MINIMAP_CACHE_PADDING_PX,minimapRecenterScreenPx:MINIMAP_RECENTER_SCREEN_PX,minimapBackingRecenters:miniRecenters,mapLevel:level,mapMaximumLevel:planned?PLANNED_MAP_MAX_LEVEL:B.mapOverviewLevels,cartographyMode:planned?'observed-crisp-v2':'legacy' }),destroy(){closed=true;doc.documentElement.dataset.worldMapOpen='false';mini.remove();atlas.remove();style.remove();environment.removeEventListener('keydown',keyboard);}};
}
