import {serviceNpcsFor} from '../content/settlement_services_v2.js';
import {VILLAGE_TEMPLATE_V1 as T} from '../content/village_template_v1.js';
import {LIFE_VILLAGE_ID as ID,LIFE_VILLAGE_ORIGIN as O,LIFE_NPCS} from '../content/settlement_life_alpha_v1.js';
import {blocked,propsFor} from './settlement_geometry_v1.js';
import {requireContract as check} from '../contracts/wire.js';
export const VILLAGE_PROPS=propsFor(T);
const materials=new Map(),put=(x,y,type)=>{if(x>=0&&y>=0&&x<64&&y<52&&materials.get(x+','+y)!=='r')materials.set(x+','+y,type);};
for(const [points,width] of T.streets)for(let i=1;i<points.length;i++){
 const [ax,ay]=points[i-1],[bx,by]=points[i],dx=bx-ax,dy=by-ay,d=dx*dx+dy*dy;
 for(let y=Math.floor(Math.min(ay,by)-width);y<=Math.ceil(Math.max(ay,by)+width);y++)for(let x=Math.floor(Math.min(ax,bx)-width);x<=Math.ceil(Math.max(ax,bx)+width);x++){
  const f=d?Math.max(0,Math.min(1,((x+.5-ax)*dx+(y+.5-ay)*dy)/d)):0;if(Math.hypot(x+.5-ax-f*dx,y+.5-ay-f*dy)<=width/2)put(x,y,'r');
 }
}
for(const b of T.buildings){for(const [x,y] of b.path)put(x,y,'p');const p=b.porch;for(let y=p.y;y<p.y+p.h;y++)for(let x=p.x;x<p.x+p.w;x++)put(x,y,'p');}
// Only the existing west approach socket (139,292). The east street ends at
// the reservation edge; it does not create a new overland connection.
export const villageConnector=(x,y)=>x>=4464&&x<=4482&&y>=7604&&y<=7606||x>=4480&&x<=4482&&y>=7605&&y<=7625;
export const exteriorNpcAt=(x,y,binding)=>serviceNpcsFor(binding).some(n=>n.space==='exterior'&&n.tile.x===x&&n.tile.y===y);
export function createPlannedVillageTiles(asset,terrain,binding){
 const s=asset.settlements.find(s=>s.id===ID);check(s?.presetId==='village'&&s.tileOrigin.x===O.x&&s.tileOrigin.y===O.y&&s.dimensions.join(',')==='64,52','Village reservation binding drift');
 for(let y=0;y<52;y++)for(let x=0;x<64;x++)check(terrain.base(O.x+x,O.y+y).walkable,'Village cannot replace water');
 return (x,y,b)=>{
  if(x>=O.x&&x<O.x+64&&y>=O.y&&y<O.y+52){const lx=x-O.x,ly=y-O.y,material=villageConnector(x,y)?'r':materials.get(lx+','+ly)??'g';return {...b,collision:blocked(T,lx,ly)||exteriorNpcAt(x,y,binding)?'2':'1',material,route:material==='r'||material==='p'?2:0,town:true};}
  if(villageConnector(x,y)){check(terrain.base(x,y).walkable,'Village approach cannot replace water');return {...b,collision:'1',material:'r',route:2,town:true};}
  if(exteriorNpcAt(x,y,binding))return {...b,collision:'2'};
  return b;
 };
}
export function villageChunkBlockers(cx,cy){const x=cx*32,y=cy*26;if(x+32<=O.x||x>=O.x+64||y+26<=O.y||y>=O.y+52)return [];
 return [{id:ID+':clearing:'+cx+','+cy,kind:'civilian-clearing',x:0,y:0,width:32,height:26,detail:''},...T.buildings.filter(b=>b.x+O.x<x+32&&b.x+b.w+O.x>x&&b.y+O.y<y+26&&b.y+b.h+O.y>y).map(b=>({id:ID+':'+b.id,kind:'civilian-building',x:Math.max(x,b.x+O.x)-x,y:Math.max(y,b.y+O.y)-y,width:Math.min(x+32,b.x+b.w+O.x)-Math.max(x,b.x+O.x),height:Math.min(y+26,b.y+b.h+O.y)-Math.max(y,b.y+O.y),detail:b.label}))];
}
