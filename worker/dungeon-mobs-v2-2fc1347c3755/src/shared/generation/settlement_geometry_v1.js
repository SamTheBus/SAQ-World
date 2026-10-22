// Reusable reviewed exterior geometry. No development session or save dependency.
import {OPEN_TOWN_TEMPLATE_V1} from '../content/open_town_template_v1.js';
const DATA={templates:[OPEN_TOWN_TEMPLATE_V1]};
import {D9_PROFILE as P} from '../content/world_profile_d9.js';
import {collidesWithTiles} from '../rules/world_geometry.js';
export const TILE=P.tileSize;
export const templateFor=id=>{const t=DATA.templates.find(t=>t.id===id);if(!t)throw new TypeError('Unknown settlement fixture');return t;};
export const tilePoint=p=>({x:(p[0]+.5)*TILE,y:(p[1]+.5)*TILE});
export const frontage=b=>tilePoint([b.porch.x+1,b.porch.y+1]);
const propCache=new WeakMap();
export function propsFor(t){if(propCache.has(t))return propCache.get(t);const props=[];for(const b of t.buildings.filter(b=>b.kind!=='home')){const x=b.x-1,y=b.y+b.h-1;if(x<1||y<1||x>=t.core[0]-1||y>=t.core[1]-1||t.buildings.some(q=>x>=q.x&&x<q.x+q.w&&y>=q.y&&y<q.y+q.h)||t.buildings.some(q=>q.path.some(p=>Math.hypot(p[0]-x,p[1]-y)<2)||Math.hypot(q.porch.x+1-x,q.porch.y+1-y)<3))continue;props.push({id:b.id+':barrel',x,y});}propCache.set(t,props);return props;}
export function blocked(t,x,y){return t.buildings.some(b=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h)||propsFor(t).some(p=>p.x===x&&p.y===y);}
export function generateSettlementPage(id,address){
 const t=templateFor(id),cx=Number(address.chunkX),cy=Number(address.chunkY);
 if(!Number.isSafeInteger(cx)||!Number.isSafeInteger(cy)||Math.abs(cx)>100||Math.abs(cy)>100)throw new TypeError('Development fixture address bound');
 const rows=[];for(let y=0;y<26;y++){let row='';for(let x=0;x<32;x++)row+=blocked(t,cx*32+x,cy*26+y)?'2':'1';rows.push(row);}
 return {chunkX:String(cx),chunkY:String(cy),tiles:rows,fixture:id};
}
export function fullCollision(id){const t=templateFor(id);return {width:t.core[0],height:t.core[1],tileSize:TILE,tiles:Array.from({length:t.core[1]},(_,y)=>Array.from({length:t.core[0]},(_,x)=>blocked(t,x,y)?'2':'1').join(''))};}
// Review walking routes use the actual hull exclusion, never a visual path.
export function findWalkingRoute(id,from,to){
 const c=fullCollision(id),key=(x,y)=>y*c.width+x,start=[Math.floor(from.x/TILE),Math.floor(from.y/TILE)],end=[Math.floor(to.x/TILE),Math.floor(to.y/TILE)],queue=[start],parents=new Map([[key(...start),null]]);let found=false;
 for(let head=0;head<queue.length;head++){const [x,y]=queue[head];if(x===end[0]&&y===end[1]){found=true;break;}for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(nx<0||ny<0||nx>=c.width||ny>=c.height||parents.has(k)||collidesWithTiles(c,(nx+.5)*TILE,(ny+.5)*TILE,9))continue;parents.set(k,[x,y]);queue.push([nx,ny]);}}
 if(!found)return null;const result=[];for(let p=end;p;p=parents.get(key(...p)))result.push(tilePoint(p));return result.reverse();
}
