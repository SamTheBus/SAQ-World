import {canonicalStringify,copyWire,freezeWire,requireContract as check} from '../contracts/wire.js';
import {bytesToHex,frameUtf8,hashBytes,utf8} from '../contracts/hashing.js';
import {WOODLAND_CAVE_FAMILY_ID} from '../content/site_families_d12.js';
import {WOODLAND_CAVE_FAMILY_D12_1,WOODLAND_CAVE_FAMILY_VERSION_D12_1,WOODLAND_CAVE_GENERATOR_VERSION_D12_1} from '../content/site_families_d12_1.js';
import {WOODLAND_CAVE_MODULE_CATALOG_D12_1_VERSION,WOODLAND_CAVE_MODULES_BY_ID_D12_1,validateWoodlandCaveModuleCatalogD12_1} from '../content/woodland_cave_modules_d12_1.js';

export const GENERATED_SITE_D12_1='generated-site-family-d12-1-v1';
export const GENERATED_FLOOR_D12_1='generated-site-floor-d12-1-v1';
const T=32,W=62,H=47;
const u32=bytes=>((((bytes[0]??0)<<24)>>>0)+((bytes[1]??0)<<16)+((bytes[2]??0)<<8)+(bytes[3]??0))>>>0;
const pick=(bytes,n,offset=0)=>u32(bytes.slice(offset%Math.max(1,bytes.length-3),offset%Math.max(1,bytes.length-3)+4))%n;
const point=(x,y)=>({x:(x+.5)*T,y:(y+.5)*T});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const gridPoint=(x,y)=>({x,y});
const rolesEncounter=new Set(['small-encounter','large-encounter','junction']);

async function scoped(seed,siteId,floorIndex,domain,sha256){return hashBytes(frameUtf8([WOODLAND_CAVE_FAMILY_ID,WOODLAND_CAVE_GENERATOR_VERSION_D12_1,seed,siteId,String(floorIndex),domain]),sha256);}

export function selectWeightedWoodlandCaveTierD12_1(bytes,family=WOODLAND_CAVE_FAMILY_D12_1){
 const total=family.tiers.reduce((n,t)=>n+t.weight,0);check(Number.isInteger(total)&&total>0&&family.tiers.every(t=>Number.isInteger(t.weight)&&t.weight>0),'Invalid Cave tier weights');
 let roll=u32(bytes)%total;for(const tier of family.tiers){if(roll<tier.weight)return tier.tier;roll-=tier.weight;}throw new Error('Cave weighted tier selection failed');
}

export async function deriveWoodlandCaveIdentityD12_1({campaignSeed,site,geographicQualifier='Alderwood Road'},{sha256}){
 const tierBytes=await scoped(campaignSeed,site.siteId,-1,'site-tier',sha256),tier=selectWeightedWoodlandCaveTierD12_1(tierBytes),siteSeed=bytesToHex(await scoped(campaignSeed,site.siteId,-1,'site-seed',sha256)),layoutSeed=bytesToHex(await scoped(siteSeed,site.siteId,-1,'canonical-layout',sha256));
 return freezeWire({tier,siteSeed,layoutSeed,geographicQualifier,label:`Woodland Cave · ${geographicQualifier}`});
}

function roleFor(index,count,floorIndex,floorCount){
 if(index===0)return floorIndex===0?'arrival':'stairs-up';
 if(index===count-1)return floorIndex===floorCount-1?'final-reward':'stairs-down';
 if(index===count-2&&count>=5)return 'reward-dead-end';
 if(index===Math.floor(count/2)&&count>=6)return 'junction';
 return index%3===0?'large-encounter':'small-encounter';
}
const moduleIdFor=role=>({arrival:'arrival-chamber','small-encounter':'small-encounter-chamber','large-encounter':'large-encounter-chamber',junction:'junction-chamber','reward-dead-end':'reward-dead-end','stairs-up':'stairs-up-chamber','stairs-down':'stairs-down-chamber','final-reward':'final-reward-chamber'})[role];
const slots=Object.freeze([[0,0],[1,0],[2,0],[3,0],[2,1],[1,1],[0,1],[1,2],[2,2],[3,2]]);

