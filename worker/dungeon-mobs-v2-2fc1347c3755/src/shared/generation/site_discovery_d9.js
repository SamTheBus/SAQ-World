import {D9_PROFILE} from '../content/world_profile_d9.js';
import {floorDiv} from '../contracts/world_address.js';
import {copyWire,freezeWire,requireContract as check} from '../contracts/wire.js';
import {generateChunkD9} from './endless_world_d9.js';
import {worldIdentity} from './world_identity_d9.js';
import {SITE_BOOTSTRAP_SOCKET_D9,SITE_BOOTSTRAP_PLACEMENT_D9,validateSiteSocketD9} from '../contracts/site_content_d9.js';

const W=32n,H=26n;
const stepForSide=side=>side==='west'?[-1n,0n]:side==='east'?[1n,0n]:side==='north'?[0n,-1n]:[0n,1n];
const key=(x,y)=>x+','+y;
const chunkKey=(x,y)=>x+','+y;
const percentile=(values,p)=>values[Math.min(values.length-1,Math.ceil(values.length*p)-1)];
export const FUNCTIONAL_SITE_ROUTE_BOUND_D9=160;
export const FUNCTIONAL_SITE_BOOTSTRAP_POLICY_D9='conditional-woodland-site-bootstrap-d9-v1';

function centerOutside(opening){
 const cell=opening.cells[Math.floor(opening.cells.length/2)],[dx,dy]=stepForSide(opening.side);
 return {x:BigInt(cell.x)+dx,y:BigInt(cell.y)+dy};
}
function direction(dx,dy){
 const east=dx>0n?'east':dx<0n?'west':'',south=dy>0n?'south':dy<0n?'north':'';
 return south+east||'nearby';
}

