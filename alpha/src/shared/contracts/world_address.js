import {D9_PROFILE as P} from '../content/world_profile_d9.js';
import {closedRecord,requireContract as check,freezeWire} from './wire.js';
export function signedAddress(value){
 check(typeof value==='string'&&/^(0|[1-9][0-9]*|-[1-9][0-9]*)$/.test(value),'Noncanonical world address');
 if(value.replace('-','').length>P.coordinateDigits){const e=new RangeError('World-address extension required');e.code='WORLD_ADDRESS_EXTENSION_REQUIRED';throw e;}return value;
}
export const addressWire=value=>signedAddress(String(value));
export function floorDiv(a,b){check(typeof a==='bigint'&&typeof b==='bigint'&&b>0n,'Invalid exact floor division');const q=a/b;return a%b<0n?q-1n:q;}
export function regionAddress(chunkX,chunkY){const x=BigInt(signedAddress(chunkX)),y=BigInt(signedAddress(chunkY)),n=BigInt(P.regionChunks),rx=floorDiv(x,n),ry=floorDiv(y,n);return freezeWire({regionX:addressWire(rx),regionY:addressWire(ry),chunkX:Number(x-rx*n),chunkY:Number(y-ry*n)});}
export function validateWorldPosition(p){closedRecord(p,['chunkX','chunkY','localX','localY']);signedAddress(p.chunkX);signedAddress(p.chunkY);check(Number.isFinite(p.localX)&&p.localX>=0&&p.localX<P.chunkWidth&&Number.isFinite(p.localY)&&p.localY>=0&&p.localY<P.chunkHeight,'Invalid local world position');return p;}
export function normalizeWorldPosition(p){
 signedAddress(p.chunkX);signedAddress(p.chunkY);check(Number.isFinite(p.localX)&&Number.isFinite(p.localY),'Invalid local movement');
 const dx=Math.floor(p.localX/P.chunkWidth),dy=Math.floor(p.localY/P.chunkHeight);
 check(Number.isSafeInteger(dx)&&Number.isSafeInteger(dy),'Unbounded local movement');
 return freezeWire(validateWorldPosition({chunkX:addressWire(BigInt(p.chunkX)+BigInt(dx)),chunkY:addressWire(BigInt(p.chunkY)+BigInt(dy)),localX:p.localX-dx*P.chunkWidth,localY:p.localY-dy*P.chunkHeight}));
}
export const legacyWorldPosition=p=>normalizeWorldPosition({chunkX:'0',chunkY:'0',localX:p.x,localY:p.y});
export function relativeWorldPosition(p,origin,maxChunkDelta=8){
 validateWorldPosition(p);signedAddress(origin.chunkX);signedAddress(origin.chunkY);check(Number.isSafeInteger(maxChunkDelta)&&maxChunkDelta>=0&&maxChunkDelta<=64,'Invalid local frame radius');
 const dx=BigInt(p.chunkX)-BigInt(origin.chunkX),dy=BigInt(p.chunkY)-BigInt(origin.chunkY),limit=BigInt(maxChunkDelta);
 if(dx < -limit||dx>limit||dy < -limit||dy>limit)return null;
 return {x:Number(dx)*P.chunkWidth+p.localX,y:Number(dy)*P.chunkHeight+p.localY};
}
export function moveWorldPosition(p,dx,dy){validateWorldPosition(p);check(Number.isFinite(dx)&&Number.isFinite(dy)&&Math.abs(dx)<=P.chunkWidth&&Math.abs(dy)<=P.chunkHeight,'Unbounded frame movement');return normalizeWorldPosition({...p,localX:p.localX+dx,localY:p.localY+dy});}
