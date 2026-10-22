import {RUIN_TIER_POLICY_V2,PLANNED_RUIN_V2} from '../content/planned_ruin_policy_v2.js';
import {ruinFloorRecipe,ruinFloorLinks} from './ruin_family_v1.js';
import {freezeWire,requireContract as check} from '../contracts/wire.js';
const hash=text=>{let n=2166136261;for(const c of text)n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;return n;};
export function ruinFloorRecipeV2(seed,tier,index){
 if(tier==='small'||tier==='standard')return ruinFloorRecipe(seed,tier,index);
 const f=RUIN_TIER_POLICY_V2[tier]?.floors[index];check(f,'Unknown Ruin V2 tier/floor');const [w,h]=f.tiles,n=hash(PLANNED_RUIN_V2+'/'+seed+'/'+tier+'/'+index),cells=Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>x===0||y===0||x===w-1||y===h-1?'0':'1')),blockers=[],decorations=[],rooms=[];
 const masonry=(x,y,width,height,kind='ruin-collapsed-masonry')=>{for(let yy=y;yy<y+height;yy++)for(let xx=x;xx<x+width;xx++)cells[yy][xx]='0';blockers.push({kind,x,y,width,height});decorations.push({kind,x:x+width/2,y:y+height/2,width,height,variant:n%3});};
 const point=(x,y)=>({x:x*32+16,y:y*32+16}),center=Math.floor(w/2),roomId='ruin-room:'+index+':court';
 // Each architectural role has a different circulation grammar. Seeded wide
 // breaches and offsets vary connections, not just decoration/enemy placement.
 if(index===0){const lx=7+n%3,rx=w-8-n%2,gy=12+(n>>>4)%5;for(const x of [lx,rx]){masonry(x,3,1,gy-5);masonry(x,gy+3,1,h-gy-8);}for(const x of [4,w-6])for(const y of [6,h-10])masonry(x,y,2,2,'ruin-broken-pillar');}
 else if(f.role==='fractured-gallery'||f.role==='sealed-archive'){for(const y of [10+n%3,23+(n>>>3)%3]){masonry(3,y,center-7,1);masonry(center+5,y,w-center-8,1);}for(const x of [8,w-9])masonry(x,15,2,3,'ruin-broken-pillar');}
 else if(f.role==='collapsed-cloister'){for(const x of [Math.floor(w/3),Math.floor(w*2/3)]){const gap=8+(n>>>3)%9;masonry(x,3,1,gap-3);masonry(x,gap+5,1,h-gap-9);}masonry(3,h-12,5,1);masonry(w-8,7,5,1);}
 else if(f.role==='buried-cistern'){for(const x of [8,18,28])for(const y of [8,20])masonry(x+(n%3),y+(n>>>3)%3,3,3,'ruin-broken-pillar');masonry(4,h-12,6,1);masonry(w-10,12,6,1);}
 else {for(const x of [9,w-10]){masonry(x,3,1,7+n%3);masonry(x,19+(n%2),1,h-24);}masonry(3,15,5,1);masonry(w-8,15,5,1);for(const x of [center-5,center+4])masonry(x,6,2,2,'ruin-broken-pillar');}
 const entrance=point(center,h-3),up=point(center-3,h-6),down=point(center+3,5),reward=point(center,3);
 decorations.push({kind:'ruin-reward-alcove',x:center+.5,y:3.5},{kind:'ruin-moss-patch',x:center-2,y:h/2,variant:n%3},{kind:'ruin-rubble-flat',x:3,y:12,variant:n%3},{kind:'ruin-wall-roots',x:1,y:8},{kind:'ruin-wall-vines',x:w-2,y:9},{kind:'sconce',x:2,y:1},{kind:'sconce',x:w-3,y:1},...(index===0?[{kind:'ruin-light-shaft',x:center,y:10,width:9,height:14}]:[]));
 const families=tier==='large'?['gargoyle','cursed_blade','rust_nibbler','gargoyle']:['cursed_blade','gargoyle','rust_nibbler','gargoyle','cursed_blade'],positions=[point(center-2,h-10),point(center+2,Math.floor(h/2)),point(center-3,10),point(center+2,8),point(center,Math.floor(h/2)+5)];
 const safePosition=p=>{const x=Math.floor(p.x/32),y=Math.floor(p.y/32);for(let distance=0;distance<=6;distance++)for(let dy=-distance;dy<=distance;dy++)for(const dx of [-1,1].map(sign=>sign*(distance-Math.abs(dy))))if(cells[y+dy]?.[x+dx]==='1')return point(x+dx,y+dy);throw new TypeError('Ruin enemy anchor has no safe connected capacity');};
 rooms.push({roomId,role:'encounter',x:1,y:1,width:w-2,height:h-2});
 return freezeWire({version:PLANNED_RUIN_V2,role:f.role,collision:{tileSize:32,width:w,height:h,tiles:cells.map(r=>r.join(''))},visual:{version:'woodland-ruin-presentation-d11.3-planned-v1',originTile:{x:0,y:0},terrain:cells.map(r=>r.join('')),blockers,decorations},entrance,stairAnchors:{up,down},graph:{rooms},encounter:{rank:'C',members:families.map((family,i)=>({memberKey:'ruin:'+f.role+':'+i,family,roomId,position:safePosition(positions[i])}))},reward:{kind:'chest',art:'chest',position:reward}});
}
export function ruinFloorLinksV2(tier){if(tier==='small'||tier==='standard')return ruinFloorLinks(tier);const p=RUIN_TIER_POLICY_V2[tier];check(p,'Unknown Ruin V2 tier');return freezeWire(p.floors.map((_,i)=>({up:i?i-1:null,down:i+1<p.floors.length?i+1:null})));}
