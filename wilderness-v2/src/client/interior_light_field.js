// Bounded presentation distance field, sampled directly from the existing floor
// rows. Eight heading states charge bends; diagonals require BOTH open side cells.
export const INTERIOR_FIELD=Object.freeze({step:16,reach:192,bend45:8,bend90:24});
export function floorLightField(space,source){
 const {step,reach}=INTERIOR_FIELD,side=29,x0=(Math.floor(source.x/step)-14)*step,y0=(Math.floor(source.y/step)-14)*step,n=side*side;
 const rows=space.visual.terrain,t=space.collision.tileSize,ox=space.visual.originTile?.x??0,oy=space.visual.originTile?.y??0;
 const floor=(x,y)=>rows[Math.floor(y/t)-oy]?.[Math.floor(x/t)-ox]==='1';
 let sx=source.x,sy=source.y;if(!floor(sx,sy)){const cx=Math.floor(sx/t),cy=Math.floor(sy/t),options=[];for(const[dx,dy]of [[0,1],[-1,0],[1,0],[0,-1]]){const x=(cx+dx+.5)*t,y=(cy+dy+.5)*t;if(floor(x,y))options.push({x,y});}options.sort((a,b)=>Math.hypot(a.x-sx,a.y-sy)-Math.hypot(b.x-sx,b.y-sy));if(options.length){sx=options[0].x;sy=options[0].y;}}
 const open=(x,y)=>x>=0&&y>=0&&x<side&&y<side&&floor(x0+(x+.5)*step,y0+(y+.5)*step);
 const distances=new Float32Array(n*8).fill(Infinity),values=new Float32Array(n).fill(Infinity),heap=[];
 const push=(id,cost)=>{const entry={id,cost};let i=heap.length;heap.push(entry);while(i){const p=(i-1)>>1;if(heap[p].cost<=cost)break;heap[i]=heap[p];i=p;}heap[i]=entry;};
 const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].cost<heap[c].cost)c++;if(heap[c].cost>=last.cost)break;heap[i]=heap[c];i=c;}heap[i]=last;}return first;};
 const x=Math.floor((sx-x0)/step),y=Math.floor((sy-y0)/step),seed=y*side+x;let evaluated=0,reached=0;
 if(open(x,y)){const cost=Math.hypot(x0+(x+.5)*step-sx,y0+(y+.5)*step-sy);for(let d=0;d<8;d++){distances[seed*8+d]=cost;push(seed*8+d,distances[seed*8+d]);}}
 const directions=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]],bend=[0,8,24,40,56];
 while(heap.length){const {id,cost}=pop();if(cost!==distances[id]||cost>=reach)continue;evaluated++;const cell=Math.floor(id/8),heading=id%8,cx=cell%side,cy=Math.floor(cell/side);if(cost<values[cell])values[cell]=cost;
  for(let d=0;d<8;d++){const[dx,dy]=directions[d],xx=cx+dx,yy=cy+dy;if(!open(xx,yy)||dx&&dy&&(!open(cx+dx,cy)||!open(cx,cy+dy)))continue;
   const turn=Math.min(Math.abs(d-heading),8-Math.abs(d-heading)),next=cost+step*(dx&&dy?Math.SQRT2:1)+bend[turn],target=(yy*side+xx)*8+d;
   if(next<reach&&next<distances[target]){distances[target]=Math.fround(next);push(target,distances[target]);}
  }
 }
 for(const value of values)if(Number.isFinite(value))reached++;
 return {step,reach,side,x0,y0,values,evaluated,reached,floor};
}
