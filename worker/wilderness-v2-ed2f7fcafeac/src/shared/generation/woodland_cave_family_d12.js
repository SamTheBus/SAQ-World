import {canonicalStringify,copyWire,freezeWire,requireContract as check} from '../contracts/wire.js';
import {bytesToHex,frameUtf8,hashBytes,utf8} from '../contracts/hashing.js';
import {WOODLAND_CAVE_FAMILY_D12,WOODLAND_CAVE_FAMILY_ID,WOODLAND_CAVE_FAMILY_VERSION,WOODLAND_CAVE_GENERATOR_VERSION,WOODLAND_CAVE_MODULE_CATALOG_VERSION} from '../content/site_families_d12.js';

export const GENERATED_SITE_D12='generated-site-family-d12-v1';
export const GENERATED_FLOOR_D12='generated-site-floor-d12-v1';
const T=32;
const u32=bytes=>((((bytes[0]??0)<<24)>>>0)+((bytes[1]??0)<<16)+((bytes[2]??0)<<8)+(bytes[3]??0))>>>0;
const point=(x,y)=>({x:(x+.5)*T,y:(y+.5)*T});
const key=(x,y)=>x+','+y;

async function scoped(seed,siteId,floorIndex,domain,sha256){return hashBytes(frameUtf8([WOODLAND_CAVE_FAMILY_ID,WOODLAND_CAVE_GENERATOR_VERSION,seed,siteId,String(floorIndex),domain]),sha256);}
const pick=(bytes,n,offset=0)=>u32(bytes.slice(offset%Math.max(1,bytes.length-3),offset%Math.max(1,bytes.length-3)+4))%n;
function carveDisk(grid,cx,cy,rx,ry){for(let y=Math.max(1,cy-ry);y<Math.min(grid.length-1,cy+ry+1);y++)for(let x=Math.max(1,cx-rx);x<Math.min(grid[0].length-1,cx+rx+1);x++){const dx=(x-cx)/(rx+.25),dy=(y-cy)/(ry+.25);if(dx*dx+dy*dy<=1.08)grid[y][x]='1';}}
function carveLine(grid,a,b,width=1){let x=a.x,y=a.y;const stamp=()=>carveDisk(grid,x,y,width,width);stamp();while(x!==b.x){x+=Math.sign(b.x-x);stamp();}while(y!==b.y){y+=Math.sign(b.y-y);stamp();}}
function nearestOpen(grid,p){for(let r=0;r<8;r++)for(let y=p.y-r;y<=p.y+r;y++)for(let x=p.x-r;x<=p.x+r;x++)if(grid[y]?.[x]==='1')return {x,y};throw new Error('Generated cave anchor has no floor');}
function decorationsFor(rooms,floorSeed,floorIndex){const kinds=['cave-glow-mushrooms','cave-stalagmites','cave-rubble','cave-wall-roots','cave-remains','cave-mineral-deposit'],out=[];for(let i=0;i<rooms.length;i++){const r=rooms[i],n=(parseInt(floorSeed.slice((i*5)%56,(i*5)%56+8),16)>>>0);out.push({id:`decor:${floorIndex}:${i}:primary`,kind:kinds[n%kinds.length],x:r.cx+(n%5-2)*.18,y:r.cy+((n>>>4)%5-2)*.15,variant:(n>>>8)%3});if(i%3===1)out.push({id:`decor:${floorIndex}:${i}:mushrooms`,kind:'cave-glow-mushrooms',x:r.cx-r.rx*.45,y:r.cy+r.ry*.32,variant:(n>>>12)%3});}return out;}
function connected(rooms,edges){if(!rooms.length)return false;const seen=new Set([rooms[0].roomId]),queue=[rooms[0].roomId];while(queue.length){const id=queue.shift();for(const e of edges)if(e.from===id&&!seen.has(e.to)){seen.add(e.to);queue.push(e.to);}else if(e.to===id&&!seen.has(e.from)){seen.add(e.from);queue.push(e.from);}}return seen.size===rooms.length;}

