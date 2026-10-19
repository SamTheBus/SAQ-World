import {environmentSeed,terrainHash,environmentWorldOffset} from './environment_motifs.js';
import {naturalVisualKind} from '../shared/generation/natural_clusters_v1.js';
const intersects=(a,b,p=0)=>a.x<b.x+b.w+p&&a.x+a.w>b.x-p&&a.y<b.y+b.h+p&&a.y+a.h>b.y-p;
const blockerIdentity=b=>b.id??`legacy-obstacle:${b.kind}:${b.x}:${b.y}:${b.width}:${b.height}`;
export const obstacleTileVisualId=(b,tx,ty,visualKind=b.kind==='rock'?'rock':'base')=>`${blockerIdentity(b)}/${visualKind}/${tx},${ty}`;
export const obstacleTileVisualCoverage=(_b,visualKind)=>visualKind==='solid'?1:visualKind==='tree'?0.92:visualKind==='rock'?0.86:0.88;
export const woodlandCanopyAt=(n,tx,ty,seed=0)=>{const pocket=terrainHash(Math.floor(tx/3),Math.floor(ty/3),seed+409)%100,local=(n>>>8)%100,threshold=pocket<28?82:pocket>76?34:58;return local<threshold;};
export const naturalCanopyAt=(n,tx,ty,seed=0)=>{const score=terrainHash(tx,ty,seed+419);return score%100<76&&[[1,0],[-1,0],[0,1],[0,-1]].every(([dx,dy])=>score<terrainHash(tx+dx,ty+dy,seed+419));};
export const naturalBasePose=(n,tx,ty,t)=>{const size=t+6+(n>>>14)%9;return {x:tx*t+t/2-size/2+(n%11-5),y:ty*t+t/2-size/2+((n>>>6)%11-5),w:size,h:size};};
export const naturalRockPose=(n,tx,ty,t)=>{const size=t+5+(n>>>14)%10;return {x:tx*t+t/2-size/2+(n%11-5),y:ty*t+t/2-size/2+((n>>>6)%9-4),size};};
export const naturalMarshPose=(n,tx,ty,t)=>{const p=naturalRockPose(n,tx,ty,t);return {...p,y:p.y-10};};
export function woodlandLandmarkForBlocker(space,b){
 if(b.naturalClusterId||(b.kind!=='thicket'&&b.kind!=='trees')||b.width*b.height<4)return null;const t=space.collision.tileSize,seed=environmentSeed(space),offset=environmentWorldOffset(space),v=space.visual,ox=v.originTile?.x??0,oy=v.originTile?.y??0,left=Math.floor(b.x),top=Math.floor(b.y),right=Math.ceil(b.x+b.width)-1,bottom=Math.ceil(b.y+b.height)-1,n=terrainHash(left+offset.x/t,top+offset.y/t,seed+887);if(n%29!==0)return null;
 const candidates=[[left+Math.floor((right-left)/2),bottom],[right,top+Math.floor((bottom-top)/2)],[left+Math.floor((right-left)/2),top],[left,top+Math.floor((bottom-top)/2)]],chosen=candidates[(n>>>6)%candidates.length],code=v.biomes?.[chosen[1]-oy]?.[chosen[0]-ox]??'w';if(code!=='w')return null;const types=['ruin','shrine','camp','shelter','cart','signpost'],type=types[(n>>>10)%types.length];return {id:`${blockerIdentity(b)}/landmark`,obstacleId:b.id??null,tileX:chosen[0],tileY:chosen[1],x:(chosen[0]+.5)*t,y:(chosen[1]+.72)*t,n,type};
}
export function createEnvironmentLayout(space){const work=prepareEnvironmentLayout(space);let next;do{next=work.next();}while(!next.done);return next.value;}
export function* prepareEnvironmentLayout(space){
 const t=space.collision.tileSize,v=space.visual,seed=environmentSeed(space),offset=environmentWorldOffset(space),ox=v.originTile?.x??0,oy=v.originTile?.y??0;
 const terrain=(x,y)=>v.terrain[Math.floor(y/t)-oy]?.[Math.floor(x/t)-ox],biome=(tx,ty)=>v.biomes?.[ty-oy]?.[tx-ox]??null;
 const blocks=v.blockers.map(b=>({...b,source:b,id:b.id??`legacy-obstacle:${b.kind}:${b.x}:${b.y}:${b.width}:${b.height}`,x:b.x*t,y:b.y*t,w:b.width*t,h:b.height*t})),major=blocks.filter(b=>b.kind==='building'||b.kind==='fence');
 const occupied=new Set();for(const b of blocks)for(let y=Math.floor(b.y/t);y<Math.ceil((b.y+b.h)/t);y++)for(let x=Math.floor(b.x/t);x<Math.ceil((b.x+b.w)/t);x++)occupied.add(x+','+y);
 const exits=space.exits??[],treeBases=[],trees=[],rocks=[],props=[],landmarks=[],obstacleTiles=new Set();
 const clearGround=(x,y,r)=>{for(const [dx,dy] of [[0,0],[-r,-r],[r,-r],[-r,r],[r,r]]){const type=terrain(x+dx,y+dy);if(type!=='g'&&type!=='f'||occupied.has(Math.floor((x+dx)/t)+','+Math.floor((y+dy)/t)))return false;}return !exits.some(e=>Math.hypot(e.x-x,e.y-y)<r+65);};
 for(const b of blocks){
  yield;
  if(b.kind==='building'){
   const candidates=[[b.x-17,b.y+b.h-21],[b.x+b.w+17,b.y+b.h-21],[b.x+17,b.y+b.h+19],[b.x+b.w-17,b.y+b.h+19]];
   for(const [x,y] of candidates){if(props.filter(p=>p.building===b).length>=2)break;if(!clearGround(x,y,13)||props.some(p=>Math.hypot(p.x-x,p.y-y)<26))continue;props.push({x,y,building:b,type:(terrainHash(b.x+offset.x,b.y+offset.y,seed)+props.filter(p=>p.building===b).length)%2?'clay_pot':b.detail==='Vault'?'ancient_urn':'wooden_barrel'});}
  }else if(b.kind==='thicket'||b.kind==='trees'||b.kind==='rock'){
   // Authored/origin groves retain the valid "trees" kind in existing worlds.
   // One readable obstacle occupies every authoritative blocked tile. Earlier
   // layout thinning and road-overlap pruning could expose an apparently open
   // square while collision still contained a wall.
   const landmark=woodlandLandmarkForBlocker(space,b.source),left=Math.floor(b.x/t),top=Math.floor(b.y/t),right=Math.ceil((b.x+b.w)/t),bottom=Math.ceil((b.y+b.h)/t);
   for(let ty=top;ty<bottom;ty++)for(let tx=left;tx<right;tx++){
    const key=tx+','+ty,n=terrainHash(tx+offset.x/t,ty+offset.y/t,seed+113),code=biome(tx,ty)??(b.kind==='rock'?'r':'w');obstacleTiles.add(key);
    if(naturalVisualKind(code,b.kind)==='rock'){const id=obstacleTileVisualId(b,tx,ty,'rock');rocks.push({id,obstacleId:b.id,...(b.naturalClusterId?naturalRockPose(n,tx,ty,t):{x:tx*t-2,y:ty*t+2,size:t+4}),n,biome:code,organic:Boolean(b.naturalClusterId),tileX:tx,tileY:ty});}
    else if(code==='m'){const id=obstacleTileVisualId(b,tx,ty,'tree');trees.push({id,obstacleId:b.id,...(b.naturalClusterId?naturalMarshPose(n,tx,ty,t):{x:tx*t-8+(n%3-1),y:ty*t-15+((n>>>4)%3-1),size:t+16}),n,biome:'marsh',tileX:tx,tileY:ty,scattered:false});}
    else{const id=obstacleTileVisualId(b,tx,ty,'base');treeBases.push({id,obstacleId:b.id,...(b.naturalClusterId?naturalBasePose(n,tx,ty,t):{x:tx*t,y:ty*t,w:t,h:t}),n,biome:'woodland',tileX:tx,tileY:ty});if((!landmark||landmark.tileX!==tx||landmark.tileY!==ty)&&(b.naturalClusterId?naturalCanopyAt:woodlandCanopyAt)(n,tx+offset.x/t,ty+offset.y/t,seed))trees.push({id:`${b.id}/canopy/${tx},${ty}`,baseId:id,obstacleId:b.id,x:tx*t-11+(n%9-4),y:ty*t-18+((n>>>4)%7-3),size:t+18+(n>>>12)%7,n,biome:'woodland',tileX:tx,tileY:ty,scattered:false});}
   }
   if(landmark)landmarks.push(landmark);
  }
 }
 treeBases.sort((a,b)=>a.y-b.y||a.x-b.x);trees.sort((a,b)=>(a.y+a.size)-(b.y+b.size)||a.x-b.x);rocks.sort((a,b)=>(a.y+a.size)-(b.y+b.size)||a.x-b.x);landmarks.sort((a,b)=>a.y-b.y||a.x-b.x);
 const obstacles=[...treeBases,...trees.filter(p=>p.biome==='marsh').map(p=>({...p,w:p.size,h:p.size})),...rocks.map(p=>({...p,w:p.size,h:p.size}))];
 return {treeBases,trees,rocks,props,landmarks,obstacleTiles,occupiedTiles:occupied,clearGround,allowsSmall:(x,y)=>clearGround(x,y,9)&&!obstacles.some(p=>intersects({x:x-3,y:y-3,w:6,h:6},{x:p.x,y:p.y,w:p.w,h:p.h},2))&&!props.some(p=>Math.hypot(x-p.x,y-p.y)<19)};
}
