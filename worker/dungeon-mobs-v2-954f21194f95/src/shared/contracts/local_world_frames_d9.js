import {D9_PROFILE as P} from '../content/world_profile_d9.js';
import {signedAddress,addressWire,relativeWorldPosition,normalizeWorldPosition,validateWorldPosition} from './world_address.js';
import {freezeWire,requireContract as check} from './wire.js';
// A bounded computation atlas, never a space identity or a saved world address.
// Nearby participants share one frame; distant components occupy separated
// atlas cells so the existing local hull/attack algorithms remain unchanged.
const FRAME_CHUNKS=64,STRIDE=FRAME_CHUNKS*2*P.chunkWidth;
const abs=n=>n<0n?-n:n;
export function planLocalFramesD9(participants,{keepOrigin=false,preparationAnchor=false}={}){
 check(participants.length>=Number(!keepOrigin)&&participants.length<=(preparationAnchor?5:4)&&(!preparationAnchor||participants.filter(p=>p.playerId==='destination-preparation').length===1),'D9 participant frame bound');
 const sorted=[...participants].sort((a,b)=>a.playerId.localeCompare(b.playerId));for(const p of sorted)validateWorldPosition(p.position);
 const parent=sorted.map((_,i)=>i),find=i=>parent[i]===i?i:(parent[i]=find(parent[i]));
 const mergeChunks=2*P.preloadRadiusChunks+2;
 for(let i=0;i<sorted.length;i++)for(let j=i+1;j<sorted.length;j++)if(abs(BigInt(sorted[i].position.chunkX)-BigInt(sorted[j].position.chunkX))<=BigInt(mergeChunks)&&abs(BigInt(sorted[i].position.chunkY)-BigInt(sorted[j].position.chunkY))<=BigInt(mergeChunks))parent[find(j)]=find(i);
 const components=new Map();for(let i=0;i<sorted.length;i++){const root=find(i);if(!components.has(root))components.set(root,[]);components.get(root).push(sorted[i]);}
 const groups=[...components.values()],originPlayers=keepOrigin?groups.filter(ps=>ps.some(p=>abs(BigInt(p.position.chunkX))<=32n&&abs(BigInt(p.position.chunkY))<=32n)).flat():[];
 const remote=groups.filter(ps=>!originPlayers.includes(ps[0]));
 return freezeWire([...(keepOrigin?[{id:0,chunkX:'0',chunkY:'0',offsetX:0,offsetY:0,playerIds:originPlayers.map(p=>p.playerId)}]:[]),...remote.map((ps,j)=>{const i=j+(keepOrigin?1:0);return {id:i,chunkX:ps[0].position.chunkX,chunkY:ps[0].position.chunkY,offsetX:i*STRIDE+FRAME_CHUNKS*P.chunkWidth,offsetY:FRAME_CHUNKS*P.chunkHeight,playerIds:ps.map(p=>p.playerId)};})]);
}
export function projectToLocalFrameD9(position,frames){validateWorldPosition(position);const origin=frames.find(f=>f.originBounds);if(origin&&BigInt(position.chunkX)>=-2n&&BigInt(position.chunkY)>=-2n&&BigInt(position.chunkX)<BigInt(origin.originBounds.width)+2n&&BigInt(position.chunkY)<BigInt(origin.originBounds.height)+2n){const p=relativeWorldPosition(position,origin,FRAME_CHUNKS-1);if(p)return {frameId:origin.id,x:p.x+origin.offsetX,y:p.y+origin.offsetY};}let best=null,bestDistance=Infinity;for(const f of frames){const p=relativeWorldPosition(position,f,FRAME_CHUNKS-1);if(p){const distance=Math.hypot(p.x,p.y);if(distance<bestDistance){best={frameId:f.id,x:p.x+f.offsetX,y:p.y+f.offsetY};bestDistance=distance;}}}return best;}
export function localFramePositionD9(position,frames){const f=frames.find(f=>position.x>=f.offsetX-FRAME_CHUNKS*P.chunkWidth&&position.x<f.offsetX+FRAME_CHUNKS*P.chunkWidth&&position.y>=f.offsetY-FRAME_CHUNKS*P.chunkHeight&&position.y<f.offsetY+FRAME_CHUNKS*P.chunkHeight);check(f,'Position outside computation atlas');return normalizeWorldPosition({chunkX:f.chunkX,chunkY:f.chunkY,localX:position.x-f.offsetX,localY:position.y-f.offsetY});}
export function chunkAddressKey(x,y){return signedAddress(x)+','+signedAddress(y);}
export function participantWindowsD9(participants,radius=P.residentRadiusChunks){
 check(Number.isSafeInteger(radius)&&radius>=0&&radius<=P.preloadRadiusChunks,'World window radius');const chunks=new Map();
 for(const p of participants){validateWorldPosition(p.position);for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++){const chunkX=addressWire(BigInt(p.position.chunkX)+BigInt(x)),chunkY=addressWire(BigInt(p.position.chunkY)+BigInt(y)),key=chunkAddressKey(chunkX,chunkY),distance=Math.max(Math.abs(x),Math.abs(y));const old=chunks.get(key);if(!old||distance<old.distance)chunks.set(key,{chunkX,chunkY,distance});}}
 return chunks;
}
export function rebaseLocalPointD9(point,oldFrames,newFrames){const world=localFramePositionD9(point,oldFrames),next=projectToLocalFrameD9(world,newFrames);check(next,'Live point left admitted frames');return {x:next.x,y:next.y};}