function stampRoom(grid,owners,module,origin,owner){
 const cells=[];for(let y=0;y<module.dimensions.height;y++)for(let x=0;x<module.dimensions.width;x++)if(module.collisionMask[y][x]==='1'){const gx=origin.x+x,gy=origin.y+y,k=gx+','+gy;check(!owners.has(k),'Overlapping Cave module interiors');owners.set(k,owner);grid[gy][gx]='1';cells.push(k);}return cells;
}
function carveWidth3(grid,owners,edgeId,cells){
 const written=[];for(const cell of cells)for(let o=-1;o<=1;o++){const x=cell.x+(cell.axis==='v'?o:0),y=cell.y+(cell.axis==='h'?o:0),k=x+','+y;if(x<=0||x>=W-1||y<=0||y>=H-1)continue;const prior=owners.get(k);if(prior?.startsWith('room:'))continue;check(!prior||prior===edgeId,'Undeclared Cave corridor intersection');owners.set(k,edgeId);grid[y][x]='1';written.push(k);}return written;
}
function connectorBetween(grid,owners,a,b,edgeId,index){
 const modules=[],cells=[];
 const horizontal=(x0,x1,y)=>{const step=Math.sign(x1-x0);for(let x=x0;x!==x1+step;x+=step)cells.push({x,y,axis:'h'});};
 const vertical=(y0,y1,x)=>{const step=Math.sign(y1-y0);for(let y=y0;y!==y1+step;y+=step)cells.push({x,y,axis:'v'});};
 if(a.cy===b.cy){horizontal(a.cx+Math.sign(b.cx-a.cx)*5,b.cx-Math.sign(b.cx-a.cx)*5,a.cy);modules.push({moduleInstanceId:`module:${edgeId}:straight`,moduleId:'straight-tunnel',role:'straight-tunnel',rotation:b.cx>a.cx?0:180,bounds:{x:Math.min(a.cx,b.cx)+5,y:a.cy-1,width:6,height:3},connects:[a.roomId,b.roomId]});}
 else if(a.cx===b.cx){vertical(a.cy+Math.sign(b.cy-a.cy)*5,b.cy-Math.sign(b.cy-a.cy)*5,a.cx);modules.push({moduleInstanceId:`module:${edgeId}:straight`,moduleId:'straight-tunnel',role:'straight-tunnel',rotation:b.cy>a.cy?90:270,bounds:{x:a.cx-1,y:Math.min(a.cy,b.cy)+5,width:3,height:6},connects:[a.roomId,b.roomId]});}
 else{
  const sy=a.cy+Math.sign(b.cy-a.cy)*5,turnY=b.cy,ex=b.cx-Math.sign(b.cx-a.cx)*5;vertical(sy,turnY,a.cx);horizontal(a.cx,ex,turnY);
  modules.push({moduleInstanceId:`module:${edgeId}:turn`,moduleId:'turning-tunnel',role:'turning-tunnel',rotation:b.cx<a.cx?90:0,bounds:{x:Math.min(a.cx,ex)-1,y:Math.min(sy,turnY)-1,width:Math.abs(ex-a.cx)+3,height:Math.abs(turnY-sy)+3},connects:[a.roomId,b.roomId]});
 }
 carveWidth3(grid,owners,edgeId,cells);return modules;
}
function connected(rooms,edges){const seen=new Set([rooms[0]?.roomId]),queue=[rooms[0]?.roomId];while(queue.length){const id=queue.shift();for(const e of edges){const next=e.from===id?e.to:e.to===id?e.from:null;if(next&&!seen.has(next)){seen.add(next);queue.push(next);}}}return seen.size===rooms.length;}
function reachable(grid,start,target){const q=[start],seen=new Set([start.x+','+start.y]);for(let i=0;i<q.length;i++){const p=q[i];if(p.x===target.x&&p.y===target.y)return true;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy,k=x+','+y;if(grid[y]?.[x]!=='1'||seen.has(k))continue;seen.add(k);q.push({x,y});}}return false;}
function decorationKind(role,seed){const byRole={arrival:['cave-wall-roots','cave-rubble'],['small-encounter']:['cave-glow-mushrooms','cave-stalagmites'],['large-encounter']:['cave-stalagmites','cave-mineral-deposit'],junction:['cave-wall-roots','cave-glow-mushrooms'],['reward-dead-end']:['cave-remains','cave-mineral-deposit'],['stairs-up']:['cave-rubble'],['stairs-down']:['cave-wall-roots'],['final-reward']:['cave-reward-nook','cave-glow-mushrooms']};const list=byRole[role]??['cave-rubble'];return list[seed%list.length];}
function floorMotifs(grid,b,floorIndex){const open=[];for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(grid[y][x]==='1')open.push({x,y});const kinds=['earth-patch','floor-shadow','crack','light-shaft','damp-patch'];const out=[];for(let i=0;i<Math.min(18,Math.max(8,Math.floor(open.length/45)));i++){const p=open[pick(b,open.length,10+i*3)];out.push({motifId:`motif:${floorIndex}:${i}`,kind:kinds[pick(b,kinds.length,11+i*5)],x:p.x+.5,y:p.y+.5,scale:.65+(pick(b,50,12+i*7)/100),rotation:(pick(b,628,13+i*2)-314)/100});}return out;}

