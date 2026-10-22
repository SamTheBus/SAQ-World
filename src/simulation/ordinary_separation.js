import {aegisMimicCorporeal} from '../shared/content/aegis_mimics_v2.js';
import {ordinaryEnemyForProfile} from '../shared/content/ordinary_enemies.js';
import {collidesWithTiles} from '../shared/rules/world_geometry.js';

// H4A mob_combat.js: 18px center distance, 0.15 overlap pressure.
// World keeps its authoritative hull (10px, versus source separation radius 8).
export const ORDINARY_SEPARATION=Object.freeze({distance:18,pressure:.15,maxStep:2.7});
const eligible=(a,state)=>aegisMimicCorporeal(state,a?.entityId)&&a?.alive&&a.team==='hostile'&&Boolean(ordinaryEnemyForProfile(a.contentDefinitionId));
export function separationImpulse(a,b){
  const dx=a.position.x-b.position.x,dy=a.position.y-b.position.y,d=Math.hypot(dx,dy);
  if(d>=ORDINARY_SEPARATION.distance)return {x:0,y:0};
  let x,y;
  if(d>.1){x=dx/d;y=dy/d;}
  else {
    // Canonical pair identity, opposite directions for its two actors. No RNG.
    const first=a.entityId<b.entityId,key=first?a.entityId+b.entityId:b.entityId+a.entityId;
    let hash=0;for(let i=0;i<key.length;i++)hash=(Math.imul(hash,31)+key.charCodeAt(i))>>>0;
    const angle=(hash%8)*Math.PI/4,sign=first?1:-1;x=Math.cos(angle)*sign;y=Math.sin(angle)*sign;
  }
  const force=(ORDINARY_SEPARATION.distance-d)*ORDINARY_SEPARATION.pressure;
  return {x:x*force,y:y*force};
}
export function separateLiveOrdinary(state,activeIds,spatial,manifest,measure){
  const stats={queries:0,candidates:0,pairs:0,movedActors:0,maxCandidates:0};
  // activeIds and spatial candidates are canonical ID ordered and bounded by
  // the existing scheduler's 48 actor ceiling. Dormant index is never queried.
  for(const id of activeIds){const a=state.entitiesById[id];if(!eligible(a,state))continue;
    const ids=measure('separationQuery',()=>spatial.query(a.residency.spaceInstanceId,a.position,ORDINARY_SEPARATION.distance));
    stats.queries++;stats.candidates+=ids.length;stats.maxCandidates=Math.max(stats.maxCandidates,ids.length);
    let dx=0,dy=0;
    for(const otherId of ids){const b=state.entitiesById[otherId];if(id===otherId||!eligible(b,state))continue;
      const impulse=separationImpulse(a,b);dx+=impulse.x;dy+=impulse.y;if(impulse.x||impulse.y)stats.pairs++;
    }
    const length=Math.hypot(dx,dy),scale=length>ORDINARY_SEPARATION.maxStep?ORDINARY_SEPARATION.maxStep/length:1;dx*=scale;dy*=scale;
    if(!dx&&!dy)continue;
    const collision=state.spacesByInstanceId[a.residency.spaceInstanceId].collision,r=a.hullRadius;
    const legal=(x,y)=>!collidesWithTiles(collision,x,y,r)&&!(a.residency.spaceInstanceId===state.overworldInstanceId&&manifest.safeRegions.some(s=>x+r>s.x&&x-r<s.x+s.width&&y+r>s.y&&y-r<s.y+s.height));
    // Small (< one hull) X-then-Y moves preserve wall sliding and test the final
    // diagonal corner, not two independently legal but jointly illegal axes.
    const p=a.position;let x=p.x,y=p.y;if(dx&&legal(x+dx,y))x+=dx;if(dy&&legal(x,y+dy))y+=dy;
    if(x!==p.x||y!==p.y){a.position={x,y};a.movedLastTick=true;stats.movedActors++;spatial.insert(id,a.residency.spaceInstanceId,[a.position]);}
  }
  return stats;
}
