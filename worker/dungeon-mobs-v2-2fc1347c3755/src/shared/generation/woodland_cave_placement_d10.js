import {floorDiv,normalizeWorldPosition} from '../contracts/world_address.js';
import {copyWire,freezeWire,requireContract as check} from '../contracts/wire.js';
import {generateChunkD9} from './endless_world_d9.js';
import {worldIdentity} from './world_identity_d9.js';
import {SITE_BOOTSTRAP_SOCKET_D9,SITE_BOOTSTRAP_PLACEMENT_D9,validateSiteSocketD9} from '../contracts/site_content_d9.js';
import {WOODLAND_CAVE_EXTERIOR,WOODLAND_CAVE_VERSION} from '../content/woodland_cave_d10.js';
import {fortParcelOwnsWorldPositionD10} from './woodland_fort_placement_d10.js';

const CW=32n,CH=26n,T=32,W=BigInt(WOODLAND_CAVE_EXTERIOR.width),H=BigInt(WOODLAND_CAVE_EXTERIOR.height),key=(x,y)=>x+','+y;
const inside=(x,y,p)=>x>=BigInt(p.tileX)&&x<BigInt(p.tileX)+W&&y>=BigInt(p.tileY)&&y<BigInt(p.tileY)+H;
export const caveParcelOwnsWorldPositionD10=(parcel,p)=>Boolean(parcel&&inside(BigInt(p.chunkX)*CW+BigInt(Math.floor(p.localX/T)),BigInt(p.chunkY)*CH+BigInt(Math.floor(p.localY/T)),parcel));