export async function generateWoodlandCaveInstanceD12({campaignSeed,site,spawnOrdinal=0,forcedTier=null}, {sha256}){
 check(site?.siteId&&site.siteSeed&&Number.isInteger(spawnOrdinal)&&spawnOrdinal>=0,'Invalid D12 cave generation input');
 const siteBytes=await scoped(campaignSeed,site.siteId,-1,'site-tier-depth',sha256),tiers=WOODLAND_CAVE_FAMILY_D12.tiers;
 const tierName=forcedTier??(spawnOrdinal<3?['small','standard','large'][spawnOrdinal]:(pick(siteBytes,100)<6?'deep':pick(siteBytes,100)<38?'large':pick(siteBytes,100)<72?'standard':'small'));
 const tier=tiers.find(t=>t.tier===tierName);check(tier,'Unknown cave tier');const floorCount=tier.floors[0]+pick(siteBytes,tier.floors[1]-tier.floors[0]+1,4),siteSeed=bytesToHex(await scoped(campaignSeed,site.siteId,-1,'site-seed',sha256));
 const floors=[];
 for(let floorIndex=0;floorIndex<floorCount;floorIndex++){
  const b=await scoped(siteSeed,site.siteId,floorIndex,'layout',sha256),floorSeed=bytesToHex(await scoped(siteSeed,site.siteId,floorIndex,'floor-seed',sha256));
  const roomCount=tier.rooms[0]+pick(b,tier.rooms[1]-tier.rooms[0]+1,4),width=32+(tierName==='small'?0:tierName==='standard'?4:8)+(pick(b,2,8)*2),height=22+(floorCount>1?4:0)+(tierName==='deep'?4:0),grid=Array.from({length:height},()=>Array(width).fill('0'));
  const rooms=[],edges=[];let cx=Math.floor(width/2),cy=height-4;
  for(let i=0;i<roomCount;i++){
   const role=i===0?(floorIndex===0?'arrival':'stairs-up'):i===roomCount-1?(floorIndex===floorCount-1?'final-reward':'stairs-down'):i===roomCount-2?'reward-dead-end':i%4===0?'junction':i%3===0?'large-chamber':'encounter';
   if(i>0){const lane=(i%2? -1:1)*(4+pick(b,4,(i*3)%24)),targetX=Math.max(5,Math.min(width-6,Math.floor(width/2)+lane)),targetY=Math.max(4,cy-(3+pick(b,3,(i*5)%24)));cx=targetX;cy=targetY;}
   const large=role==='large-chamber'||role==='junction'||role==='final-reward',rx=large?4+pick(b,2,(i*7)%24):3+pick(b,2,(i*7)%24),ry=large?3+pick(b,2,(i*9)%24):2+pick(b,2,(i*9)%24),room={roomId:`floor-${floorIndex}-room-${i}`,role,cx,cy,rx,ry};rooms.push(room);carveDisk(grid,cx,cy,rx,ry);
   if(i){const prior=rooms[i-1];carveLine(grid,{x:prior.cx,y:prior.cy},{x:cx,y:cy},1);edges.push({edgeId:`edge:${floorIndex}:${i-1}-${i}`,from:prior.roomId,to:room.roomId,role:i%2?'turning-tunnel':'straight-tunnel'});}
  }
  if(roomCount>=6&&pick(b,3,28)!==0){const a=rooms[1],z=rooms[Math.min(roomCount-1,4)];carveLine(grid,{x:a.cx,y:a.cy},{x:z.cx,y:z.cy},1);edges.push({edgeId:`edge:${floorIndex}:loop`,from:a.roomId,to:z.roomId,role:'loop'});}
  check(connected(rooms,edges),'Disconnected cave graph');const arrival=nearestOpen(grid,{x:rooms[0].cx,y:rooms[0].cy}),last=rooms.at(-1),progress=nearestOpen(grid,{x:last.cx,y:last.cy});
  const up=floorIndex>0?{transitionId:`transition:${site.siteId}:${floorIndex}:up`,floorId:null,anchor:point(arrival.x,arrival.y)}:null,down=floorIndex<floorCount-1?{transitionId:`transition:${site.siteId}:${floorIndex}:down`,floorId:null,anchor:point(progress.x,progress.y)}:null;
  const encounterRooms=rooms.filter(r=>['encounter','large-chamber','junction'].includes(r.role)),memberCount=Math.min(WOODLAND_CAVE_FAMILY_D12.encounterPolicy.maximumMembersPerFloor,tier.threat[0]+pick(b,tier.threat[1]-tier.threat[0]+1,32)),members=[];
  for(let i=0;i<memberCount;i++){const r=encounterRooms[i%encounterRooms.length]??rooms[Math.min(i+1,rooms.length-1)],family=WOODLAND_CAVE_FAMILY_D12.encounterPolicy.families[pick(b,WOODLAND_CAVE_FAMILY_D12.encounterPolicy.families.length,(40+i*4)%Math.max(4,b.length-4))];members.push({memberKey:`member:${floorIndex}:${i}`,family,position:point(r.cx+(i%2?1:-1),r.cy+(i%3-1))});}
  const decorations=decorationsFor(rooms,floorSeed,floorIndex);if(up)decorations.push({id:`decor:${floorIndex}:stairs-up`,kind:'cave-stairs-up',x:arrival.x+.5,y:arrival.y+.5,variant:floorIndex%3});if(down)decorations.push({id:`decor:${floorIndex}:stairs-down`,kind:'cave-stairs-down',x:progress.x+.5,y:progress.y+.5,variant:floorIndex%3});
  if(floorIndex===floorCount-1)decorations.push({id:`decor:${floorIndex}:reward-nook`,kind:'cave-reward-nook',x:progress.x+.5,y:progress.y+.5,variant:0});
  const rows=grid.map(r=>r.join('')),floorId=`floor:${site.siteId}:${floorIndex}`,recipe={version:GENERATED_FLOOR_D12,floorId,index:floorIndex,floorSeed,graph:{rooms,edges},collision:{tileSize:T,width,height,tiles:[...rows]},visual:{version:'woodland-cave-generated-d12-v1',originTile:{x:0,y:0},terrain:[...rows],blockers:[],decorations},entrance:point(arrival.x,arrival.y),transitions:{up,down},encounter:{rank:WOODLAND_CAVE_FAMILY_D12.encounterPolicy.rank,members},reward:floorIndex===floorCount-1?{rewardId:`reward:${site.siteId}:${floorIndex}:0`,...WOODLAND_CAVE_FAMILY_D12.rewardPolicy,position:point(progress.x+(progress.x<width/2?2:-2),progress.y)}:null,decorationIds:decorations.map(d=>d.id)};
  floors.push(recipe);
 }
 for(let i=0;i<floors.length;i++){if(floors[i].transitions.up)floors[i].transitions.up.floorId=floors[i-1].floorId;if(floors[i].transitions.down)floors[i].transitions.down.floorId=floors[i+1].floorId;}
 const floorIds=floors.map(f=>f.floorId),layoutHash=bytesToHex(await hashBytes(utf8(canonicalStringify(floors)),sha256));
 return freezeWire({version:GENERATED_SITE_D12,familyId:WOODLAND_CAVE_FAMILY_ID,familyVersion:WOODLAND_CAVE_FAMILY_VERSION,generatorVersion:WOODLAND_CAVE_GENERATOR_VERSION,moduleCatalogVersion:WOODLAND_CAVE_MODULE_CATALOG_VERSION,siteId:site.siteId,siteSeed,sizeTier:tierName,floorCount,floorIds,layoutHash,spawnProvenance:{kind:'seed-reserved-road-socket',ordinal:spawnOrdinal,socket:copyWire(site)},encounterProvenance:{policy:copyWire(WOODLAND_CAVE_FAMILY_D12.encounterPolicy),floorMemberKeys:Object.fromEntries(floors.map(f=>[f.floorId,f.encounter.members.map(m=>m.memberKey)]))},rewardProvenance:{policy:copyWire(WOODLAND_CAVE_FAMILY_D12.rewardPolicy),rewardIds:floors.flatMap(f=>f.reward?[f.reward.rewardId]:[])},floors});
}

export function validateGeneratedWoodlandCaveD12(g){check(g?.version===GENERATED_SITE_D12&&g.familyId===WOODLAND_CAVE_FAMILY_ID&&g.generatorVersion===WOODLAND_CAVE_GENERATOR_VERSION&&g.moduleCatalogVersion===WOODLAND_CAVE_MODULE_CATALOG_VERSION&&g.floorCount===g.floors.length&&canonicalStringify(g.floorIds)===canonicalStringify(g.floors.map(f=>f.floorId))&&/^[a-f0-9]{64}$/.test(g.layoutHash),'Invalid generated cave identity');for(const [i,f] of g.floors.entries()){check(f.version===GENERATED_FLOOR_D12&&f.index===i&&f.floorId===g.floorIds[i]&&f.collision.tiles.length===f.collision.height&&f.collision.tiles.every(r=>r.length===f.collision.width)&&connected(f.graph.rooms,f.graph.edges),'Invalid generated cave floor');}return g;}
