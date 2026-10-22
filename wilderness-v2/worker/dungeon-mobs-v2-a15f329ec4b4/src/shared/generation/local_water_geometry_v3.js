// Candidate tile realization. No downstream flow is implied by these undirected
// channel connections. Macro ownership, hydrology and reservations are inputs.
export const LOCAL_WATER_VERSION='local-water-geometry-v3';
export function createLocalWaterGeometry(p,macro,shoreline,riverSegments){
 const protectedChunks=shoreline.protectedChunks,cache=new Map(),coastCache=new Map();
 const seed=parseInt(p.seedDigest.slice(0,8),16)>>>0;
 const hash=(x,y,d)=>{let n=seed^Math.imul(x+d,73856093)^Math.imul(y-d,19349663);n^=n>>>16;n=Math.imul(n,0x7feb352d);n^=n>>>15;n=Math.imul(n,0x846ca68b);return(n^(n>>>16))>>>0;};
 function noise(x,y,size,d){const xx=x/size,yy=y/size,ix=Math.floor(xx),iy=Math.floor(yy),u=xx-ix,v=yy-iy,a=u*u*(3-2*u),b=v*v*(3-2*v),h=(x,y)=>hash(x,y,d)/4294967295;return(h(ix,iy)*(1-a)+h(ix+1,iy)*a)*(1-b)+(h(ix,iy+1)*(1-a)+h(ix+1,iy+1)*a)*b;}
 const islandStyles=Object.freeze(p.landmasses.map(l=>{let d=0;for(const c of l.id)d=(Math.imul(d,31)+c.charCodeAt(0))>>>0;return Object.freeze({landmassId:l.id,domain:d%100000,expression:l.classId==='minor-island'?'asymmetric-lobed-small-island':['angular-headlands','asymmetric-coves','elongated-frontage','soft-lobes'][hash(0,0,d)%4]});}));
 const lakeByCell=new Map(),lakeBasins=[];for(const row of p.cellRows)for(const c of row.cells)if(c[4]&&!lakeByCell.has(c[0]+','+row.y)){const cells=[[c[0],row.y]],seen=new Set([c[0]+','+row.y]);for(let i=0;i<cells.length;i++){const[x,y]=cells[i];for(const[dx,dy]of[[-1,0],[1,0],[0,-1],[0,1]]){const key=(x+dx)+','+(y+dy),n=macro(x+dx,y+dy);if(n?.[4]&&n[1]===c[1]&&!seen.has(key)){seen.add(key);cells.push([x+dx,y+dy]);}}}const basin=Object.freeze({id:'local-lake:'+c[0]+':'+row.y,domain:hash(c[0],row.y,701)%100000,minX:Math.min(...cells.map(q=>q[0]))*64,minY:Math.min(...cells.map(q=>q[1]))*52,maxX:(Math.max(...cells.map(q=>q[0]))+1)*64,maxY:(Math.max(...cells.map(q=>q[1]))+1)*52,macroCells:cells.length});lakeBasins.push(basin);for(const[x,y]of cells)lakeByCell.set(x+','+y,basin);}Object.freeze(lakeBasins);
 function protection(x,y){const cx=Math.floor(x/32),cy=Math.floor(y/26);let distance=Infinity;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(protectedChunks.has((cx+dx)+','+(cy+dy))){const a=(cx+dx)*32,b=(cy+dy)*26;distance=Math.min(distance,Math.hypot(Math.max(a-x,0,x-a-32),Math.max(b-y,0,y-b-26)));}const t=Math.min(1,distance/9);return t*t*(3-2*t);}
 function rawCoast(x,y){const mx=Math.floor(x/64),my=Math.floor(y/52),c=macro(mx,my),old=shoreline.tile(x,y);if(!c||p.landmasses[c[1]].classId==='primary-mainland'||old?.protected)return old;
  const style=islandStyles[c[1]],px=x+.5,py=y+.5,t=protection(px,py);let neighbors=coastCache.get(mx+','+my);if(!neighbors){neighbors=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(!macro(mx+dx,my+dy))neighbors.push([mx+dx,my+dy]);coastCache.set(mx+','+my,neighbors);}if(!neighbors.length)return old;
  let distance=Infinity;for(const [a,b]of neighbors)distance=Math.min(distance,Math.hypot(Math.max(a*64-px,0,px-(a+1)*64),Math.max(b*52-py,0,py-(b+1)*52)));if(distance>32)return old;
  const inset=(2+8*noise(px,py,43,style.domain)+5*noise(px,py,91,style.domain+17))*t;let margin=distance-inset;
  for(const [sx,sy]of [[-1,-1],[1,-1],[1,1],[-1,1]])if(!macro(mx+sx,my)&&!macro(mx,my+sy)){const r=12+13*noise(px,py,69,style.domain+37),lx=sx<0?px-mx*64:(mx+1)*64-px,ly=sy<0?py-my*52:(my+1)*52-py;if(lx<r&&ly<r){const cut=style.expression==='angular-headlands'?(lx+ly-r)*.707:r-Math.hypot(lx-r,ly-r);margin=Math.min(margin,cut*t+Math.min(lx,ly)*(1-t)-inset*.25);}}
  if(p.landmasses[c[1]].classId==='minor-island'){
   // A one-cell island must not inherit four corners from its allocation box.
   // Continuous seeded low-order lobes/coves vary both aspect and orientation;
   // the field is clipped to accepted land and tapered out at protected chunks.
   const b=p.landmasses[c[1]].bounds,w=(b.maxXExclusive-b.minX)*64,h=(b.maxYExclusive-b.minY)*52,cx=(b.minX+b.maxXExclusive)*32,cy=(b.minY+b.maxYExclusive)*26,angle=(hash(2,3,style.domain)/4294967295-.5)*1.2,phase=hash(5,7,style.domain)/4294967295*Math.PI*2,dx=px-cx,dy=py-cy,rx=w*(.35+.07*noise(cx,cy,73,style.domain+61)),ry=h*(.31+.08*noise(cx,cy,83,style.domain+71)),u=(dx*Math.cos(angle)+dy*Math.sin(angle))/rx,v=(-dx*Math.sin(angle)+dy*Math.cos(angle))/ry,theta=Math.atan2(v,u),shape=(1-Math.hypot(u,v)+.16*Math.sin(3*theta+phase)+.08*Math.sin(2*theta-phase)+.05*(noise(px,py,29,style.domain+89)-.5))*Math.min(rx,ry);
   margin=shape*t+distance*(1-t);
  }
  return {water:margin<0,shore:margin>=0&&margin<(old?.width??4),classId:old?.classId??'exposed-rocky-shore',margin,width:old?.width??4,protected:false};
 }
 const rawCache=new Map(),classes=[null,'frozen-shore','black-sand-beach','marsh-reed-shore','sea-cliff','dune-beach','sandy-beach','exposed-rocky-shore'];
 function cachedRaw(x,y){const mx=Math.floor(x/64),my=Math.floor(y/52),c=macro(mx,my);if(!c)return null;if(p.landmasses[c[1]].classId==='primary-mainland')return shoreline.tile(x,y);const key=mx+','+my;let exposed=coastCache.get(key);if(!exposed){exposed=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(!macro(mx+dx,my+dy))exposed.push([mx+dx,my+dy]);coastCache.set(key,exposed);}if(!exposed.length)return null;let data=rawCache.get(key);if(!data){const flags=new Uint8Array(3328),classCodes=new Uint8Array(3328),widths=new Float32Array(3328),margins=new Float32Array(3328);for(let ly=0;ly<52;ly++)for(let lx=0;lx<64;lx++){const n=ly*64+lx,q=rawCoast(mx*64+lx,my*52+ly);if(q){flags[n]=8|(q.water?1:0)|(q.shore?2:0)|(q.protected?4:0);classCodes[n]=classes.indexOf(q.classId);widths[n]=q.width;margins[n]=q.margin;}}data={flags,classCodes,widths,margins};rawCache.set(key,data);}const n=(y-my*52)*64+x-mx*64,f=data.flags[n];return f&8?{water:!!(f&1),shore:!!(f&2),protected:!!(f&4),classId:classes[data.classCodes[n]],width:data.widths[n],margin:data.margins[n]}:null;}
 const dryRaw=(x,y)=>!!macro(Math.floor(x/64),Math.floor(y/52))&&!cachedRaw(x,y)?.water;
 function coast(x,y){const c=cachedRaw(x,y);if(!c||c.water||c.protected||p.landmasses[macro(Math.floor(x/64),Math.floor(y/52))[1]].classId==='primary-mainland')return c;
  // Thresholded contour fields can leave a one/two-tile detached fleck.
  // Remove only isolated cardinal components, never protected capacity or a
  // connected peninsula. This uses global neighbors, including chunk seams.
  const neighbors=[[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([a,b])=>dryRaw(a,b));let isolated=!neighbors.length;
  if(neighbors.length===1){const [a,b]=neighbors[0];isolated=!cachedRaw(a,b)?.protected&&[[a-1,b],[a+1,b],[a,b-1],[a,b+1]].filter(([u,v])=>dryRaw(u,v)).length===1;}
  return isolated?{...c,water:true,shore:false}:c;
 }
 // Immutable predecessor crossing guards pin both banks and the channel near
 // accepted bridges. Geometry never depends on newly generated route records.
 const guards=p.waterGeometry.bridgeGuards;
 function guard(x,y){for(const b of guards)if(x>=b.x1-6&&x<=b.x2+6&&y>=b.y1-6&&y<=b.y2+6)return true;return false;}
 const distance=(x,y,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,u=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a.x-u*dx,y-a.y-u*dy);};
 function maskForCell(mx,my){const key=mx+','+my;if(cache.has(key))return cache.get(key);const c=macro(mx,my);if(!c||(!c[4]&&!c[5]))return null;const mask=new Uint8Array(64*52),old=new Uint8Array(64*52),segments=riverSegments.get(key)??[];
  if(c[4]){old.fill(1);for(let ly=0;ly<52;ly++)for(let lx=0;lx<64;lx++){const x=mx*64+lx+.5,y=my*52+ly+.5,t=protection(x,y),inset=(2+5*noise(x,y,39,401))*t;let margin=Infinity;
    for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]])if(!macro(mx+dx,my+dy)?.[4])margin=Math.min(margin,dx<0?lx+.5:dx>0?63.5-lx:dy<0?ly+.5:51.5-ly);
    for(const [sx,sy]of [[-1,-1],[1,-1],[1,1],[-1,1]])if(!macro(mx+sx,my)?.[4]&&!macro(mx,my+sy)?.[4]){const r=13+8*noise(x,y,67,419),a=sx<0?lx+.5:63.5-lx,b=sy<0?ly+.5:51.5-ly;if(a<r&&b<r)margin=Math.min(margin,(r-Math.hypot(a-r,b-r))*t+Math.min(a,b)*(1-t));}
    const basin=lakeByCell.get(key),cx=(basin.minX+basin.maxX)/2,cy=(basin.minY+basin.maxY)/2,rx=(basin.maxX-basin.minX)*.47,ry=(basin.maxY-basin.minY)*.46,u=(x-cx)/rx,v=(y-cy)/ry,theta=Math.atan2(v,u),phase=hash(7,9,basin.domain)/4294967295*Math.PI*2,shape=(1-Math.hypot(u,v)+.10*Math.sin(3*theta+phase)+.06*Math.sin(2*theta-phase)+.05*(noise(x,y,47,basin.domain)-.5))*Math.min(rx,ry);
    margin=Math.min(margin,shape*t+margin*(1-t));mask[ly*64+lx]=margin>=inset?1:0;
  }}else{
   for(let ly=0;ly<52;ly++)for(let lx=0;lx<64;lx++)if(segments.some(([a,b,w])=>distance(mx*64+lx+.5,my*52+ly+.5,a,b)<=w))old[ly*64+lx]=1;
   for(const [a,b,w]of segments){const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),steps=Math.ceil(len*2);for(let i=0;i<=steps;i++){const u=i/steps,xx=a.x+dx*u,yy=a.y+dy*u,t=protection(xx,yy),bend=Math.sin(Math.PI*u)*(noise(xx,yy,37,503)-.5)*11*t*(guard(xx,yy)?0:1),x=xx-dy/len*bend,y=yy+dx/len*bend,r=w+.3*Math.sin(Math.PI*u)*noise(xx,yy,29,523);for(let ly=Math.max(0,Math.floor(y-r-my*52));ly<Math.min(52,Math.ceil(y+r-my*52));ly++)for(let lx=Math.max(0,Math.floor(x-r-mx*64));lx<Math.min(64,Math.ceil(x+r-mx*64));lx++)if(Math.hypot(mx*64+lx+.5-x,my*52+ly+.5-y)<=r)mask[ly*64+lx]=1;}}
  }
  for(let ly=0;ly<52;ly++)for(let lx=0;lx<64;lx++){const x=mx*64+lx+.5,y=my*52+ly+.5;if(protection(x,y)===0||guard(x,y))mask[ly*64+lx]=old[ly*64+lx];}
  if(c[4]){
   // Inward contouring must not leave tiny detached water flecks at a tapered
   // protected corner. Retain any protected water and connect it to the wide
   // lake core; discard unprotected flecks, never the planning lake itself.
   const seen=new Uint8Array(3328),queue=new Int32Array(3328);let head=0,tail=0;const flood=()=>{while(head<tail){const n=queue[head++],x=n%64,y=Math.floor(n/64);for(const q of [x?n-1:-1,x<63?n+1:-1,y?n-64:-1,y<51?n+64:-1])if(q>=0&&mask[q]&&!seen[q]){seen[q]=1;queue[tail++]=q;}}};seen[26*64+32]=1;queue[tail++]=26*64+32;flood();
   for(let n=0;n<3328;n++)if(mask[n]&&!seen[n]&&(protection(mx*64+n%64+.5,my*52+Math.floor(n/64)+.5)===0||guard(mx*64+n%64+.5,my*52+Math.floor(n/64)+.5))){let x=n%64,y=Math.floor(n/64);while(!seen[y*64+x]){for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(x+dx>=0&&x+dx<64&&y+dy>=0&&y+dy<52)mask[(y+dy)*64+x+dx]=1;if(x!==32)x+=Math.sign(32-x);else y+=Math.sign(26-y);}head=0;tail=0;seen.fill(0);seen[26*64+32]=1;queue[tail++]=26*64+32;flood();}
   for(let n=0;n<3328;n++)if(mask[n]&&!seen[n])mask[n]=0;
  }
  cache.set(key,mask);return mask;
 }
 function inland(x,y){const mx=Math.floor(x/64),my=Math.floor(y/52),c=macro(mx,my),mask=maskForCell(mx,my);if(!mask)return null;const lx=x-mx*64,ly=y-my*52,water=mask[ly*64+lx]===1;let bank=false;if(!water)for(let dy=-2;dy<=2&&!bank;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy,mm=maskForCell(Math.floor(xx/64),Math.floor(yy/52));if(mm?.[((yy%52+52)%52)*64+(xx%64+64)%64]){bank=true;break;}}return {water,kind:c[4]?'lake':'river',bank};}
 return Object.freeze({version:LOCAL_WATER_VERSION,coast,inland,maskForCell,islandStyles,lakeBasins,protectedChunks});
}
