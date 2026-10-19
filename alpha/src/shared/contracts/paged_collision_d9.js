import {D9_PROFILE as P} from '../content/world_profile_d9.js';
import {normalizeWorldPosition,relativeWorldPosition} from './world_address.js';
import {chunkAddressKey,localFramePositionD9} from './local_world_frames_d9.js';
import {requireContract as check} from './wire.js';
export const D9_COLLISION_VERSION='paged-collision-d9-v1';
const indices=new WeakMap();
const atlasIndices=new WeakMap();
function pageIndex(pages){let index=indices.get(pages);if(!index){check(Array.isArray(pages)&&pages.length<=100,'Collision residency bound');index=new Map(pages.map(p=>[chunkAddressKey(p.chunkX,p.chunkY),p]));check(index.size===pages.length,'Duplicate collision page');indices.set(pages,index);}return index;}
export function collisionTileD9(collision,tileX,tileY){
 check(collision.version===D9_COLLISION_VERSION,'Paged collision version');
 if(!Number.isSafeInteger(tileX)||!Number.isSafeInteger(tileY))return '0';
 if(collision.origin&&tileX>=0&&tileY>=0&&tileX<collision.origin.width&&tileY<collision.origin.height)return collision.origin.tiles[tileY][tileX];
 let cached=atlasIndices.get(collision);if(!cached||cached.pages!==collision.pages||cached.frames!==collision.frames){pageIndex(collision.pages);const index=new Map();for(const page of collision.pages)for(const frame of collision.frames){const p=relativeWorldPosition({chunkX:page.chunkX,chunkY:page.chunkY,localX:0,localY:0},frame,63);if(p)index.set(Math.floor((p.x+frame.offsetX)/P.chunkWidth)+','+Math.floor((p.y+frame.offsetY)/P.chunkHeight),page);}cached={pages:collision.pages,frames:collision.frames,index};atlasIndices.set(collision,cached);}
 const cx=Math.floor(tileX/32),cy=Math.floor(tileY/26),page=cached.index.get(cx+','+cy);
 return page?.tiles[tileY-cy*26]?.[tileX-cx*32]??'0';
}
export function collisionTileDetailD9(collision,tileX,tileY){
 check(collision.version===D9_COLLISION_VERSION,'Paged collision version');
 if(!Number.isSafeInteger(tileX)||!Number.isSafeInteger(tileY))return {tile:'0',source:'invalidCoordinate',chunkKey:null};
 if(collision.origin&&tileX>=0&&tileY>=0&&tileX<collision.origin.width&&tileY<collision.origin.height)return {tile:collision.origin.tiles[tileY][tileX],source:'historicalOrigin',chunkKey:null};
 // Resolve through the same local-frame atlas used by collisionTileD9. A page
 // boundary is never a blocker; only its resident tile or explicitly unknown
 // geometry can reject movement.
 collisionTileD9(collision,tileX,tileY);
 const cached=atlasIndices.get(collision),cx=Math.floor(tileX/32),cy=Math.floor(tileY/26),page=cached?.index.get(cx+','+cy);
 if(page)return {tile:page.tiles[tileY-cy*26]?.[tileX-cx*32]??'0',source:'residentPage',chunkKey:chunkAddressKey(page.chunkX,page.chunkY),localTileX:tileX-cx*32,localTileY:tileY-cy*26};
 try{const world=localFramePositionD9({x:tileX*P.tileSize+P.tileSize/2,y:tileY*P.tileSize+P.tileSize/2},collision.frames);return {tile:'0',source:'missingResidentPage',chunkKey:chunkAddressKey(world.chunkX,world.chunkY)};}
 catch{return {tile:'0',source:'outsideLocalFrame',chunkKey:null};}
}
export function worldTileD9(pages,chunkX,chunkY,tileX,tileY){const p=normalizeWorldPosition({chunkX,chunkY,localX:tileX*P.tileSize+P.tileSize/2,localY:tileY*P.tileSize+P.tileSize/2});return pageIndex(pages).get(chunkAddressKey(p.chunkX,p.chunkY))?.tiles[Math.floor(p.localY/P.tileSize)]?.[Math.floor(p.localX/P.tileSize)]??'0';}
