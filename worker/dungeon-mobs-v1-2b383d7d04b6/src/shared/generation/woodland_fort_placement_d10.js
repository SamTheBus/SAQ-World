import {floorDiv} from '../contracts/world_address.js';
import {copyWire,freezeWire,requireContract as check} from '../contracts/wire.js';
import {generateChunkD9} from './endless_world_d9.js';
import {worldIdentity} from './world_identity_d9.js';
import {SITE_BOOTSTRAP_SOCKET_D9,SITE_BOOTSTRAP_PLACEMENT_D9,validateSiteSocketD9} from '../contracts/site_content_d9.js';
import {WOODLAND_FORT_TEMPLATE,WOODLAND_FORT_VERSION} from '../content/woodland_fort_d10.js';

const CW=32n,CH=26n,T=32;
const key=(x,y)=>x+','+y;
const inside=(x,y,p)=>x>=BigInt(p.tileX)&&x<BigInt(p.tileX)+48n&&y>=BigInt(p.tileY)&&y<BigInt(p.tileY)+36n;
const chunkAtTile=(x,y)=>({chunkX:String(floorDiv(x,CW)),chunkY:String(floorDiv(y,CH))});
export const fortParcelOwnsWorldPositionD10=(parcel,p)=>Boolean(parcel&&inside(BigInt(p.chunkX)*CW+BigInt(Math.floor(p.localX/T)),BigInt(p.chunkY)*CH+BigInt(Math.floor(p.localY/T)),parcel));

// A parcel is selected from the seed's road graph, never from admission order.
// The 48x36 authored footprint spans exactly four 32x26 pages. The socket is
// the road tile immediately outside the south gate, not a site-transition pad.
export async function planWoodlandFortParcelD10({seed,origin,ruinSocket,maxRouteTiles=160},sha256){
 check(ruinSocket?.siteId&&maxRouteTiles>=1&&maxRouteTiles<=512,'Fort reservation input');
 const cache=new Map();
 async function chunk(cx,cy){const id=key(cx,cy);if(!cache.has(id)){
  if(cx>=0n&&cy>=0n&&cx<BigInt(origin.originWidthChunks)&&cy<BigInt(origin.originHeightChunks))cache.set(id,null);
  else cache.set(id,await generateChunkD9({seed,chunkX:String(cx),chunkY:String(cy),origin},sha256));
 }return cache.get(id);}
 async function cell(x,y){const cx=floorDiv(x,CW),cy=floorDiv(y,CH),page=await chunk(cx,cy);if(!page)return null;return {page,x:Number(x-cx*CW),y:Number(y-cy*CH)};}
 const startX=BigInt(ruinSocket.entrance.chunkX)*CW+BigInt(Math.floor(ruinSocket.entrance.localX/T));
 const startY=BigInt(ruinSocket.entrance.chunkY)*CH+BigInt(Math.floor(ruinSocket.entrance.localY/T));
 const queue=[{x:startX,y:startY,d:0}],seen=new Set([key(startX,startY)]);
 for(let i=0;i<queue.length;i++){
  const {x,y,d}=queue[i],at=await cell(x,y);if(!at||at.page.visual.route.centerline[at.y][at.x]!=='1')continue;
  const authored=(at.page.sites??[]).filter(site=>site.siteId!==ruinSocket.siteId&&site.region.biome==='woodland'&&site.entrance.localX/T-.5===at.x&&site.entrance.localY/T-.5===at.y);
  const candidates=[...authored];
  if(d>=48&&d<=160&&at.page.region.biome==='woodland'){
   const identity=await worldIdentity(seed,'site-bootstrap',[WOODLAND_FORT_VERSION,'fort'],sha256),site={version:SITE_BOOTSTRAP_SOCKET_D9,siteId:'site:'+identity.digest.slice(0,32),siteSeed:identity.digest,entrance:{chunkX:at.page.chunkX,chunkY:at.page.chunkY,localX:(at.x+.5)*T,localY:(at.y+.5)*T},siteClass:'dungeon',capabilities:['interior'],region:{regionX:at.page.region.regionX,regionY:at.page.region.regionY,biome:'woodland'},minimumLevel:copyWire(at.page.region.minimumLevel),provenance:{geographyVersion:at.page.version,chunkId:at.page.identity.id,placementVersion:SITE_BOOTSTRAP_PLACEMENT_D9,identityDomain:'site-bootstrap',sourceEgress:ruinSocket.provenance.sourceEgress??origin.egress.openings[0].side,routeDistanceTiles:d}};
   validateSiteSocketD9(site);candidates.push(site);
  }
  for(const site of candidates){
   const p={version:WOODLAND_FORT_VERSION,siteId:site.siteId,socket:copyWire(site),tileX:String(x-23n),tileY:String(y-35n),pages:[],routeDistanceTiles:d};
   const left=BigInt(p.tileX),top=BigInt(p.tileY),right=left+47n,bottom=top+35n;
   const x0=floorDiv(left,CW),x1=floorDiv(right,CW),y0=floorDiv(top,CH),y1=floorDiv(bottom,CH);
   if(x1-x0!==1n||y1-y0!==1n)continue;
   const outside=await cell(x,y+1n);if(outside?.page.visual.route.centerline[outside.y]?.[outside.x]!=='1')continue;
   let woodland=0,total=0,valid=!inside(startX,startY,p);
   for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++){
    const part=await chunk(cx,cy);if(!part){valid=false;break;}
    p.pages.push({chunkX:String(cx),chunkY:String(cy),baseDigest:part.identity.digest});
    for(const other of part.sites??[])if(other.siteId===ruinSocket.siteId)valid=false;
   }
   if(!valid)continue;
   for(let yy=top-2n;yy<=bottom+2n;yy++)for(let xx=left-2n;xx<=right+2n;xx++){
    const sample=await cell(xx,yy);if(!sample){valid=false;break;}
    if(sample.page.visual.biomes[sample.y][sample.x]==='w')woodland++;total++;
   }
   // The whole parcel is overwritten as Woodland. A Woodland majority in the
   // footprint and its margin keeps the clearing out of marsh-dominant land.
   if(valid&&woodland*5>=total*3)return freezeWire(p);
  }
  if(d===maxRouteTiles)continue;
  for(const [dx,dy] of [[0n,-1n],[-1n,0n],[1n,0n],[0n,1n]]){
   const nx=x+dx,ny=y+dy,k=key(nx,ny);if(seen.has(k))continue;
   const next=await cell(nx,ny);if(next?.page.visual.route.centerline[next.y]?.[next.x]!=='1')continue;
   seen.add(k);queue.push({x:nx,y:ny,d:d+1});
  }
 }
 return null;
}