// This search follows the generated route graph itself. It does not reveal or
// admit chunks, create map knowledge, bind content, or mutate campaign state.
// The same pure result is suitable for a background Worker clue and for the
// seed-wide discoverability audit.
export async function findWoodlandSiteCluesD9({seed,origin,maxRouteTiles=512},sha256){
 check(typeof seed==='string'&&seed.length<=256,'Invalid D9 clue seed');
 check(Number.isInteger(maxRouteTiles)&&maxRouteTiles>=1&&maxRouteTiles<=4096,'Invalid D9 clue distance');
 check(origin&&Number.isInteger(origin.originWidthChunks)&&Number.isInteger(origin.originHeightChunks)&&origin.egress?.version==='origin-egress-d9-v1','Invalid D9 clue origin');
 const chunks=new Map(),graphs=new Map();
 async function chunkAt(gx,gy){
  const cx=floorDiv(gx,W),cy=floorDiv(gy,H),id=chunkKey(cx,cy);
  if(cx>=0n&&cy>=0n&&cx<BigInt(origin.originWidthChunks)&&cy<BigInt(origin.originHeightChunks))return null;
  if(!chunks.has(id))chunks.set(id,generateChunkD9({seed,chunkX:String(cx),chunkY:String(cy),origin},sha256));
  return chunks.get(id);
 }
 const opposite={north:'south',south:'north',east:'west',west:'east'},delta={north:[0n,-1n],south:[0n,1n],east:[1n,0n],west:[-1n,0n]};
 function routeDistances(chunk,start){
  const route=chunk.visual.route.centerline,queue=[{...start,d:0}],seen=new Map([[start.x+','+start.y,0]]);
  for(let i=0;i<queue.length;i++){const current=queue[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=current.x+dx,y=current.y+dy,k=x+','+y;if(x<0||x>=32||y<0||y>=26||route[y][x]!=='1'||seen.has(k))continue;seen.set(k,current.d+1);queue.push({x,y,d:current.d+1});}}
  return seen;
 }
 async function graphAt(cx,cy){
  const id=chunkKey(cx,cy);if(graphs.has(id))return graphs.get(id);
  const chunk=await chunkAt(cx*W,cy*H);if(!chunk){graphs.set(id,null);return null;}
  const route=chunk.visual.route.centerline,points={};
  for(let x=0;x<32;x++){if(route[0][x]==='1')points['north:'+x]={x,y:0};if(route[25][x]==='1')points['south:'+x]={x,y:25};}
  for(let y=0;y<26;y++){if(route[y][0]==='1')points['west:'+y]={x:0,y};if(route[y][31]==='1')points['east:'+y]={x:31,y};}
  for(const site of chunk.sites??[])if(site.region.biome==='woodland')points['site:'+site.siteId]={x:Math.floor(site.entrance.localX/D9_PROFILE.tileSize),y:Math.floor(site.entrance.localY/D9_PROFILE.tileSize),site};
  const distances={};for(const [name,point] of Object.entries(points)){const seen=routeDistances(chunk,point);distances[name]=Object.fromEntries(Object.entries(points).map(([other,p])=>[other,seen.get(p.x+','+p.y)]).filter(([,d])=>Number.isInteger(d)));}
  const graph={chunk,points,distances};graphs.set(id,graph);return graph;
 }
 async function search(opening){
  const start=centerOutside(opening),cx=floorDiv(start.x,W),cy=floorDiv(start.y,H),graph=await graphAt(cx,cy);check(graph,'Origin egress points into reserved history');const sx=Number(start.x-cx*W),sy=Number(start.y-cy*H);check(graph.chunk.visual.route.centerline[sy]?.[sx]==='1','Origin egress is not connected to its generated route');
  const fromStart=routeDistances(graph.chunk,{x:sx,y:sy}),queue=[],best=new Map();
  for(const [pointName,point] of Object.entries(graph.points)){const d=fromStart.get(point.x+','+point.y);if(Number.isInteger(d)){queue.push({cx,cy,pointName,d});best.set(chunkKey(cx,cy)+'/'+pointName,d);}}
  while(queue.length){queue.sort((a,b)=>a.d-b.d||a.pointName.localeCompare(b.pointName));const current=queue.shift(),stateKey=chunkKey(current.cx,current.cy)+'/'+current.pointName;if(best.get(stateKey)!==current.d)continue;if(current.d>maxRouteTiles)break;const currentGraph=await graphAt(current.cx,current.cy);if(!currentGraph)continue;
   const point=currentGraph.points[current.pointName];if(point?.site){const targetX=current.cx*W+BigInt(point.x),targetY=current.cy*H+BigInt(point.y);return freezeWire({side:opening.side,start:{tileX:String(start.x),tileY:String(start.y)},siteId:point.site.siteId,target:{chunkX:point.site.entrance.chunkX,chunkY:point.site.entrance.chunkY,localX:point.site.entrance.localX,localY:point.site.entrance.localY},distanceTiles:current.d,direction:direction(targetX-start.x,targetY-start.y)});}
   for(const [nextName,cost] of Object.entries(currentGraph.distances[current.pointName]??{})){const d=current.d+cost,k=chunkKey(current.cx,current.cy)+'/'+nextName;if(d<=maxRouteTiles&&d<(best.get(k)??Infinity)){best.set(k,d);queue.push({cx:current.cx,cy:current.cy,pointName:nextName,d});}}
   const [side,index]=current.pointName.split(':');if(Object.hasOwn(delta,side)){const [dx,dy]=delta[side],nextCx=current.cx+dx,nextCy=current.cy+dy,nextName=opposite[side]+':'+index,d=current.d+1,k=chunkKey(nextCx,nextCy)+'/'+nextName,nextGraph=await graphAt(nextCx,nextCy);if(nextGraph?.points[nextName]&&d<=maxRouteTiles&&d<(best.get(k)??Infinity)){best.set(k,d);queue.push({cx:nextCx,cy:nextCy,pointName:nextName,d});}}
  }
  return null;
 }
 const clues=[];for(const opening of origin.egress.openings){const clue=await search(opening);clues.push(clue??freezeWire({side:opening.side,start:Object.fromEntries(Object.entries(centerOutside(opening)).map(([k,v])=>['tile'+k[0].toUpperCase()+k.slice(1),String(v)])),siteId:null,target:null,distanceTiles:null,direction:null}));}
 return freezeWire({version:'woodland-site-clues-d9-v1',profile:D9_PROFILE.version,maxRouteTiles,clues,generatedChunks:chunks.size});
}