export async function planWoodlandCaveParcelD10({seed,origin,ruinSocket,fortParcel,minRouteTiles=48,maxRouteTiles=192,excludedParcels=[],excludedPlacementRegions=[],minimumSeparationTiles=0},sha256){
 check(ruinSocket?.siteId&&fortParcel?.siteId&&minRouteTiles>=48&&minRouteTiles<=maxRouteTiles&&maxRouteTiles<=512&&minimumSeparationTiles>=0,'Cave reservation input');const cache=new Map();
 async function chunk(cx,cy){const id=key(cx,cy);if(!cache.has(id)){if(cx>=0n&&cy>=0n&&cx<BigInt(origin.originWidthChunks)&&cy<BigInt(origin.originHeightChunks))cache.set(id,null);else cache.set(id,await generateChunkD9({seed,chunkX:String(cx),chunkY:String(cy),origin},sha256));}return cache.get(id);}
 async function cell(x,y){const cx=floorDiv(x,CW),cy=floorDiv(y,CH),page=await chunk(cx,cy);return page?{page,x:Number(x-cx*CW),y:Number(y-cy*CH)}:null;}
 const startX=BigInt(fortParcel.socket.entrance.chunkX)*CW+BigInt(Math.floor(fortParcel.socket.entrance.localX/T)),startY=BigInt(fortParcel.socket.entrance.chunkY)*CH+BigInt(Math.floor(fortParcel.socket.entrance.localY/T));
 const queue=[{x:startX,y:startY,d:0}],seen=new Set([key(startX,startY)]),identity=await worldIdentity(seed,'site-bootstrap',[WOODLAND_CAVE_VERSION,'cave'],sha256);
 for(let i=0;i<queue.length;i++){
  const {x,y,d}=queue[i],at=await cell(x,y);if(!at||at.page.visual.route.centerline[at.y]?.[at.x]!=='1')continue;
  if(d>=minRouteTiles&&d<=maxRouteTiles&&at.page.region.biome==='woodland'){
   const left=x-5n,top=y-H,x0=floorDiv(left,CW),x1=floorDiv(left+W-1n,CW),y0=floorDiv(top,CH),y1=floorDiv(top+H-1n,CH);
   if(x0===x1&&y0===y1){const page=await chunk(x0,y0);let valid=Boolean(page),woodland=0,total=0;
    const parcel={version:WOODLAND_CAVE_VERSION,siteId:'site:'+identity.digest.slice(0,32),socket:null,tileX:String(left),tileY:String(top),width:Number(W),height:Number(H),orientation:'north-of-road',pages:[],routeDistanceTiles:d};
    if(page){parcel.pages.push({chunkX:String(x0),chunkY:String(y0),baseDigest:page.identity.digest});for(let yy=top-2n;yy<top+H+2n;yy++)for(let xx=left-2n;xx<left+W+2n;xx++){const q=await cell(xx,yy);if(!q){valid=false;continue;}total++;if(q.page.visual.biomes[q.y][q.x]==='w')woodland++;if(xx>=left&&xx<left+W&&yy>=top&&yy<top+H&&q.page.visual.route.centerline[q.y][q.x]==='1')valid=false;}
     for(const s of page.sites??[]){const sx=BigInt(s.entrance.chunkX)*CW+BigInt(Math.floor(s.entrance.localX/T)),sy=BigInt(s.entrance.chunkY)*CH+BigInt(Math.floor(s.entrance.localY/T));if(s.siteId===ruinSocket.siteId||inside(sx,sy,parcel))valid=false;}
     for(let yy=top;yy<top+H;yy++)for(let xx=left;xx<left+W;xx++){const p=normalizeWorldPosition({chunkX:String(floorDiv(xx,CW)),chunkY:String(floorDiv(yy,CH)),localX:Number(xx-floorDiv(xx,CW)*CW)*T+16,localY:Number(yy-floorDiv(yy,CH)*CH)*T+16});if(fortParcelOwnsWorldPositionD10(fortParcel,p))valid=false;}
    }
    if(valid&&excludedParcels.some(other=>{const ax=BigInt(other.tileX),ay=BigInt(other.tileY),aw=BigInt(other.width),ah=BigInt(other.height),overlap=left<ax+aw&&left+W>ax&&top<ay+ah&&top+H>ay,dx=Number((left+W/2n)-(ax+aw/2n)),dy=Number((top+H/2n)-(ay+ah/2n));return overlap||Math.hypot(dx,dy)<minimumSeparationTiles;}))valid=false;
    const placementRegion=`${floorDiv(left,128n)},${floorDiv(top,104n)}`;if(valid&&excludedPlacementRegions.includes(placementRegion))valid=false;
    if(valid&&woodland*4>=total*3){const ex=left+BigInt(WOODLAND_CAVE_EXTERIOR.entranceTile.x),ey=top+BigInt(WOODLAND_CAVE_EXTERIOR.entranceTile.y),ecx=floorDiv(ex,CW),ecy=floorDiv(ey,CH),site={version:SITE_BOOTSTRAP_SOCKET_D9,siteId:parcel.siteId,siteSeed:identity.digest,entrance:{chunkX:String(ecx),chunkY:String(ecy),localX:Number(ex-ecx*CW)*T+16,localY:Number(ey-ecy*CH)*T+16},siteClass:'dungeon',capabilities:['interior'],region:{regionX:page.region.regionX,regionY:page.region.regionY,biome:'woodland'},minimumLevel:copyWire(page.region.minimumLevel),provenance:{geographyVersion:page.version,chunkId:page.identity.id,placementVersion:SITE_BOOTSTRAP_PLACEMENT_D9,identityDomain:'site-bootstrap',sourceEgress:ruinSocket.provenance.sourceEgress??origin.egress.openings[0].side,routeDistanceTiles:d+6}};validateSiteSocketD9(site);parcel.socket=site;return freezeWire(parcel);}
   }
  }
  if(d===maxRouteTiles)continue;for(const [dx,dy] of [[0n,-1n],[-1n,0n],[1n,0n],[0n,1n]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(seen.has(k))continue;const next=await cell(nx,ny);if(next?.page.visual.route.centerline[next.y]?.[next.x]!=='1')continue;seen.add(k);queue.push({x:nx,y:ny,d:d+1});}
 }
 return null;
}

export function overlayWoodlandCaveParcelD10(chunk,parcel){
 if(!parcel?.pages.some(p=>p.chunkX===chunk.chunkX&&p.chunkY===chunk.chunkY))return chunk;const page=parcel.pages.find(p=>p.chunkX===chunk.chunkX&&p.chunkY===chunk.chunkY);check(parcel.version===WOODLAND_CAVE_VERSION&&page.baseDigest===chunk.identity.digest,'Cave parcel/base mismatch');
 const x0=BigInt(parcel.tileX),y0=BigInt(parcel.tileY),cx=BigInt(chunk.chunkX)*CW,cy=BigInt(chunk.chunkY)*CH,own=(x,y)=>inside(cx+BigInt(x),cy+BigInt(y),parcel),collision=chunk.collision.tiles.map(r=>[...r]),terrain=chunk.visual.terrain.map(r=>[...r]),biomes=chunk.visual.biomes.map(r=>[...r]),centerline=chunk.visual.route.centerline.map(r=>[...r]),clearance=chunk.visual.route.clearance.map(r=>[...r]);
 for(let y=0;y<26;y++)for(let x=0;x<32;x++)if(own(x,y)){const fx=Number(cx+BigInt(x)-x0),fy=Number(cy+BigInt(y)-y0);collision[y][x]=WOODLAND_CAVE_EXTERIOR.collision[fy][fx];terrain[y][x]=WOODLAND_CAVE_EXTERIOR.terrain[fy][fx];biomes[y][x]='w';centerline[y][x]=terrain[y][x]==='p'?'1':'0';clearance[y][x]=collision[y][x]==='1'?'1':'0';}
 const intersects=b=>{const bx=cx+BigInt(b.x),by=cy+BigInt(b.y);return bx<x0+W&&bx+BigInt(b.width)>x0&&by<y0+H&&by+BigInt(b.height)>y0;},blockers=chunk.visual.blockers.filter(b=>!intersects(b));for(const b of WOODLAND_CAVE_EXTERIOR.blockers){const gx=x0+BigInt(b.x),gy=y0+BigInt(b.y);blockers.push({...copyWire(b),id:`cave:${parcel.siteId}:${b.detail}`,x:Number(gx-cx),y:Number(gy-cy)});}
 const decorations=(chunk.visual.decorations??[]).filter(d=>!own(Math.floor(d.x),Math.floor(d.y)));for(const d of WOODLAND_CAVE_EXTERIOR.decorations){const gx=x0+BigInt(Math.floor(d.x)),gy=y0+BigInt(Math.floor(d.y));decorations.push({...copyWire(d),id:`cave-decoration:${parcel.siteId}:${d.kind}:${d.x},${d.y}`,x:Number(gx-cx)+(d.x-Math.floor(d.x)),y:Number(gy-cy)+(d.y-Math.floor(d.y))});}
 const anchors=chunk.anchors.filter(a=>!own(Math.floor(a.position.x/T),Math.floor(a.position.y/T))),sites=chunk.sites.filter(s=>!own(Math.floor(s.entrance.localX/T),Math.floor(s.entrance.localY/T)));if(parcel.socket.entrance.chunkX===chunk.chunkX&&parcel.socket.entrance.chunkY===chunk.chunkY)sites.push(copyWire(parcel.socket));
 return freezeWire({...copyWire(chunk),collision:{...copyWire(chunk.collision),tiles:collision.map(r=>r.join(''))},visual:{...copyWire(chunk.visual),terrain:terrain.map(r=>r.join('')),biomes:biomes.map(r=>r.join('')),blockers,decorations,route:{centerline:centerline.map(r=>r.join('')),clearance:clearance.map(r=>r.join(''))}},anchors,sites,cave:{siteId:parcel.siteId,version:parcel.version,pages:copyWire(parcel.pages)}});
}
