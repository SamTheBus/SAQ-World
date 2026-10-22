import {requirePlan} from './planned_world_foundation_v1.js';
export const OUTDOOR_BRIDGE_VERSION='outdoor-timber-bridge-v1';
// A deck changes the traversable surface, not the underlying hydrology.
// Global tile coordinates make reconstruction independent of chunk residency.
export function createOutdoorBridgeDecks(records,terrain){
 const tiles=new Map();
 for(const bridge of records){
  const {start:a,end:b,widthTiles:w}=bridge,dx=Math.sign(b.x-a.x),dy=Math.sign(b.y-a.y);
  requirePlan(/^bridge:[a-f0-9]+$/.test(bridge.id)&&[3,5].includes(w)&&((dx!==0)!==(dy!==0))&&Math.abs(b.x-a.x)+Math.abs(b.y-a.y)<=20,'Invalid outdoor bridge geometry');
  requirePlan(bridge.orientation===(dx?'horizontal':'vertical'),'Bridge orientation mismatch');
  requirePlan(bridge.underlyingHydrologyPreserved===true&&terrain.base(a.x,a.y).walkable&&terrain.base(b.x,b.y).walkable,'Invalid bridge banks');
  let river=false;const length=Math.abs(b.x-a.x)+Math.abs(b.y-a.y),r=(w-1)/2;
  for(let n=0;n<=length;n++)for(let cross=-r;cross<=r;cross++){
   const x=a.x+dx*n-dy*cross,y=a.y+dy*n+dx*cross,c=terrain.base(x,y);
   requirePlan(c.landmassId===bridge.landmassId&&(c.walkable||c.kind==='river'),'Bridge cannot cross ocean, lake, or another landmass');
   if(c.kind==='river')river=true;
   const key=x+','+y;if(!tiles.has(key))tiles.set(key,{id:bridge.id,material:dx?'H':'V',underlyingKind:c.kind,version:OUTDOOR_BRIDGE_VERSION});
  }
  requirePlan(river,'Bridge must cross a local channel');
 }
 return tiles;
}
