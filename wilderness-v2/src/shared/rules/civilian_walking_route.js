import {collidesWithTiles} from './world_geometry.js';
// Tooling/autowalk route; movement always executes through the SAQ kernel.
export function civilianWalkingRoute(c,from,to,radius=9){
 const s=c.tileSize,key=(x,y)=>y*c.width+x,start=[Math.floor(from.x/s),Math.floor(from.y/s)],end=[Math.floor(to.x/s),Math.floor(to.y/s)],q=[start],parent=new Map([[key(...start),null]]);let found=false;
 for(let h=0;h<q.length;h++){const [x,y]=q[h];if(x===end[0]&&y===end[1]){found=true;break;}for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(nx<0||ny<0||nx>=c.width||ny>=c.height||parent.has(k)||collidesWithTiles(c,(nx+.5)*s,(ny+.5)*s,radius))continue;parent.set(k,[x,y]);q.push([nx,ny]);}}
 if(!found)return null;const out=[];for(let p=end;p;p=parent.get(key(...p)))out.push({x:(p[0]+.5)*s,y:(p[1]+.5)*s});return out.reverse();
}
