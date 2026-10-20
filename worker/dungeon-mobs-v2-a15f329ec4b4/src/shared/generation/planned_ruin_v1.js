import {STANDARD_RUIN_KIT_VERSION} from '../content/planned_ruin_standard_kit_v1.js';
import {NATURAL_CLUSTER_VERSION} from './natural_clusters_v1.js';
import {ruinModulePose} from '../content/ruin_modular_kit_v1.js';
import {RUIN_GROVE_VERSION,isRuinGrovePilot} from './ruin_groves_v1.js';
import {PLANNED_RUIN_EXTERIOR_VERSION,PLANNED_RUIN_REMNANT_VARIATION_VERSION,PLANNED_RUIN_ENTRY_MASK} from '../content/planned_ruin_exterior_v4.js';
import {RUIN_TIER_POLICY,PLANNED_RUIN_VERSION,PLANNED_RUIN_SOCKET,PLANNED_RUIN_RESERVATION,RUIN_FAMILY_PACKAGE_ID} from '../content/planned_ruin_policy_v1.js';
import {createPlannedTerrain,tileAddress,PLANNED_ADDRESS_OFFSET,PLANNED_WORLD_VERSION,BIOME_CODES} from './planned_world_foundation_v1.js';
import {worldIdentity} from './world_identity_d9.js';import {regionAddress} from '../contracts/world_address.js';import {copyWire,freezeWire,requireContract as check} from '../contracts/wire.js';
export function createPlannedRuinExterior(asset,reservationId,terrain=createPlannedTerrain(asset),realization=null){
 const r=asset.sites.find(s=>s.id===reservationId),d=asset.routes.destinations.find(s=>s.id===reservationId),policy=realization?.policy??RUIN_TIER_POLICY[r?.tier];check(r?.familyId==='site-family:ruin'&&policy&&d?.point,'Ruin requires an existing reservation');
 const xs=r.footprint.map(c=>c.x),ys=r.footprint.map(c=>c.y),minX=Math.min(...xs),minY=Math.min(...ys),maxX=Math.max(...xs),maxY=Math.max(...ys),[width,height]=realization?.tiles??(policy.exteriorTiles[0]<=(maxX-minX+1)*32&&policy.exteriorTiles[1]<=(maxY-minY+1)*26?policy.exteriorTiles:[policy.exteriorTiles[1],policy.exteriorTiles[0]]),left=realization?.left??minX*32+Math.floor(((maxX-minX+1)*32-width)/2),top=realization?.top??minY*26;
 check(r.footprint.length>=policy.minimumExteriorChunks&&r.approach.length>=policy.minimumApproachChunks&&(realization||r.footprint.length===(maxX-minX+1)*(maxY-minY+1))&&width<=(maxX-minX+1)*32&&height<=(maxY-minY+1)*26,'Ruin exterior capacity incompatible');
 const footprint=new Set(r.footprint.map(c=>c.x+','+c.y));for(let y=top;y<top+height;y++)for(let x=left;x<left+width;x++)check(footprint.has(Math.floor(x/32)+','+Math.floor(y/26)),'Ruin architecture escapes actual footprint shape');
 const allowedSet=new Set([...r.footprint,...r.approach].map(c=>c.x+','+c.y)),allowed=(x,y)=>allowedSet.has(Math.floor(x/32)+','+Math.floor(y/26)),inside=(x,y)=>x>=left&&x<left+width&&y>=top&&y<top+height,walk=Array.from({length:height},()=>Array(width).fill('1')),ground=Array.from({length:height},()=>Array(width).fill('g')),blockers=[],decorations=[],moduleClear=new Set();
 const block=(kind,detail,x,y,w,h)=>{blockers.push({kind,detail,x,y,width:w,height:h});for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)walk[yy][xx]='2';};
 const side=d.point.x>=left+width?'east':d.point.x<left?'west':d.point.y>=top+height?'south':'north',gateY=Math.max(8,Math.min(height-9,d.point.y-top)),gateX=Math.max(8,Math.min(width-9,d.point.x-left));
 // Authorized centered entrance successor; permanent site seed and interior stay V1.
 const kw=12,kh=14,kx=Math.floor((width-kw)/2),ky=Math.floor(height/2)-kh,ex=kx+Math.floor(kw/2),ey=ky+kh;
 const entrance={x:left+ex,y:top+ey},gate={x:side==='east'?left+width-1:side==='west'?left:left+gateX,y:side==='south'?top+height-1:side==='north'?top:top+gateY},trail=new Set();
 let variation=2166136261;for(const c of asset.campaignSeedHex+'/'+reservationId+'/'+PLANNED_RUIN_REMNANT_VARIATION_VERSION)variation=Math.imul(variation^c.charCodeAt(0),16777619)>>>0;
 for(let row=0;row<PLANNED_RUIN_ENTRY_MASK.length;row++)for(let col=0;col<9;){if(PLANNED_RUIN_ENTRY_MASK[row][col]==='1'){col++;continue;}const start=col;while(col<9&&PLANNED_RUIN_ENTRY_MASK[row][col]==='0')col++;block('ruin-exterior-masonry','entry-course-'+row+'-'+start,ex-4+start,ey-4+row,col-start,1);blockers.at(-1).presentationPart='entry-structure';}
 // Broken sections, not a complete rectangular enclosure. Tier and stable seed
 // choose extent and arrangement; all remain behind/beside the real building.
 const remnant=(detail,x,y,w,h,part='wall-remnant')=>{block('ruin-exterior-masonry',detail,x,y,w,h);blockers.at(-1).presentationPart=part;};
 if(r.tier==='small'){
  const horizontal=n=>((variation>>>n)&1)?'straight-a':'straight-b',modules=[['north-south',ex-10,ey-12],['corner',ex-10,ey-6],[horizontal(3),ex-7,ey-6],['broken-end',ex-4,ey-6],[horizontal(7),ex-10,ey-5],['door-collar',ex-7,ey-5],[horizontal(11),ex-11,ey+9],['collapsed',ex-8,ey+9],['foundation',ex-6,ey-10]];
  for(const [id,x,y]of modules){const p=ruinModulePose(id,x,y);for(const c of p.cells){check(c.x>=0&&c.y>=0&&c.x<width&&c.y<height,'Modular ruin escaped reservation');block('ruin-exterior-masonry','module-'+id+'-'+x+'-'+y+'-'+c.x+'-'+c.y,c.x,c.y,1,1);blockers.at(-1).presentationPart='modular-base';}for(const c of p.clearCells)moduleClear.add((left+c.x)+','+(top+c.y));decorations.push({kind:'ruin-module-'+id,x:x+.5,y:y+.5,variant:0});}
 }else{
  // Complete joined modules own their fitted cell masks. No rectangular
  // legacy masonry underlay survives in the authored Standard presentation.
  const courtY=ey-13+(variation%3),courtLeft=ex-18,horizontal=i=>((variation+i)&1)?'straight-a':'straight-b';
  const module=(id,x,y)=>{
   const p=ruinModulePose(id,x,y);
   for(const c of p.cells){check(c.x>=0&&c.y>=0&&c.x<width&&c.y<height,'Standard modular ruin escaped reservation');if(walk[c.y][c.x]==='2')continue;block('ruin-exterior-masonry','module-'+id+'-'+x+'-'+y+'-'+c.x+'-'+c.y,c.x,c.y,1,1);blockers.at(-1).presentationPart='modular-base';}
   for(const c of p.clearCells)moduleClear.add((left+c.x)+','+(top+c.y));
   decorations.push({kind:'ruin-module-'+id,x:x+.5,y:y+.5,variant:0,standardRuinKit:true});
  };
  for(let i=0;i<3;i++)module(horizontal(i),courtLeft+i*3,courtY);module('end-cap',courtLeft+9,courtY);
  for(let i=0;i<2;i++)module(horizontal(i+3),ex+7+i*3,courtY+1);module('broken-end',ex+13,courtY+1);
  module('north-south',courtLeft,courtY+2);module('corner',courtLeft,courtY+8);
  module(horizontal(5),courtLeft+3,courtY+8);module('end-cap',courtLeft+6,courtY+8);
  module('broken-north-south',ex+18,courtY+6);
  module(horizontal(6),ex+8,ey+11);module('end-cap',ex+11,ey+11);
  module('end-cap',ex+12,ey+3);module('collapsed',courtLeft+5,ey+5);
  module('foundation',ex-10,ey+7);module('foundation',ex-7,ey+7);
  decorations.push({kind:'ruin-wall-roots',x:courtLeft,y:ey-2,variant:0});
  if(realization?.version){
   // Additional recognizable side rooms in the larger compound. Their broken
   // entrances remain open; no foreground wall crosses the main frontage.
   const y=height>=60?ey+20:ey-17;
   module('corner',ex-19,y);module(horizontal(8),ex-16,y);module('broken-end',ex-13,y);
   module('north-south',ex+18,height>=60?ey+15:ey-18);module('collapsed',ex+17,height>=60?ey+21:ey-12);
   module('foundation',ex-15,ey+14);module('foundation',ex+10,ey-10);
  }
 }
 decorations.push({kind:'ruin-entry-facade',x:ex+.5,y:ey+.5,variant:variation%4},{kind:'ruin-threshold-weeds',x:ex,y:ey+3,variant:1});
 // Side/rear remnants may frame the building; they may not occupy its frontage.
 for(const b of blockers)if(b.presentationPart!=='entry-structure')check(b.x+b.width<=ex-5||b.x>ex+5||b.y+b.height<=ey-4||b.y>ey+10,'Ruin remnant obscures entrance frontage');
 // The source mask is reused exactly at the anchor; its physical doorway is
 // three tiles wide and its rubble/roots own the same cells as the legacy art.
 for(let y=0;y<PLANNED_RUIN_ENTRY_MASK.length;y++)for(let x=0;x<9;x++)check(walk[ey-4+y][ex-4+x]=== (PLANNED_RUIN_ENTRY_MASK[y][x]==='1'?'1':'2'),'Ruin facade collision differs from authored fitted entry mask');
 const put=(x,y)=>{check(allowed(x,y),'Ruin approach escaped reserved capacity');trail.add(x+','+y);};
 // Cardinal shortest path with a three-tile dry, hull-clear corridor. No water
 // mutation, footprint expansion, or per-site orientation implementation.
 const safe=(x,y)=>{for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const xx=x+ox,yy=y+oy;if(!allowed(xx,yy))return false;const base=terrain.base(xx,yy);if(!base.walkable||base.landmassId!==r.landmassId||(inside(xx,yy)&&walk[yy-top][xx-left]!=='1'))return false;}return true;},start=d.point,key=(x,y)=>x+','+y,queue=[start],parents=new Map([[key(start.x,start.y),null]]);let found=null;
 for(let head=0;head<queue.length;head++){const p=queue[head];if(p.x===entrance.x&&p.y===entrance.y+1){found=p;break;}for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0]]){const x=p.x+dx,y=p.y+dy,k=key(x,y);if(!parents.has(k)&&safe(x,y)){parents.set(k,p);queue.push({x,y});}}}
 check(found,'Ruin has no connected reserved three-tile approach');const connector=[];for(let p=found;p;p=parents.get(key(p.x,p.y)))connector.push(p);connector.reverse();connector.push(entrance);for(const p of connector)for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++)if(p.y!==entrance.y||oy>=0)put(p.x+ox,p.y+oy);
 for(let y=top;y<top+height;y++)for(let x=left;x<left+width;x++){const b=terrain.base(x,y);check(b.walkable&&b.landmassId===r.landmassId,'Ruin cannot replace water or another landmass');}
 for(const key of trail){const [x,y]=key.split(',').map(Number),b=terrain.base(x,y);check(b.walkable&&b.landmassId===r.landmassId,'Ruin approach intersects authoritative water');if(inside(x,y)){check(walk[y-top][x-left]==='1','Ruin approach intersects a building or wall');ground[y-top][x-left]='p';}}
 const circulation=new Set();
 for(const goal of [{x:entrance.x,y:entrance.y-7},{x:entrance.x-6,y:entrance.y+4},{x:entrance.x+6,y:entrance.y+4},...(r.tier==='small'?[{x:entrance.x-6,y:entrance.y-9},{x:entrance.x,y:entrance.y+8}]:[])]){
  const origin={x:entrance.x,y:entrance.y+1},q=[origin],parents=new Map([[key(origin.x,origin.y),null]]);let end=null;
  for(let i=0;i<q.length;i++){const p=q[i];if(p.x===goal.x&&p.y===goal.y){end=p;break;}for(const [dx,dy]of [[0,1],[-1,0],[1,0],[0,-1]]){const x=p.x+dx,y=p.y+dy,k=key(x,y);if(!parents.has(k)&&inside(x,y)&&safe(x,y)){parents.set(k,p);q.push({x,y});}}}
  check(end,'Ruin circulation cannot reach '+r.id+' courtyard '+key(goal.x,goal.y));for(let p=end;p;p=parents.get(key(p.x,p.y)))for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(inside(p.x+dx,p.y+dy))circulation.add(key(p.x+dx,p.y+dy));
 }
 const ownsStructure=(x,y)=>inside(x,y)&&walk[y-top][x-left]==='2';
 const clearEntrance=(x,y)=>x>=entrance.x-4&&x<=entrance.x+4&&y>=entrance.y-4&&y<=entrance.y+3&&!ownsStructure(x,y);
 const apply=(x,y,b)=>ownsStructure(x,y)?{...b,collision:'2',material:'g',route:0,ruinExterior:true}:trail.has(x+','+y)?{...b,collision:'1',material:'p',route:1,ruinExterior:true}:clearEntrance(x,y)||circulation.has(key(x,y))||moduleClear.has(key(x,y))?{...b,collision:'1',material:'g',route:0,ruinExterior:true}:b;
 const presentation=(cx,cy,siteId)=>({blockers:blockers.filter(b=>left+b.x<cx*32+32&&left+b.x+b.width>cx*32&&top+b.y<cy*26+26&&top+b.y+b.height>cy*26).map(b=>({...b,id:'ruin:'+siteId+':'+b.detail,x:left+b.x-cx*32,y:top+b.y-cy*26})),decorations:decorations.filter(q=>Math.floor((left+q.x)/32)===cx&&Math.floor((top+q.y)/26)===cy).map((q,i)=>({...q,id:'ruin-art:'+siteId+':'+q.kind+':'+(q.standardRuinKit?q.x+','+q.y:i),x:left+q.x-cx*32,y:top+q.y-cy*26}))});
 return Object.freeze({reservation:r,destination:d,policy,left,top,width,height,entrance,gate,road:d.point,side,connector,trail,circulation,allowed,inside,ownsStructure,apply,presentation,terrain,realizationVersion:realization?.version??(r.tier==='standard'?STANDARD_RUIN_KIT_VERSION:PLANNED_RUIN_EXTERIOR_VERSION),variant:variation.toString(16).padStart(8,'0')});
}
export async function derivePlannedRuinReservation(asset,binding,sha256,{reservationId,terrain,realization=null}={}){
 const g=createPlannedRuinExterior(asset,reservationId,terrain,realization),r=g.reservation,biome=r.id.split(':')[2],identity=await worldIdentity(asset.campaignSeedHex,PLANNED_RUIN_VERSION,[binding.assetHash,r.id,r.tier],sha256),siteId='site:'+identity.digest.slice(0,32),entrance=tileAddress(g.entrance.x,g.entrance.y),region=regionAddress(entrance.chunkX,entrance.chunkY);check(g.terrain.base(g.entrance.x,g.entrance.y).biome===BIOME_CODES[biome],'Ruin entrance biome incompatible');
 const chunk=await worldIdentity(PLANNED_WORLD_VERSION+'/'+NATURAL_CLUSTER_VERSION+'/'+asset.campaignSeedHex+'/'+binding.assetHash+(binding.townPrototype?'/'+binding.townPrototype:'')+'/'+PLANNED_RUIN_VERSION+'/'+PLANNED_RUIN_EXTERIOR_VERSION+(r.tier==='standard'?'/'+STANDARD_RUIN_KIT_VERSION:'')+(isRuinGrovePilot(asset,r)?'/'+RUIN_GROVE_VERSION:''),'chunk',[entrance.chunkX,entrance.chunkY],sha256),socket={version:PLANNED_RUIN_SOCKET,siteId,siteSeed:identity.digest,entrance,siteClass:'dungeon',capabilities:['interior'],region:{regionX:region.regionX,regionY:region.regionY,biome},minimumLevel:[0,1,6,11,21,41][r.band],provenance:{geographyVersion:asset.version,chunkId:chunk.id,placementVersion:PLANNED_RUIN_VERSION,identityDomain:'planned-reservation-ruin',reservationId:r.id,assetHash:binding.assetHash,planHash:binding.planHash,sizeTier:r.tier,band:r.band,footprintChunks:copyWire(r.footprint),approachChunks:copyWire(r.approach)}};
 const parcel={version:PLANNED_RUIN_VERSION,siteId,socket:copyWire(socket),familyId:'site-family:ruin',packageId:RUIN_FAMILY_PACKAGE_ID,tier:r.tier,label:biome[0].toUpperCase()+biome.slice(1)+' Ruin',tileX:String(PLANNED_ADDRESS_OFFSET.chunkX*32+g.left),tileY:String(PLANNED_ADDRESS_OFFSET.chunkY*26+g.top),width:g.width,height:g.height,layoutSeed:identity.digest,pages:r.footprint.map(c=>({chunkX:String(1024+c.x),chunkY:String(1024+c.y)})),roadAnchor:{tileX:String(1024*32+g.gate.x),tileY:String(1024*26+g.gate.y)}};
 return freezeWire({version:PLANNED_RUIN_RESERVATION,siteId,packageId:RUIN_FAMILY_PACKAGE_ID,socket,parcel});
}
