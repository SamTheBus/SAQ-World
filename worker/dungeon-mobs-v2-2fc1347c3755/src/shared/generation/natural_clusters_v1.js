import {freezeWire,requireContract as check} from '../contracts/wire.js';

export const NATURAL_CLUSTER_VERSION='planned-natural-clusters-v1';
export const NATURAL_CLUSTER_RULES=freezeWire({
 cellTiles:12,neighborRadius:1,descriptorCacheLimit:256,
 profiles:{w:{admission:59,scale:1},t:{admission:51,scale:.98},m:{admission:40,scale:.86},a:{admission:25,scale:.76},r:{admission:29,scale:.79},d:{admission:21,scale:.72},s:{admission:22,scale:.74},l:{admission:32,scale:.80}},
 protection:{routeShoulderTiles:1,waterMarginTiles:1,reservationMarginTiles:1},
});
const hash=text=>{let h=2166136261;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);return h>>>0;};
const unit=(h,n)=>((h>>>n)&255)/255;
export const naturalVisualKind=(code,blockerKind)=>blockerKind==='rock'||['r','d','s','l'].includes(code)?'rock':code==='m'?'tree':'base';

// A sample consults nine jittered, seed-derived centers, never resident pages.
// The small cache is an acceleration only; eviction/order cannot change a result.
export function createNaturalClusterSampler(seedDigest){
 check(typeof seedDigest==='string'&&seedDigest.length>0,'Natural cluster seed required');
 const cache=new Map();let sampled=0,created=0,maxCandidates=0;
 function descriptor(gx,gy){
  const key=gx+','+gy;if(cache.has(key))return cache.get(key);
  const n=hash(seedDigest+'/'+NATURAL_CLUSTER_VERSION+'/'+key),a=hash(n+'/shape'),b=hash(n+'/lobes'),angle=unit(a,0)*Math.PI;
  const p={id:NATURAL_CLUSTER_VERSION+':'+n.toString(16).padStart(8,'0')+':'+key,n,
   x:gx*12+2+unit(n,0)*8,y:gy*12+2+unit(n,8)*8,
   rx:3.1+unit(a,8)*2.5,ry:2.2+unit(a,16)*2.1,c:Math.cos(angle),s:Math.sin(angle),
   lobeX:(unit(b,0)-.5)*4,lobeY:(unit(b,8)-.5)*3,lobeR:1.5+unit(b,16)*1.3,
   phase:unit(a,24)*Math.PI*2,cove:n%3===0,admission:(n>>>16)%100,rock:n%13===0};
  if(cache.size===256)cache.delete(cache.keys().next().value);cache.set(key,p);created++;return p;
 }
 function sample(x,y,biome){
  check(Number.isSafeInteger(x)&&Number.isSafeInteger(y),'Natural cluster global tile required');
  const profile=NATURAL_CLUSTER_RULES.profiles[biome];if(!profile)return null;
  const gx=Math.floor(x/12),gy=Math.floor(y/12);let best=null,score=0,count=0;
  for(let yy=gy-1;yy<=gy+1;yy++)for(let xx=gx-1;xx<=gx+1;xx++){
   count++;const p=descriptor(xx,yy);if(p.admission>=profile.admission)continue;
   const dx=(x+.5-p.x)/profile.scale,dy=(y+.5-p.y)/profile.scale,u=dx*p.c+dy*p.s,v=-dx*p.s+dy*p.c;
   const theta=Math.atan2(v,u),edge=1+.16*Math.sin(theta*3+p.phase)+.10*Math.cos(theta*2-p.phase),body=1-Math.hypot(u/p.rx,v/p.ry)/edge;
   const lobe=1-Math.hypot(u-p.lobeX,v-p.lobeY)/p.lobeR,inside=Math.max(body,lobe*.70);
   // A coherent off-center opening makes crescents and readable gaps; no
   // independent tile noise or one-roll-per-square obstacle pockets.
   if(inside<=0||p.cove&&Math.hypot(u-p.rx*.80,v+p.ry*.32)<1.3)continue;
   if(inside>score||inside===score&&p.id<best.id){score=inside;best=p;}
  }
  sampled++;maxCandidates=Math.max(maxCandidates,count);
  return best?{clusterId:best.id,kind:['r','d','s','l'].includes(biome)||best.rock?'rock':'thicket',seed:best.n}:null;
 }
 return Object.freeze({sample,stats:()=>({sampled,created,cachedDescriptors:cache.size,maxCandidates,cacheLimit:256})});
}

// Index accepted capacity once. Sampling checks only this tile's neighboring
// chunks, not the whole world or an exploration-dependent connected component.
export function createNaturalProtection(asset,{ruinFootprints=[]}={}){
 const protectedChunks=new Set(),ruinKeys=new Set(ruinFootprints.map(c=>c.x+','+c.y));
 const add=c=>{if(c&&Number.isSafeInteger(c.x)&&Number.isSafeInteger(c.y))protectedChunks.add(c.x+','+c.y);};
 for(const s of asset.settlements??[])for(const c of [...s.core,...s.expansion,...s.sockets])add(c);
 for(const s of asset.sites??[]){for(const c of s.approach)add(c);for(const c of s.footprint)if(!ruinKeys.has(c.x+','+c.y))add(c);}
 for(const s of asset.futureIslands??[])for(const c of [s.entrance,s.approach,s.landing,s.breathing])add(c);
 for(const s of asset.factions??[])for(const c of [...s.campus,...s.activity,...s.arrival,...s.approach])add(c);
 // These authoritative records use runtime chunk coordinates, not macro cells.
 for(const c of asset.originZone?.runtimeChunks??[])add({x:c.chunkX,y:c.chunkY});
 for(const c of asset.extraProtected??[])add(c);
 const at=(x,y)=>protectedChunks.has(Math.floor(x/32)+','+Math.floor(y/26));
 return Object.freeze({at,chunkCount:protectedChunks.size});
}