function assembleFloor({site,floorIndex,floorCount,roomCount,tier,b,floorSeed}){
 const grid=Array.from({length:H},()=>Array(W).fill('0')),owners=new Map(),rooms=[],modules=[],edges=[];
 const mirror=pick(b,2,3)===1;
 for(let i=0;i<roomCount;i++){
  const slot=slots[i],col=mirror?3-slot[0]:slot[0],cx=8+15*col,cy=8+15*slot[1],role=roleFor(i,roomCount,floorIndex,floorCount),module=WOODLAND_CAVE_MODULES_BY_ID_D12_1[moduleIdFor(role)],origin={x:cx-4,y:cy-4},roomId=`floor-${floorIndex}-room-${i}`,bounds={x:origin.x,y:origin.y,width:9,height:9};
  const openCells=stampRoom(grid,owners,module,origin,'room:'+roomId);const room={roomId,role,moduleId:module.moduleId,cx,cy,bounds,sockets:module.sockets.map(s=>({...copyWire(s),x:origin.x+s.x,y:origin.y+s.y})),decorationAnchors:module.anchors.decorations.map(a=>({x:origin.x+a.x,y:origin.y+a.y})),encounterAnchors:module.anchors.encounters.map(a=>({x:origin.x+a.x,y:origin.y+a.y})),reservedZones:module.reservedZones.map(z=>({...copyWire(z),x:origin.x+z.x,y:origin.y+z.y})),openCells};rooms.push(room);modules.push({moduleInstanceId:`module:${roomId}`,moduleId:module.moduleId,role,rotation:0,reflection:mirror?'horizontal':'none',bounds:copyWire(bounds),connects:[]});
  if(i){const prior=rooms[i-1],edgeId=`edge:${floorIndex}:${i-1}-${i}`;modules.push(...connectorBetween(grid,owners,prior,room,edgeId,i));edges.push({edgeId,from:prior.roomId,to:room.roomId,role:modules.at(-1).role,declaredSockets:[prior.roomId+':out',room.roomId+':in']});}
 }
 check(connected(rooms,edges),'Disconnected Cave module graph');
 const arrival=gridPoint(rooms[0].cx,rooms[0].cy),last=rooms.at(-1),progress=gridPoint(last.cx,last.cy),up=floorIndex>0?{transitionId:`transition:${site.siteId}:${floorIndex}:up`,floorId:null,anchor:point(arrival.x,arrival.y)}:null,down=floorIndex<floorCount-1?{transitionId:`transition:${site.siteId}:${floorIndex}:down`,floorId:null,anchor:point(progress.x,progress.y)}:null;
 const reward=floorIndex===floorCount-1?{rewardId:`reward:${site.siteId}:${floorIndex}:0`,...WOODLAND_CAVE_FAMILY_D12_1.rewardPolicy,position:point(progress.x+(mirror?-2:2),progress.y)}:null;
 const reserved=[arrival,progress,...(reward?[{x:reward.position.x/T-.5,y:reward.position.y/T-.5}]:[])],encounterRooms=rooms.filter(r=>rolesEncounter.has(r.role)),members=[],used=[];
 const memberCount=Math.min(WOODLAND_CAVE_FAMILY_D12_1.encounterPolicy.maximumMembersPerFloor,tier.threat[0]+pick(b,tier.threat[1]-tier.threat[0]+1,27));
 for(let i=0;i<memberCount;i++){
  const room=encounterRooms[i%Math.max(1,encounterRooms.length)]??rooms[Math.min(i+1,rooms.length-2)];let anchor=null;for(let n=0;n<room.encounterAnchors.length;n++){const candidate=room.encounterAnchors[(n+pick(b,room.encounterAnchors.length,31+i))%room.encounterAnchors.length];if(reserved.every(p=>distance(p,candidate)>=3)&&used.every(p=>distance(p,candidate)>=WOODLAND_CAVE_FAMILY_D12_1.encounterPolicy.minimumSeparationTiles)){anchor=candidate;break;}}check(anchor,'Cave encounter anchors crowded');used.push(anchor);reserved.push(anchor);members.push({memberKey:`member:${floorIndex}:${i}`,family:WOODLAND_CAVE_FAMILY_D12_1.encounterPolicy.families[pick(b,WOODLAND_CAVE_FAMILY_D12_1.encounterPolicy.families.length,36+i*4)],position:point(anchor.x,anchor.y),roomId:room.roomId});
 }
 const decorations=[];for(const [i,room] of rooms.entries()){
  const density=room.role==='large-encounter'||room.role==='final-reward'?2:1;for(let n=0;n<density;n++){const anchor=room.decorationAnchors[(pick(b,room.decorationAnchors.length,19+i*5)+n)%room.decorationAnchors.length];if(reserved.some(p=>distance(p,anchor)<3)||decorations.some(d=>distance(d,anchor)<2.4))continue;const kind=decorationKind(room.role,pick(b,256,22+i*7+n));decorations.push({id:`decor:${floorIndex}:${i}:${n}`,kind,x:anchor.x+.5,y:anchor.y+.5,variant:pick(b,3,25+i+n),roomId:room.roomId});}
 }
 if(up)decorations.push({id:`decor:${floorIndex}:slope-up`,kind:'cave-slope-up',x:arrival.x+.5,y:arrival.y+.5,variant:floorIndex%3,interactionDecoration:true});
 if(down)decorations.push({id:`decor:${floorIndex}:slope-down`,kind:'cave-slope-down',x:progress.x+.5,y:progress.y+.5,variant:floorIndex%3,interactionDecoration:true});
 if(reward)decorations.push({id:`decor:${floorIndex}:reward-nook`,kind:'cave-reward-nook',x:progress.x+.5,y:progress.y+.5,variant:0,interactionDecoration:true});
 check(rooms.every(room=>reachable(grid,arrival,{x:room.cx,y:room.cy}))&&reachable(grid,arrival,progress),'Unreachable Cave module anchor');
 const rows=grid.map(row=>row.join('')),floorId=`floor:${site.siteId}:${floorIndex}`;
 return {version:GENERATED_FLOOR_D12_1,floorId,index:floorIndex,floorSeed,graph:{rooms,edges,modules,assembly:{version:'bounded-authored-module-assembly-d12-1-v1',attempt:pick(b,8,1),fallback:false}},collision:{tileSize:T,width:W,height:H,tiles:rows},visual:{version:'woodland-cave-generated-d12-1-v1',originTile:{x:0,y:0},terrain:[...rows],blockers:[],decorations,motifs:floorMotifs(grid,b,floorIndex)},entrance:point(arrival.x,arrival.y),transitions:{up,down},encounter:{rank:WOODLAND_CAVE_FAMILY_D12_1.encounterPolicy.rank,members},reward,decorationIds:decorations.map(d=>d.id)};
}

