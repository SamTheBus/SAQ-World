import {collisionTileD9,collisionTileDetailD9,D9_COLLISION_VERSION} from '../contracts/paged_collision_d9.js';
export const collisionTile=(collision,x,y)=>collision.version===D9_COLLISION_VERSION?collisionTileD9(collision,x,y):collision.tiles[y]?.[x]??'0';
// World uses explicit center coordinates while retaining H4A hull radii.
export function centerDistance(first, second) {
  return Math.hypot(second.position.x - first.position.x, second.position.y - first.position.y);
}

export function clearHullGap(first, second) {
  return Math.max(0, centerDistance(first, second) - first.combatRadius - second.combatRadius);
}

// Port of main.js checkCollisionAt: a hull bounding square may not overlap
// out-of-bounds, VOID (0), or WALL (2) tiles.
export function collidesWithTiles(collision, x, y, radius) {
  const minTileX = Math.floor((x - radius) / collision.tileSize);
  const maxTileX = Math.floor((x + radius) / collision.tileSize);
  const minTileY = Math.floor((y - radius) / collision.tileSize);
  const maxTileY = Math.floor((y + radius) / collision.tileSize);
  for (let tileY = minTileY; tileY <= maxTileY; tileY++) {
    for (let tileX = minTileX; tileX <= maxTileX; tileX++) {
      if (collision.version!==D9_COLLISION_VERSION&&(tileY < 0 || tileY >= collision.height || tileX < 0 || tileX >= collision.width)) return true;
      const tile = collisionTile(collision,tileX,tileY);
      if (tile === "0" || tile === "2") return true;
    }
  }
  return false;
}

export function collisionBlockDetail(collision,x,y,radius){
  const minTileX=Math.floor((x-radius)/collision.tileSize),maxTileX=Math.floor((x+radius)/collision.tileSize),minTileY=Math.floor((y-radius)/collision.tileSize),maxTileY=Math.floor((y+radius)/collision.tileSize);
  for(let tileY=minTileY;tileY<=maxTileY;tileY++)for(let tileX=minTileX;tileX<=maxTileX;tileX++){
    if(collision.version!==D9_COLLISION_VERSION&&(tileY<0||tileY>=collision.height||tileX<0||tileX>=collision.width))return {reason:'oldFiniteBound',tileX,tileY,chunkKey:null};
    const detail=collision.version===D9_COLLISION_VERSION?collisionTileDetailD9(collision,tileX,tileY):{tile:collisionTile(collision,tileX,tileY),source:'residentPage',chunkKey:null};
    if(detail.tile==='0'||detail.tile==='2')return {reason:detail.source==='missingResidentPage'?'missingResidentPage':detail.source==='outsideLocalFrame'?'outsideLocalFrame':'genuineBlocker',tile:detail.tile,tileX,tileY,chunkKey:detail.chunkKey,localTileX:detail.localTileX,localTileY:detail.localTileY,source:detail.source};
  }
  return null;
}

export function isActorInReach(source, target) {
  return source.attackReachMode === "center"
    ? centerDistance(source, target) < source.attackReach
    : clearHullGap(source, target) <= source.attackReach;
}
