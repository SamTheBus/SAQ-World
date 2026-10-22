import {OPEN_TOWN_TEMPLATE_V1 as T} from '../content/open_town_template_v1.js';
import {blocked,frontage,propsFor} from './settlement_geometry_v1.js';
import {freezeWire,requireContract as check} from '../contracts/wire.js';
export const PLANNED_TOWN_VERSION='planned-town-tavern-candidate-v1';
export const PLANNED_TOWN_START_VERSION='planned-town-start-art-candidate-v2';
// Street junction beside the market, separated tile centers for four actors.
export const TOWN_START_TILES=freezeWire([{x:5871,y:5760},{x:5872,y:5760},{x:5871,y:5761},{x:5872,y:5761}]);
export const PLANNED_TOWN_ID='settlement-slot:town:05';
export const PLANNED_TOWN_ASSET_HASH='476acfb7307b20243b081588dd885a64dff6f20e90227020011cde946fe7293a';
// The existing Alpha reservation and water plan remain independent commitments.
export function plannedTown(asset){
 const s=asset.settlements.find(s=>s.id===PLANNED_TOWN_ID);
 check(asset.assetId==='alpha'&&s?.presetId==='town-open'&&s.tileOrigin.x===5824&&s.tileOrigin.y===5720&&s.dimensions[0]===96&&s.dimensions[1]===78,'Unsupported town reservation');
 return s;
}
const materials=new Map(),put=(x,y,type)=>{if(x>=0&&x<96&&y>=0&&y<78&&materials.get(x+','+y)!=='r')materials.set(x+','+y,type);};
for(const [points,width] of T.streets)for(let i=1;i<points.length;i++){
 const [ax,ay]=points[i-1],[bx,by]=points[i],dx=bx-ax,dy=by-ay,d=dx*dx+dy*dy;
 for(let y=Math.floor(Math.min(ay,by)-width);y<=Math.ceil(Math.max(ay,by)+width);y++)for(let x=Math.floor(Math.min(ax,bx)-width);x<=Math.ceil(Math.max(ax,bx)+width);x++){
  const f=d?Math.max(0,Math.min(1,((x+.5-ax)*dx+(y+.5-ay)*dy)/d)):0;
  if(Math.hypot(x+.5-ax-f*dx,y+.5-ay-f*dy)<=width/2)put(x,y,'r');
 }
}
for(const b of T.buildings){for(const [x,y] of b.path)put(x,y,'p');const p=b.porch;for(let y=p.y;y<p.y+p.h;y++)for(let x=p.x;x<p.x+p.w;x++)put(x,y,'p');}
// Three-tile connector: west socket (181,220) to original west street.
// Outside the core it occupies only that reserved socket. No new world edge.
export function townConnector(x,y){return x>=5805&&x<=5826&&y>=5732&&y<=5734||x>=5824&&x<=5826&&y>=5733&&y<=5765;}
export const TOWN_TAVERN=T.buildings.find(b=>b.label==='Tavern + lodging');
export const TOWN_FRONTAGE=freezeWire({x:5824+frontage(TOWN_TAVERN).x/32-.5,y:5720+frontage(TOWN_TAVERN).y/32-.5});
export function createPlannedTownTiles(asset,terrain){
 const s=plannedTown(asset),ox=s.tileOrigin.x,oy=s.tileOrigin.y;
 for(let y=0;y<78;y++)for(let x=0;x<96;x++)check(terrain.base(ox+x,oy+y).walkable,'Town cannot replace authoritative water');
 return (x,y,base)=>{
  if(x>=ox&&x<ox+96&&y>=oy&&y<oy+78){const lx=x-ox,ly=y-oy;const material=townConnector(x,y)?'r':materials.get(lx+','+ly)??'g';return {...base,collision:blocked(T,lx,ly)?'2':'1',material,route:material==='r'?2:0,town:true};}
  if(townConnector(x,y)){check(terrain.base(x,y).walkable,'Town approach cannot replace water');return {...base,collision:'1',material:'r',route:2,town:true};}
  return base;
 };
}
export function townChunkBlockers(cx,cy){
 const x=cx*32,y=cy*26,ox=5824,oy=5720;if(x+32<=ox||x>=ox+96||y+26<=oy||y>=oy+78)return [];
 // Occupancy for scenery suppression only; building collision comes from tile().
 return [{id:PLANNED_TOWN_ID+':clearing:'+cx+','+cy,kind:'civilian-clearing',x:0,y:0,width:32,height:26,detail:''},...T.buildings.filter(b=>b.x+ox<x+32&&b.x+b.w+ox>x&&b.y+oy<y+26&&b.y+b.h+oy>y).map(b=>({id:PLANNED_TOWN_ID+':'+b.id,kind:'civilian-building',x:Math.max(x,b.x+ox)-x,y:Math.max(y,b.y+oy)-y,width:Math.min(x+32,b.x+b.w+ox)-Math.max(x,b.x+ox),height:Math.min(y+26,b.y+b.h+oy)-Math.max(y,b.y+oy),detail:b.label}))];
}
export const TOWN_PROPS=propsFor(T);
