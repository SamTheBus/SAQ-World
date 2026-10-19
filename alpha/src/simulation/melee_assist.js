import {canTargetActor} from './trusted_combat_rules.js';
import {isActorInReach,collisionTile} from '../shared/rules/world_geometry.js';

// Dungeon combat_targeting.js nearest reachable mob, without its automatic loop.
// A strict neighborhood cap; actual current hull-gap reach is checked separately.
export const MELEE_ASSIST_RADIUS=64;

export function meleeLineClear(collision,source,target){
  const a=source.position,b=target.position,size=collision.tileSize,dx=b.x-a.x,dy=b.y-a.y;
  // Exact segment/solid-tile intersection, including blocked diagonal corners.
  // The melee segment bounds this small tile rectangle, never the world grid.
  for(let row=Math.floor(Math.min(a.y,b.y)/size);row<=Math.floor(Math.max(a.y,b.y)/size);row++)
    for(let col=Math.floor(Math.min(a.x,b.x)/size);col<=Math.floor(Math.max(a.x,b.x)/size);col++){
      if(collisionTile(collision,col,row)==='1')continue;
      let lo=0,hi=1;
      for(const [origin,d,min,max] of [[a.x,dx,col*size,(col+1)*size],[a.y,dy,row*size,(row+1)*size]]){
        if(d===0){if(origin<min||origin>max){lo=1;hi=0;break;}}
        else {const t1=(min-origin)/d,t2=(max-origin)/d;lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));}
      }
      if(lo<=hi)return false;
    }
  return true;
}
export function captureMeleeAssistAim(source,candidates,collision){
  let best=null,bestDistance=Infinity;
  for(const target of candidates){
    if(!canTargetActor(source,target)||target.team!=='hostile'||source.residency.spaceInstanceId!==target.residency.spaceInstanceId||!isActorInReach(source,target))continue;
    const dx=target.position.x-source.position.x,dy=target.position.y-source.position.y,distance=Math.hypot(dx,dy);
    if(distance>MELEE_ASSIST_RADIUS||!meleeLineClear(collision,source,target))continue;
    if(distance<bestDistance||(distance===bestDistance&&target.entityId<best.entityId)){best=target;bestDistance=distance;}
  }
  // Coincident centers cannot define a direction: retain manual aim in that case.
  return best&&bestDistance>0?{x:(best.position.x-source.position.x)/bestDistance,y:(best.position.y-source.position.y)/bestDistance}:null;
}