export function overlayWoodlandFortParcelD10(chunk,parcel){
 if(!parcel?.pages.some(p=>p.chunkX===chunk.chunkX&&p.chunkY===chunk.chunkY))return chunk;
 check(parcel.version===WOODLAND_FORT_VERSION&&parcel.pages.some(p=>p.chunkX===chunk.chunkX&&p.chunkY===chunk.chunkY&&p.baseDigest===chunk.identity.digest),'Fort parcel/base mismatch');
 const x0=BigInt(parcel.tileX),y0=BigInt(parcel.tileY),cx=BigInt(chunk.chunkX)*CW,cy=BigInt(chunk.chunkY)*CH;
 const collision=chunk.collision.tiles.map(r=>[...r]),terrain=chunk.visual.terrain.map(r=>[...r]),biomes=chunk.visual.biomes.map(r=>[...r]);
 const centerline=chunk.visual.route.centerline.map(r=>[...r]),clearance=chunk.visual.route.clearance.map(r=>[...r]);
 const own=(x,y)=>inside(cx+BigInt(x),cy+BigInt(y),parcel);
 for(let y=0;y<26;y++)for(let x=0;x<32;x++)if(own(x,y)){
  const fx=Number(cx+BigInt(x)-x0),fy=Number(cy+BigInt(y)-y0);
  collision[y][x]=WOODLAND_FORT_TEMPLATE.collision.tiles[fy][fx];
  terrain[y][x]=WOODLAND_FORT_TEMPLATE.visual.terrain[fy][fx];biomes[y][x]='w';
  centerline[y][x]=terrain[y][x]==='p'?'1':'0';clearance[y][x]=collision[y][x]==='1'?'1':'0';
 }
 const intersects=b=>{const bx=cx+BigInt(b.x),by=cy+BigInt(b.y);return bx<x0+48n&&bx+BigInt(b.width)>x0&&by<y0+36n&&by+BigInt(b.height)>y0;};
 const blockers=chunk.visual.blockers.filter(b=>!intersects(b));
 for(const b of WOODLAND_FORT_TEMPLATE.visual.blockers){
  const gx=x0+BigInt(b.x),gy=y0+BigInt(b.y),lx=Number(gx-cx),ly=Number(gy-cy),left=Math.max(0,lx),top=Math.max(0,ly),right=Math.min(32,lx+b.width),bottom=Math.min(26,ly+b.height);
  if(right>left&&bottom>top)blockers.push({...copyWire(b),id:`fort:${parcel.siteId}:${b.kind}:${b.x},${b.y}:${chunk.chunkX},${chunk.chunkY}`,x:left,y:top,width:right-left,height:bottom-top});
 }
 const decorations=(chunk.visual.decorations??[]).filter(d=>!own(Math.floor(d.x),Math.floor(d.y)));
 for(const d of WOODLAND_FORT_TEMPLATE.visual.decorations??[]){const gx=x0+BigInt(Math.floor(d.x)),gy=y0+BigInt(Math.floor(d.y));if(gx<cx||gx>=cx+CW||gy<cy||gy>=cy+CH)continue;decorations.push({...copyWire(d),id:`fort-decoration:${parcel.siteId}:${d.kind}:${d.x},${d.y}`,x:Number(gx-cx)+(d.x-Math.floor(d.x)),y:Number(gy-cy)+(d.y-Math.floor(d.y))});}
 const anchors=chunk.anchors.filter(a=>!own(Math.floor(a.position.x/T),Math.floor(a.position.y/T)));
 const sites=chunk.sites.filter(s=>s.siteId===parcel.siteId||!own(Math.floor(s.entrance.localX/T),Math.floor(s.entrance.localY/T)));
 if(parcel.socket.entrance.chunkX===chunk.chunkX&&parcel.socket.entrance.chunkY===chunk.chunkY&&!sites.some(s=>s.siteId===parcel.siteId))sites.push(copyWire(parcel.socket));
 return freezeWire({...copyWire(chunk),collision:{...copyWire(chunk.collision),tiles:collision.map(r=>r.join(''))},visual:{...copyWire(chunk.visual),terrain:terrain.map(r=>r.join('')),biomes:biomes.map(r=>r.join('')),blockers,decorations,route:{centerline:centerline.map(r=>r.join('')),clearance:clearance.map(r=>r.join(''))}},anchors,sites,compound:{siteId:parcel.siteId,version:parcel.version,pages:copyWire(parcel.pages)}});
}
