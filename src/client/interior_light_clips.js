// Presentation-only clipping against the supplied interior tile grid. This module
// has no access to authority commands, targeting or gameplay LOS.
export function createInteriorLightClips(){
 const fixed=new Map(),angles=new Float64Array(512);let identity=null,moving=null,builds=0,movingBuilds=0,worstMs=0,maxRays=0;
 function clear(){fixed.clear();moving=null;identity=null;}
 function pathFor(space,light,dynamic=false){
  const site=space.site??space.functionalSite;if(identity!==site.contentHash){clear();identity=site.contentHash;}
  const key=light.id+'/'+light.x+'/'+light.y+'/'+light.radius;
  if(dynamic&&moving?.key===key)return moving.path;if(!dynamic&&fixed.has(key))return fixed.get(key);
  const start=performance.now(),v=space.visual,t=space.collision.tileSize,ox=v.originTile?.x??0,oy=v.originTile?.y??0;
  const floor=(x,y)=>v.terrain[y-oy]?.[x-ox]==='1';const radius=Math.min(208,light.radius),path=new Path2D();let sx=light.x,sy=light.y,cx=Math.floor(sx/t),cy=Math.floor(sy/t);
  // A wall-mounted sconce emits from its nearest exposed floor face, not from
  // inside the wall or both sides of it. The sprite stays on its original bracket.
  if(!floor(cx,cy)){
   const inset=t*.5;
   const options=[[cx,cy+1,sx,(cy+1)*t+inset],[cx-1,cy,cx*t-inset,sy],[cx+1,cy,(cx+1)*t+inset,sy],[cx,cy-1,sx,cy*t-inset]].filter(p=>floor(p[0],p[1]));
   options.sort((a,b)=>Math.hypot(a[2]-sx,a[3]-sy)-Math.hypot(b[2]-sx,b[3]-sy));if(options.length){sx=options[0][2];sy=options[0][3];}else return path;
  }
  let count=0;for(let i=0;i<64;i++)angles[count++]=i*Math.PI*2/64-Math.PI;
  // Rays adjacent to actual wall corners preserve narrow openings and sharp
  // occlusion wedges; uniform rays keep the radial outer edge smooth.
  for(let y=Math.floor((sy-radius)/t);y<=Math.ceil((sy+radius)/t);y++)for(let x=Math.floor((sx-radius)/t);x<=Math.ceil((sx+radius)/t);x++){
   const a=floor(x-1,y-1),b=floor(x,y-1),c=floor(x-1,y),d=floor(x,y);if(a===b&&a===c&&a===d||Math.hypot(x*t-sx,y*t-sy)>radius+2||count+3>512)continue;
   const angle=Math.atan2(y*t-sy,x*t-sx);angles[count++]=angle-.00001;angles[count++]=angle;angles[count++]=angle+.00001;
  }
  const sorted=angles.subarray(0,count);sorted.sort();maxRays=Math.max(maxRays,count);
  for(let i=0;i<count;i++){
   const dx=Math.cos(sorted[i]),dy=Math.sin(sorted[i]),stepX=dx>=0?1:-1,stepY=dy>=0?1:-1;let x=Math.floor(sx/t),y=Math.floor(sy/t);
   const deltaX=t/Math.abs(dx),deltaY=t/Math.abs(dy);let sideX=((stepX>0?(x+1)*t:x*t)-sx)/dx,sideY=((stepY>0?(y+1)*t:y*t)-sy)/dy,dist=radius;
   for(let n=0;n<20;n++){
    let hit;if(sideX<sideY){hit=sideX;sideX+=deltaX;x+=stepX;}else{hit=sideY;sideY+=deltaY;y+=stepY;}
    if(hit>=radius)break;if(!floor(x,y)){dist=Math.min(radius,hit+Math.min(1.5,Math.max(0,Math.min(sideX,sideY)-hit)*.5));break;}
   }
   const px=sx+dx*dist,py=sy+dy*dist;if(i===0)path.moveTo(px,py);else path.lineTo(px,py);
  }
  path.closePath();builds++;if(dynamic){movingBuilds++;moving={key,path};}else{fixed.set(key,path);while(fixed.size>64)fixed.delete(fixed.keys().next().value);}
  worstMs=Math.max(worstMs,performance.now()-start);return path;
 }
 return Object.freeze({pathFor,clear,resources:()=>({lightFixedClips:fixed.size,lightPlayerClips:moving?1:0,lightClipBuilds:builds,lightPlayerClipBuilds:movingBuilds,lightWorstClipMs:worstMs,lightMaxClipRays:maxRays})});
}