export async function generateWoodlandCaveInstanceD12_1({campaignSeed,site,reservation=null,spawnOrdinal=0,evidenceFixture=null},{sha256}){
 validateWoodlandCaveModuleCatalogD12_1();check(site?.siteId&&site.siteSeed&&Number.isInteger(spawnOrdinal)&&spawnOrdinal>=0,'Invalid D12.1 Cave generation input');
 const derived=await deriveWoodlandCaveIdentityD12_1({campaignSeed,site,geographicQualifier:reservation?.geographicQualifier??'Alderwood Road'},{sha256}),tierName=evidenceFixture?.forcedTier??reservation?.tier??derived.tier;tierName&&check(WOODLAND_CAVE_FAMILY_D12_1.tiers.some(t=>t.tier===tierName),'Unknown Cave tier');
 if(evidenceFixture!==null)check(evidenceFixture?.fixtureVersion==='cave-tier-evidence-d12-1-v1'&&Object.keys(evidenceFixture).every(k=>['fixtureVersion','forcedTier'].includes(k)),'Production Cave tier override rejected');
 if(reservation){check(reservation.tier===derived.tier&&reservation.layoutSeed===derived.layoutSeed&&reservation.siteSeed===derived.siteSeed,'Reserved Cave identity drift');}
 const tier=WOODLAND_CAVE_FAMILY_D12_1.tiers.find(t=>t.tier===tierName),siteBytes=await scoped(campaignSeed,site.siteId,-1,'site-depth',sha256),floorCount=tier.floors[0]+pick(siteBytes,tier.floors[1]-tier.floors[0]+1,4),floors=[];
 for(let floorIndex=0;floorIndex<floorCount;floorIndex++){const b=await scoped(derived.layoutSeed,site.siteId,floorIndex,'module-layout',sha256),floorSeed=bytesToHex(await scoped(derived.layoutSeed,site.siteId,floorIndex,'floor-seed',sha256)),roomCount=tier.rooms[0]+pick(b,tier.rooms[1]-tier.rooms[0]+1,5);floors.push(assembleFloor({site,floorIndex,floorCount,roomCount,tier,b,floorSeed}));}
 for(let i=0;i<floors.length;i++){if(floors[i].transitions.up)floors[i].transitions.up.floorId=floors[i-1].floorId;if(floors[i].transitions.down)floors[i].transitions.down.floorId=floors[i+1].floorId;}
 const floorIds=floors.map(f=>f.floorId),layoutHash=bytesToHex(await hashBytes(utf8(canonicalStringify(floors)),sha256));
 return freezeWire({version:GENERATED_SITE_D12_1,familyId:WOODLAND_CAVE_FAMILY_ID,familyVersion:WOODLAND_CAVE_FAMILY_VERSION_D12_1,generatorVersion:WOODLAND_CAVE_GENERATOR_VERSION_D12_1,moduleCatalogVersion:WOODLAND_CAVE_MODULE_CATALOG_D12_1_VERSION,siteId:site.siteId,siteSeed:derived.siteSeed,layoutSeed:derived.layoutSeed,sizeTier:tierName,geographicQualifier:derived.geographicQualifier,label:derived.label,floorCount,floorIds,layoutHash,spawnProvenance:{kind:'seed-regional-road-reservation',ordinal:spawnOrdinal,socket:copyWire(site)},layoutProvenance:{layoutSeed:derived.layoutSeed,moduleCatalogVersion:WOODLAND_CAVE_MODULE_CATALOG_D12_1_VERSION},encounterProvenance:{policy:copyWire(WOODLAND_CAVE_FAMILY_D12_1.encounterPolicy),floorMemberKeys:Object.fromEntries(floors.map(f=>[f.floorId,f.encounter.members.map(m=>m.memberKey)]))},rewardProvenance:{policy:copyWire(WOODLAND_CAVE_FAMILY_D12_1.rewardPolicy),rewardIds:floors.flatMap(f=>f.reward?[f.reward.rewardId]:[])},floors});
}

