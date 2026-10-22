// Local realization only. Macro ownership and all upstream identities stay intact.
// H.5A's accepted rules: widths 2..22 tiles, inside the source land cell,
// variable frontage, connected backshore, and no whole-cell beach conversion.
export const LOCAL_SHORELINE_VERSION='local-shoreline-runtime-v2';
export function createLocalShoreline(p,macro){
 const protectedChunks=new Set(),add=cs=>{for(const c of cs??[])protectedChunks.add(c.x+','+c.y);};
 for(const s of p.settlements){add(s.core);add(s.expansion);add(s.sockets);}
 for(const s of p.sites){add(s.footprint);add(s.approach);}
 for(const s of p.factions){add(s.campus);add(s.activity);add(s.approach);add(s.arrival);}
 for(const s of p.futureIslands)add([s.entrance,s.approach,s.landing,s.breathing]);
 add(p.extraProtected);add(p.originZone.runtimeChunks.map(c=>({x:c.chunkX,y:c.chunkY})));
 const seed=Number.parseInt(p.seedDigest.slice(0,8),16)>>>0,cache=new Map();
 const hash=(x,y,domain)=>{let n=seed^Math.imul(x+domain,73856093)^Math.imul(y-domain,19349663);n^=n>>>16;n=Math.imul(n,0x7feb352d);n^=n>>>15;n=Math.imul(n,0x846ca68b);return (n^(n>>>16))>>>0;};
 function noise(x,y,size,domain){const xx=x/size,yy=y/size,ix=Math.floor(xx),iy=Math.floor(yy),u=xx-ix,v=yy-iy,a=u*u*(3-2*u),b=v*v*(3-2*v),h=(x,y)=>hash(x,y,domain)/4294967295;return (h(ix,iy)*(1-a)+h(ix+1,iy)*a)*(1-b)+(h(ix,iy+1)*(1-a)+h(ix+1,iy+1)*a)*b;}
 function tile(x,y){
  const mx=Math.floor(x/64),my=Math.floor(y/52),c=macro(mx,my);if(!c)return null;
  const ck=mx+','+my;let ocean=cache.get(ck);if(!ocean){ocean=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(!macro(mx+dx,my+dy))ocean.push([mx+dx,my+dy]);cache.set(ck,ocean);}if(!ocean.length)return null;
  const px=x+.5,py=y+.5;let distance=Infinity;
  for(const [ox,oy] of ocean){const dx=Math.max(ox*64-px,0,px-(ox+1)*64),dy=Math.max(oy*52-py,0,py-(oy+1)*52);distance=Math.min(distance,Math.hypot(dx,dy));}
  if(distance>30)return null;
  // Protected capacity uses a smooth 8-tile taper, never a sharp pinning edge.
  let protection=Infinity;const cx=Math.floor(x/32),cy=Math.floor(y/26);
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(protectedChunks.has((cx+dx)+','+(cy+dy))){const a=(cx+dx)*32,b=(cy+dy)*26;protection=Math.min(protection,Math.hypot(Math.max(a-px,0,px-a-32),Math.max(b-py,0,py-b-26)));}
  const t=Math.min(1,protection/8),taper=t*t*(3-2*t);
  // Coherent features, 36..112 tiles, not per-tile jitter or copied contours.
  const inset=(2+10*noise(px,py,56,31)+3*noise(px,py,112,97))*taper;
  let margin=distance-inset;
  // Round convex macro corners; unlike a visual-only curve, this is water authority.
  for(const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]])if(!macro(mx+sx,my)&&!macro(mx,my+sy)){
   const r=18+5*noise(px,py,80,151),lx=sx<0?px-mx*64:(mx+1)*64-px,ly=sy<0?py-my*52:(my+1)*52-py;
   if(lx<r&&ly<r){const cut=(r-Math.hypot(lx-r,ly-r))*taper+Math.min(lx,ly)*(1-taper);margin=Math.min(margin,cut-inset*.3);}
  }
  const biome=p.biomeIds[c[2]-1],slope=c[8];
  const classId=biome==='biome:frostland'?'frozen-shore':biome==='biome:volcanic'?'black-sand-beach':biome==='biome:wetland'?'marsh-reed-shore':slope>=500?'sea-cliff':slope<350&&noise(px,py,96,233)>.46?(biome==='biome:desert'?'dune-beach':'sandy-beach'):'exposed-rocky-shore';
  const beach=classId.includes('beach'),width=Math.max(2,Math.min(22,(beach?7:3)+6*noise(px,py,36,211)-slope/250));
  return {water:margin<0,shore:margin>=0&&margin<width,classId,margin,width,protected:protection===0};
 }
 return Object.freeze({tile,protectedChunks,version:LOCAL_SHORELINE_VERSION});
}
