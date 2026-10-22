import {FORT_TIER_POLICY} from '../content/planned_fort_policy_v1.js';
import {PLANNED_FORT_V2} from '../content/planned_fort_policy_v2.js';
import {fortFloorRecipe} from './fort_family_v1.js';
import {freezeWire,requireContract as check} from '../contracts/wire.js';
export function fortFloorRecipeV2(seed,tier,index){
 if(tier==='small'||tier==='standard')return fortFloorRecipe(seed,tier,index);
 const p=FORT_TIER_POLICY[tier]?.floors[index];check(p,'Unknown Fort V2 floor');
 const [w,h]=p.tiles,n=[...seed+'/'+tier+'/'+index].reduce((n,c)=>Math.imul(n^c.charCodeAt(0),16777619)>>>0,2166136261),
 cells=Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>x===0||y===0||x===w-1||y===h-1?'0':'1')),blockers=[],decorations=[];
 const wall=(x,y,ww,hh)=>{for(let yy=y;yy<y+hh;yy++)for(let xx=x;xx<x+ww;xx++)cells[yy][xx]='0';},
 doorWall=(x,y,ww,hh,gap,vertical)=>{wall(x,y,ww,hh);for(let i=-1;i<=1;i++)cells[vertical?gap+i:y][vertical?x:gap+i]='1';},
 prop=(kind,x,y,width,height,visual)=>{wall(x,y,width,height);blockers.push({kind,x,y,width,height});decorations.push({kind:visual,x:x+width/2,y:y+height/2,width,height,variant:n%2});},
 point=(x,y)=>({x:x*32+16,y:y*32+16}),mid=Math.floor(w/2),south=h-8;
 // Side rooms surround a broad circulation spine. Deep vaults use staggered
 // chamber doors; Large galleries retain a courtyard-facing central hall.
 const split=Math.floor(w/3),doorY=10+n%3;
 for(const x of [split,w-split-1])doorWall(x,1,1,h-10,doorY,true);
 for(const x of [split+3,w-split-4])prop('fort-interior-storage',x,3,2,2,'fort-storage');
 if(p.role==='ground'){
   const y=7+n%2;for(let x=split+1;x<w-split-1;x++)if(Math.abs(x-mid)>1)cells[y][x]='0';
   decorations.push({kind:'fort-rug',x:mid-3,y:11,width:6,height:3,variant:0});
 }else if(p.role.startsWith('upper')){
   prop('fort-interior-table',2,4,4,2,'fort-table');
   prop('fort-interior-table',w-6,4,3,2,'fort-table');
   decorations.push({kind:'fort-map',x:mid,y:1.4,variant:0});
 }else {
   for(const y of [6,Math.floor(h/2)])for(const x of [3,w-5])prop('fort-interior-storage',x,y,2,2,'fort-storage');
   if(p.role==='deep-underground')for(const y of [7,14]){for(let x=split+1;x<w-split-1;x++)if(Math.abs(x-(mid+(y===7?-3:3)))>1)cells[y][x]='0';}
 }
 const rooms=[{roomId:'fort-room:'+index+':west',role:'side-chamber',x:1,y:1,width:split-1,height:h-10},
 {roomId:'fort-room:'+index+':hall',role:p.role==='ground'?'courtyard-hall':'encounter',x:split+1,y:1,width:w-2*split-2,height:h-10},
 {roomId:'fort-room:'+index+':east',role:'side-chamber',x:w-split,y:1,width:split-1,height:h-10}];
 const candidates=[point(mid,5),point(4,doorY+1),point(w-5,doorY+1)];
 const families=p.role.includes('underground')?['golem','rust_nibbler','gargoyle']:['animated_armor','gargoyle','animated_armor'];
 const affix=p.role==='upper'?'swift_commander':p.role==='underground'?'slag_shaper':p.role==='deep-underground'?'iron_citadel':null;
 decorations.push({kind:'sconce',x:2,y:1},{kind:'sconce',x:w-3,y:1},{kind:'fort-banner',x:mid-3,y:3,variant:index%2},{kind:'fort-weapon-rack',x:2,y:h-4,variant:n%2});
 return freezeWire({version:PLANNED_FORT_V2,role:p.role,collision:{tileSize:32,width:w,height:h,tiles:cells.map(r=>r.join(''))},
 visual:{originTile:{x:0,y:0},terrain:cells.map(r=>r.join('')),blockers,decorations},entrance:point(mid,h-3),
 stairAnchors:{up:point(mid-3,h-6),down:point(mid+3,h-6)},graph:{rooms},
 encounter:{rank:'C',members:families.map((family,i)=>({memberKey:'fort:'+p.role+':'+i,family,roomId:rooms[i===0?1:i===1?0:2].roomId,position:candidates[i],eliteAffixId:i===0?affix:null}))},
 reward:{kind:'chest',art:'chest',position:point(mid,south)}});
}