export function validateGeneratedWoodlandCaveD12_1(g){
 check(g?.version===GENERATED_SITE_D12_1&&g.familyId===WOODLAND_CAVE_FAMILY_ID&&g.familyVersion===WOODLAND_CAVE_FAMILY_VERSION_D12_1&&g.generatorVersion===WOODLAND_CAVE_GENERATOR_VERSION_D12_1&&g.moduleCatalogVersion===WOODLAND_CAVE_MODULE_CATALOG_D12_1_VERSION&&g.floorCount===g.floors.length&&canonicalStringify(g.floorIds)===canonicalStringify(g.floors.map(f=>f.floorId))&&/^[a-f0-9]{64}$/.test(g.layoutHash)&&/^[a-f0-9]{64}$/.test(g.layoutSeed),'Invalid generated D12.1 Cave identity');
 const tier=WOODLAND_CAVE_FAMILY_D12_1.tiers.find(t=>t.tier===g.sizeTier);check(tier&&g.floorCount>=tier.floors[0]&&g.floorCount<=tier.floors[1]&&g.label===`Woodland Cave · ${g.geographicQualifier}`,'Invalid generated D12.1 Cave tier/label');
 for(const [i,f] of g.floors.entries()){
  check(f.version===GENERATED_FLOOR_D12_1&&f.index===i&&f.floorId===g.floorIds[i]&&f.collision.width===W&&f.collision.height===H&&f.collision.tiles.length===H&&f.collision.tiles.every(row=>row.length===W&&/^[01]+$/.test(row))&&canonicalStringify(f.visual.terrain)===canonicalStringify(f.collision.tiles)&&connected(f.graph.rooms,f.graph.edges),'Invalid generated D12.1 Cave floor');
  check(f.graph.rooms.length>=tier.rooms[0]&&f.graph.rooms.length<=tier.rooms[1]&&f.graph.rooms.every((room,a)=>f.graph.rooms.every((other,b)=>a===b||room.bounds.x+room.bounds.width<=other.bounds.x||other.bounds.x+other.bounds.width<=room.bounds.x||room.bounds.y+room.bounds.height<=other.bounds.y||other.bounds.y+other.bounds.height<=room.bounds.y)),'Overlapping or out-of-tier Cave rooms');
  const actorTiles=f.encounter.members.map(m=>({x:m.position.x/T-.5,y:m.position.y/T-.5}));check(actorTiles.every((a,n)=>actorTiles.every((b,m)=>n===m||distance(a,b)>=3)),'Crowded Cave encounter anchors');
  const fixed=[{x:f.entrance.x/T-.5,y:f.entrance.y/T-.5},...Object.values(f.transitions).filter(Boolean).map(t=>({x:t.anchor.x/T-.5,y:t.anchor.y/T-.5})),...(f.reward?[{x:f.reward.position.x/T-.5,y:f.reward.position.y/T-.5}]:[])];check(f.visual.decorations.filter(d=>!d.interactionDecoration).every(d=>fixed.every(p=>distance(d,p)>=3)&&actorTiles.every(p=>distance(d,p)>=3)),'Cave decoration exclusion violated');
 }
 return g;
}
