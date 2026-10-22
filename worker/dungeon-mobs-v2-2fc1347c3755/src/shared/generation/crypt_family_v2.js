import {CRYPT_TIER_POLICY_V2,PLANNED_CRYPT_V2} from '../content/planned_crypt_policy_v2.js';
import {freezeWire,requireContract as check} from '../contracts/wire.js';
const hash=s=>{let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;return n;};
export function cryptFloorRecipeV2(seed,tier,index){
 const f=CRYPT_TIER_POLICY_V2[tier]?.floors[index];check(f,'Unknown Crypt V2 floor');const [w,h]=f.tiles,n=hash(PLANNED_CRYPT_V2+'/'+seed+'/'+tier+'/'+index),mid=Math.floor(w/2),cells=Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>!x||!y||x===w-1||y===h-1?'0':'1')),blockers=[],decorations=[],rooms=[];
 const wall=(x,y,width,height,kind='ruin-collapsed-masonry')=>{check(width>0&&height>0&&x>0&&y>0&&x+width<w&&y+height<h,'Crypt masonry bounds');for(let dy=0;dy<height;dy++)for(let dx=0;dx<width;dx++)cells[y+dy][x+dx]='0';blockers.push({kind,x,y,width,height});decorations.push({kind,x:x+width/2,y:y+height/2,width,height,variant:n%3});};
 const point=(x,y)=>({x:x*32+16,y:y*32+16}),gap=11+n%4,offset=(n>>>5)%3;
 // Different burial architectures use broad shared circulation and side branches.
 // Every breach is several tiles wide; seed variation changes wall connections.
 if(f.role==='ancestral-nave'||f.role==='processional-hall'){
  for(const x of [8+offset,w-9-offset]){wall(x,3,1,gap-5);wall(x,gap+4,1,h-gap-8);}
  for(const x of [4,w-6])for(const y of [5,h-9])wall(x,y,2,3,'ruin-broken-pillar');
 }else if(f.role==='ossuary-galleries'||f.role==='sealed-archives'){
  for(const y of [9+offset,h-11]){wall(3,y,mid-7,1);wall(mid+5,y,w-mid-8,1);}
  for(const x of [7,w-9])wall(x,Math.floor(h/2)-2,2,3,'ruin-broken-pillar');
 }else if(f.role==='family-vaults'||f.role==='catacomb-loops'){
  for(const x of [10,w-11]){wall(x,3,1,6+offset);wall(x,15+offset,1,h-20-offset);}
  // Partial crypt rooms form loops around wide transverse passages.
  for(const y of [10+offset,h-11]){wall(3,y,4,1);wall(w-7,y,4,1);}
 }else if(f.role==='memorial-crossing'){
  for(const x of [7,w-9])for(const y of [7+offset,h-12-offset])wall(x,y,2,4,'ruin-broken-pillar');
  wall(3,Math.floor(h/2),8,1);wall(w-11,Math.floor(h/2),8,1);
 }else{
  // Sanctuary/royal tomb: outer ambulatory, broken inner burial enclosure.
  for(const x of [mid-7,mid+7]){wall(x,7,1,5+offset);wall(x,18+offset,1,h-23-offset);}
  wall(3,10,5,1);wall(w-8,10,5,1);for(const x of [mid-4,mid+3])wall(x,7,2,2,'ruin-broken-pillar');
 }
 const entrance=point(mid,h-3),up=point(mid-3,h-6),down=point(mid+3,5),reward=point(mid,3),roomId='crypt-room:'+index+':'+f.role;
 rooms.push({roomId,role:'encounter',x:1,y:1,width:w-2,height:h-2},{roomId:roomId+':west',role:'side-chamber',x:2,y:3,width:6,height:h-7},{roomId:roomId+':east',role:'side-chamber',x:w-8,y:3,width:6,height:h-7});
 decorations.push({kind:'ruin-rubble-flat',x:4,y:h-5,variant:n%3},{kind:'ruin-reward-alcove',x:mid+.5,y:3.5},{kind:'sconce',x:2,y:1},{kind:'sconce',x:w-3,y:1});
 const positions=[point(mid-2,h-10),point(mid+2,Math.floor(h/2)),point(mid-3,10),point(mid+2,8)];
 for(const p of [entrance,up,down,reward,...positions])check(cells[Math.floor(p.y/32)]?.[Math.floor(p.x/32)]==='1','Crypt anchor blocked');
 return freezeWire({version:PLANNED_CRYPT_V2,role:f.role,collision:{tileSize:32,width:w,height:h,tiles:cells.map(r=>r.join(''))},visual:{version:'woodland-ruin-presentation-d11.3-planned-v1',originTile:{x:0,y:0},terrain:cells.map(r=>r.join('')),blockers,decorations},entrance,stairAnchors:{up,down},graph:{rooms},encounter:{rank:'C',members:['cursed_blade','gargoyle','rust_nibbler','gargoyle'].map((family,i)=>({memberKey:'crypt:'+f.role+':'+i,family,roomId,position:positions[i]}))},reward:{kind:'chest',art:'chest',position:reward}});
}
export function cryptFloorLinksV2(tier){const p=CRYPT_TIER_POLICY_V2[tier];check(p,'Unknown Crypt V2 tier');return freezeWire(p.floors.map((_,i)=>({up:i?i-1:null,down:i+1<p.floors.length?i+1:null})));}
