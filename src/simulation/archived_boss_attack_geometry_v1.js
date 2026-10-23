// Source-aligned combat geometry adapted to seeded SAQ World dungeon floors.
// Original programs: Hooktail, Cinderhart, Nexus and Corrosive playable arenas.
// It does not change floor tiles or grant authority to Canvas presentation.
import {collidesWithTiles} from '../shared/rules/world_geometry.js';

export const clip=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
export const range=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const facing=(from,to)=>to.x<from.x?-1:1;
export function segmentDistance(p,a,b) {
 const dx=b.x-a.x,dy=b.y-a.y,length2=dx*dx+dy*dy;
 if(length2===0)return range(p,a);
 const t=clip(((p.x-a.x)*dx+(p.y-a.y)*dy)/length2);
 return Math.hypot(p.x-(a.x+dx*t),p.y-(a.y+dy*t));
}
export function originalFireCone(origin,target,person,rangeLimit=110,halfAngle=.8,hull=9){
 const dx=person.x-origin.x,dy=person.y-origin.y,d=Math.hypot(dx,dy);
 if(d>rangeLimit+hull)return false;
 // The archived dragon faces horizontally: its breath is a real cone, not
 // a centered circle on the hero's position.
 const s=facing(origin,target),dot=dx*s;
 if(dot < -hull)return false;
 if(d<=hull)return true;
 const angular=Math.atan2(Math.abs(dy),dot);
 return angular<=halfAngle+Math.asin(Math.min(1,hull/d));
}
export function originalCinderRushEndpoint(collision,origin,target,radius=28){
 const dx=target.x-origin.x,dy=target.y-origin.y,d=Math.hypot(dx,dy)||1;
 const nx=dx/d,ny=dy/d,max=Math.min(220,d+64);
 let end={x:origin.x,y:origin.y};
 for(let length=4;length<=max;length+=4){
  const next={x:origin.x+nx*length,y:origin.y+ny*length};
  if(!sweptPathClear(collision,origin,next,radius))break;
  end=next;
 }
 return end;
}
// Sweep a square hull across blocked tiles. Tested against the archived
// Cinderhart clear-path contract rather than merely checking the endpoint.
export function sweptPathClear(collision,from,to,radius=12){
 if(!collision||collidesWithTiles(collision,from.x,from.y,radius)||collidesWithTiles(collision,to.x,to.y,radius))return false;
 const d=range(from,to),steps=Math.max(1,Math.ceil(d/Math.max(3,collision.tileSize/6)));
 for(let i=1;i<steps;i++){
  const p={x:from.x+(to.x-from.x)*i/steps,y:from.y+(to.y-from.y)*i/steps};
  if(collidesWithTiles(collision,p.x,p.y,radius))return false;
 }
 return true;
}
export function originalArenaRing(collision,home,index){
 // Original Hooktail ring is min=2+index and max=(arena size)-3-index.
 // World sites have irregular seeded footprints; use an isolated bounded
 // chamber around the boss, never modify the immutable floor collision.
 if(!Number.isInteger(index)||index<0||index>7)return null;
 const s=collision.tileSize,cols=collision.width,rows=collision.height;
 const centerX=Math.floor(home.x/s),centerY=Math.floor(home.y/s);
 const half=Math.min(9,Math.floor((Math.min(cols,rows)-4)/2));
 const minColumn=Math.max(0,centerX-half+2+index),maxColumn=Math.min(cols-1,centerX+half-2-index);
 const minRow=Math.max(0,centerY-half+2+index),maxRow=Math.min(rows-1,centerY+half-2-index);
 if(minColumn>=maxColumn||minRow>=maxRow)return null;
 const ring={index,minColumn,maxColumn,minRow,maxRow,tileSize:s};
 const tiles=originalRingTiles(ring).filter(p=>!collidesWithTiles(collision,p.x+s/2,p.y+s/2,s/5));
 return tiles.length?{...ring,tiles}:null;
}
export function originalRingTiles(r) {
 const out=[],s=r.tileSize;
 for(let col=r.minColumn;col<=r.maxColumn;col++){
  out.push({column:col,row:r.minRow,x:col*s,y:r.minRow*s,size:s});
  out.push({column:col,row:r.maxRow,x:col*s,y:r.maxRow*s,size:s});
 }
 for(let row=r.minRow+1;row<r.maxRow;row++){
  out.push({column:r.minColumn,row,x:r.minColumn*s,y:row*s,size:s});
  out.push({column:r.maxColumn,row,x:r.maxColumn*s,y:row*s,size:s});
 }
 return out;
}
export function onOriginalRing(r,p){
 if(!r?.tiles?.length)return false;
 const col=Math.floor(p.x/r.tileSize),row=Math.floor(p.y/r.tileSize);
 return r.tiles.some(tile=>tile.column===col&&tile.row===row);
}
export const poisonPercentHp=maxHp=>Math.max(1,Math.round(maxHp*.012));
