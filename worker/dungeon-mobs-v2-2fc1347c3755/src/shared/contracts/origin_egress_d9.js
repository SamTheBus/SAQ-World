import {requireContract as check,freezeWire} from './wire.js';
import {D9_PROFILE as P} from '../content/world_profile_d9.js';
export function originEgress(manifest,collision,resources=[]){
 const w=collision.width,h=collision.height,T=collision.tileSize,walk=(x,y)=>collision.tiles[y]?.[x]==='1',start={x:Math.floor(manifest.start.position.x/T),y:Math.floor(manifest.start.position.y/T)},seen=new Set(),queue=[start];
 for(let i=0;i<queue.length;i++){const p=queue[i],key=p.x+','+p.y;if(seen.has(key)||!walk(p.x,p.y))continue;seen.add(key);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy;if(x>=0&&y>=0&&x<w&&y<h&&!seen.has(x+','+y))queue.push({x,y});}}
 const overlap=(x,y)=>manifest.safeRegions.some(r=>x*T<r.x+r.width&&(x+1)*T>r.x&&y*T<r.y+r.height&&(y+1)*T>r.y)||
 [...manifest.sites,...resources].some(s=>s.position&&Math.hypot((x+.5)*T-s.position.x,(y+.5)*T-s.position.y)<96);
 const openings=[];
 for(const side of ['north','east','south','west']){const horizontal=side==='north'||side==='south',length=horizontal?w:h,candidates=[];
 for(let a=2;a<length-2;a++){const cells=[],inside=[];let ok=true;for(let d=-1;d<=1;d++){const x=side==='west'?0:side==='east'?w-1:a+d,y=side==='north'?0:side==='south'?h-1:a+d,ix=x+(side==='west'?1:side==='east'?-1:0),iy=y+(side==='north'?1:side==='south'?-1:0);
 if(overlap(x,y)||!seen.has(ix+','+iy)||!walk(ix,iy)){ok=false;break;}cells.push({x,y,from:collision.tiles[y][x],to:'1'});inside.push({x:ix,y:iy});}
 if(ok)candidates.push({side,cells,inside,score:Math.abs(a-length/2)});}
 candidates.sort((a,b)=>a.score-b.score||a.cells[1].x-b.cells[1].x||a.cells[1].y-b.cells[1].y);if(candidates.length){const {score,...opening}=candidates[0];openings.push(opening);}
 }
 check(openings.length>0,'D9 origin has no safe perimeter egress; explicit migration decision required');
 return freezeWire({version:'origin-egress-d9-v1',openings});
}
export function applyOriginEgress(collision,overlay){check(overlay.version==='origin-egress-d9-v1','Origin overlay version');const rows=collision.tiles.map(s=>s.split(''));for(const o of overlay.openings)for(const c of o.cells){check(rows[c.y]?.[c.x]===c.from,'Origin overlay base differs');rows[c.y][c.x]=c.to;}return {...collision,tiles:rows.map(r=>r.join(''))};}

// The migration overlay remains the sole authoritative geometry change. These
// paths are a deterministic presentation/readability projection over already
// walkable origin tiles, so existing D9 saves gain the same route without an
// origin rewrite or a new campaign fact.
export function originEgressGuidePaths(manifest,collision,overlay){
 check(overlay.version==='origin-egress-d9-v1','Origin overlay version');
 const applied=applyOriginEgress(collision,overlay),T=applied.tileSize,start={x:Math.floor(manifest.start.position.x/T),y:Math.floor(manifest.start.position.y/T)},key=p=>p.x+','+p.y,prior=new Map([[key(start),null]]),queue=[start];
 for(let i=0;i<queue.length;i++){const p=queue[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n={x:p.x+dx,y:p.y+dy},k=key(n);if(n.x<0||n.y<0||n.x>=applied.width||n.y>=applied.height||prior.has(k)||applied.tiles[n.y][n.x]!=='1')continue;prior.set(k,p);queue.push(n);}}
 return freezeWire(overlay.openings.map(opening=>{const target=opening.inside[Math.floor(opening.inside.length/2)],cells=[];check(prior.has(key(target)),'Origin egress lost its reachable approach');for(let p=target;p;p=prior.get(key(p)))cells.push({x:p.x,y:p.y});cells.reverse();const edge=opening.cells[Math.floor(opening.cells.length/2)];cells.push({x:edge.x,y:edge.y});return {side:opening.side,cells};}));
}