export function summarizeWoodlandSiteDistancesD9(rows,practicalWindowTiles){
 const distances=rows.flatMap(row=>row.clues.map(clue=>clue.distanceTiles).filter(Number.isInteger)).sort((a,b)=>a-b),expected=rows.reduce((n,row)=>n+row.clues.length,0),missing=expected-distances.length,outside=missing+distances.filter(value=>value>practicalWindowTiles).length;
 check(distances.length>0,'No Woodland site routes were found');
 return freezeWire({campaigns:rows.length,egresses:expected,practicalWindowTiles,median:percentile(distances,.5),p95:percentile(distances,.95),maximum:distances.at(-1),noEligibleWithinWindow:outside,notFoundWithinSearch:missing});
}

// This policy is evaluated from the campaign seed and the immutable origin
// egress contract. It never observes resident chunks, discovery, load order or
// participant movement. Ordinary chunk generation remains untouched: the one
// derived socket is overlaid only when no ordinary eligible socket satisfies
// the accepted route-distance bound.
export async function planFunctionalSiteBootstrapD9({seed,origin,maxRouteTiles=FUNCTIONAL_SITE_ROUTE_BOUND_D9},sha256){
 check(typeof seed==='string'&&seed.length<=256,'Invalid D9 bootstrap seed');
 check(maxRouteTiles===FUNCTIONAL_SITE_ROUTE_BOUND_D9,'Invalid D9 bootstrap route bound');
 check(origin&&Number.isInteger(origin.originWidthChunks)&&Number.isInteger(origin.originHeightChunks)&&origin.egress?.version==='origin-egress-d9-v1','Invalid D9 bootstrap origin');
 const chunks=new Map(),queue=[],seen=new Map(),parents=new Map(),candidates=[],ordinary=[];
 const reserved=(cx,cy)=>cx>=0n&&cy>=0n&&cx<BigInt(origin.originWidthChunks)&&cy<BigInt(origin.originHeightChunks);
 async function chunkAt(cx,cy){const id=chunkKey(cx,cy);if(reserved(cx,cy))return null;if(!chunks.has(id))chunks.set(id,generateChunkD9({seed,chunkX:String(cx),chunkY:String(cy),origin},sha256));return chunks.get(id);}
 const enqueue=(x,y,d,side,parent=null)=>{const id=key(x,y),old=seen.get(id);if(old&&(old.d<d||old.d===d&&old.side.localeCompare(side)<=0))return;seen.set(id,{d,side});parents.set(id,parent);queue.push({x,y,d,side});};
 for(const opening of [...origin.egress.openings].sort((a,b)=>a.side.localeCompare(b.side))){const start=centerOutside(opening),cx=floorDiv(start.x,W),cy=floorDiv(start.y,H),chunk=await chunkAt(cx,cy),x=Number(start.x-cx*W),y=Number(start.y-cy*H);check(chunk&&chunk.visual.route.centerline[y]?.[x]==='1','Origin egress is not connected to its generated route');enqueue(start.x,start.y,0,opening.side);}
 search:for(let cursor=0;cursor<queue.length;cursor++){
  const current=queue[cursor],id=key(current.x,current.y),best=seen.get(id);if(!best||best.d!==current.d||best.side!==current.side||current.d>maxRouteTiles)continue;
  const cx=floorDiv(current.x,W),cy=floorDiv(current.y,H),chunk=await chunkAt(cx,cy),x=Number(current.x-cx*W),y=Number(current.y-cy*H);if(!chunk||chunk.visual.route.centerline[y]?.[x]!=='1')continue;
  for(const site of chunk.sites??[]){const sx=Math.floor(site.entrance.localX/D9_PROFILE.tileSize),sy=Math.floor(site.entrance.localY/D9_PROFILE.tileSize);if(sx===x&&sy===y&&site.region.biome==='woodland'){ordinary.push({site,d:current.d,side:current.side,node:id});break search;}}
  if(chunk.visual.biomes[y]?.[x]==='w'&&x>=3&&x<=28&&y>=3&&y<=22){const separated=(chunk.sites??[]).every(site=>Math.hypot(site.entrance.localX/D9_PROFILE.tileSize-.5-x,site.entrance.localY/D9_PROFILE.tileSize-.5-y)>=4);if(separated)candidates.push({chunk,x,y,d:current.d,side:current.side,node:id});}
  if(current.d===maxRouteTiles)continue;
  for(const [dx,dy] of [[1n,0n],[-1n,0n],[0n,1n],[0n,-1n]]){const nx=current.x+dx,ny=current.y+dy,ncx=floorDiv(nx,W),ncy=floorDiv(ny,H),next=await chunkAt(ncx,ncy);if(!next)continue;const lx=Number(nx-ncx*W),ly=Number(ny-ncy*H);if(next.visual.route.centerline[ly]?.[lx]==='1')enqueue(nx,ny,current.d+1,current.side,id);}
 }
 const select=(rows,score)=>[...rows].sort((a,b)=>score(a)-score(b)||a.side.localeCompare(b.side)||a.node.localeCompare(b.node))[0]??null;
 const existing=select(ordinary,row=>row.d);
 let bootstrap=null,selected=existing;
 if(!existing){
  // Aim for a short but visible walk. The distance preference affects only
  // which existing route tile receives the socket; it never carves or blocks.
  selected=select(candidates,row=>Math.abs(row.d-48));check(selected,'No valid route-connected Woodland bootstrap placement within 160 route tiles');
  const identity=await worldIdentity(seed,'site-bootstrap',[SITE_BOOTSTRAP_PLACEMENT_D9],sha256),chunk=selected.chunk;
  bootstrap={version:SITE_BOOTSTRAP_SOCKET_D9,siteId:'site:'+identity.digest.slice(0,32),siteSeed:identity.digest,entrance:{chunkX:chunk.chunkX,chunkY:chunk.chunkY,localX:(selected.x+.5)*D9_PROFILE.tileSize,localY:(selected.y+.5)*D9_PROFILE.tileSize},siteClass:'dungeon',capabilities:['interior'],region:{regionX:chunk.region.regionX,regionY:chunk.region.regionY,biome:'woodland'},minimumLevel:copyWire(chunk.region.minimumLevel),provenance:{geographyVersion:D9_PROFILE.version,chunkId:chunk.identity.id,placementVersion:SITE_BOOTSTRAP_PLACEMENT_D9,identityDomain:'site-bootstrap',sourceEgress:selected.side,routeDistanceTiles:selected.d}};validateSiteSocketD9(bootstrap);
 }
 const route=[];for(let id=selected.node;id;id=parents.get(id)){const [x,y]=id.split(',');route.push({tileX:x,tileY:y});}route.reverse();
 const target=bootstrap??existing.site,targetCell={x:BigInt(target.entrance.chunkX)*W+BigInt(Math.floor(target.entrance.localX/D9_PROFILE.tileSize)),y:BigInt(target.entrance.chunkY)*H+BigInt(Math.floor(target.entrance.localY/D9_PROFILE.tileSize))},start=route[0];
 const clue={side:selected.side,start:{tileX:start.tileX,tileY:start.tileY},siteId:target.siteId,target:copyWire(target.entrance),distanceTiles:selected.d,direction:direction(targetCell.x-BigInt(start.tileX),targetCell.y-BigInt(start.tileY))};
 return freezeWire({version:FUNCTIONAL_SITE_BOOTSTRAP_POLICY_D9,profile:D9_PROFILE.version,maxRouteTiles,ordinaryQualified:Boolean(existing),bootstrap,guaranteedCandidate:copyWire(target),clues:[clue],route,generatedChunks:chunks.size});
}

export function overlayFunctionalSiteBootstrapD9(chunk,plan){
 const site=plan?.bootstrap;if(!site||site.entrance.chunkX!==chunk.chunkX||site.entrance.chunkY!==chunk.chunkY)return chunk;
 const existing=chunk.sites.find(value=>value.siteId===site.siteId);if(existing){check(JSON.stringify(existing)===JSON.stringify(site),'Bootstrap socket identity collision');return chunk;}
 return freezeWire({...copyWire(chunk),sites:[...copyWire(chunk.sites),copyWire(site)].sort((a,b)=>a.siteId.localeCompare(b.siteId))});
}
