import {FORT_TIER_POLICY,PLANNED_FORT_VERSION} from '../content/planned_fort_policy_v1.js';
import {freezeWire,requireContract as check} from '../contracts/wire.js';
const hash32=text=>{let n=2166136261;for(const c of text)n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;return n;};
// Orthogonal architecture, not a cave generator with another name. Seeded door
// offsets and furnishing variants preserve the reviewed room/circulation recipe.
export function fortFloorRecipe(siteSeed,tier,index){
 const policy=FORT_TIER_POLICY[tier],f=policy?.floors[index];check(f,'Unknown fort tier/floor');const [w,h]=f.tiles,n=hash32(PLANNED_FORT_VERSION+'/'+siteSeed+'/'+index),cells=Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>x===0||y===0||x===w-1||y===h-1?'0':'1')),blockers=[],decorations=[];
 const rect=(kind,x,y,width,height)=>{blockers.push({kind,x,y,width,height});for(let yy=y;yy<y+height;yy++)for(let xx=x;xx<x+width;xx++)cells[yy][xx]='0';};
 if(w>=20){for(const x of [7,w-8])for(let y=1;y<h-1;y++)if(y<7+n%2||y>10+n%2)cells[y][x]='0';rect('fort-interior-table',2,3,3,2);rect('fort-interior-storage',w-5,3,2,2);decorations.push({kind:'fort-table',x:3.5,y:4,width:3,height:2,variant:1},{kind:'fort-storage',x:w-4,y:4,width:2,height:2,variant:0},{kind:'fort-banner',x:9,y:3,variant:index%2},{kind:'fort-map',x:w/2,y:1.4,variant:0});}
 else {rect('fort-interior-table',2,3,2,2);decorations.push({kind:'fort-table',x:3,y:4,width:2,height:2,variant:0});}
 decorations.push({kind:'sconce',x:2,y:1},{kind:'sconce',x:w-3,y:1},{kind:'fort-rug',x:w/2-2,y:h-7,width:4,height:2},{kind:'fort-weapon-rack',x:2,y:h-4,variant:n%2});
 const point=(x,y)=>({x:x*32+16,y:y*32+16}),entrance=point(Math.floor(w/2),h-3),spread=w===24?2:3,up=point(Math.floor(w/2)-spread,h-6),down=point(Math.floor(w/2)+spread,h-6),roomId='fort-room:'+index+':hall';
 const role=f.role,eliteAffixId=role==='upper'?'swift_commander':role==='underground'?'slag_shaper':null,families=role.includes('underground')?['golem','rust_nibbler','gargoyle']:['animated_armor','gargoyle','animated_armor'],positions=w>=20?[point(Math.floor(w/2),5),point(Math.floor(w/2)-3,9),point(Math.floor(w/2)+3,9)]:[point(7,3),point(6,6),point(10,5)];
 return freezeWire({version:PLANNED_FORT_VERSION,role,collision:{tileSize:32,width:w,height:h,tiles:cells.map(r=>r.join(''))},visual:{originTile:{x:0,y:0},terrain:cells.map(r=>r.join('')),blockers,decorations},entrance,stairAnchors:{up,down},graph:{rooms:[{roomId,role:'encounter',x:1,y:1,width:w-2,height:h-2}]},encounter:{rank:'C',members:families.map((family,i)=>({memberKey:'fort:'+role+':'+i,family,roomId,position:positions[i],eliteAffixId:i===0?eliteAffixId:null}))},reward:{kind:'chest',art:'chest',position:point(Math.floor(w/2),h-8)}});
}
// Each endpoint has a reciprocal counterpart; ground branches to both stories.
export function fortFloorLinks(tier){const roles=FORT_TIER_POLICY[tier].floors.map(f=>f.role),links=roles.map(()=>({up:null,down:null}));for(let i=1;i<roles.length;i++){const role=roles[i],parent=role==='upper'||role==='underground'?0:role==='upper-tower'?roles.indexOf('upper'):roles.indexOf('underground'),direction=role.startsWith('upper')?'up':'down',reverse=direction==='up'?'down':'up';links[parent][direction]=i;links[i][reverse]=parent;}return freezeWire(links);}
