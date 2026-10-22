import {FERRY_NETWORK,hasFerries} from '../content/ferry_plan_v1.js';
// Bounded global lookup. Only dry approach/arrival ground is cleared; no water
// collision, underlying hydrology, reservations, or existing route is replaced.
export function createFerryOverlay(binding){
 const tiles=new Set();if(hasFerries(binding))for(const l of FERRY_NETWORK.landings){for(const p of l.arrivals)for(let y=p.y-1;y<=p.y+1;y++)for(let x=p.x-1;x<=p.x+1;x++)tiles.add(x+','+y);for(let i=1;i<l.approach.length;i++){const a=l.approach[i-1],b=l.approach[i],n=Math.abs(a.x-b.x)+Math.abs(a.y-b.y);for(let j=0;j<=n;j++){const x=a.x+Math.sign(b.x-a.x)*j,y=a.y+Math.sign(b.y-a.y)*j;for(let yy=y-1;yy<=y+1;yy++)for(let xx=x-1;xx<=x+1;xx++)tiles.add(xx+','+yy);}}}
 return Object.freeze({at:(x,y)=>tiles.has(x+','+y),size:tiles.size});
}
