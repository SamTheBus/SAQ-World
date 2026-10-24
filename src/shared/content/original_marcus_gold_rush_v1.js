// Exact three-leg positions from the recovered Marcus-the-Outlaw playable.
// World authority animates each leg independently instead of teleporting
// through all three positions in one tick.
export const MARCUS_GOLD_RUSH_LEG_TICKS=6;
export const MARCUS_GOLD_RUSH_LEGS=3;
export const MARCUS_GOLD_RUSH_TOTAL_TICKS=MARCUS_GOLD_RUSH_LEGS*MARCUS_GOLD_RUSH_LEG_TICKS;
export function originalMarcusDashNodes(origin,target){
 if(![origin?.x,origin?.y,target?.x,target?.y].every(Number.isFinite))throw new TypeError('Invalid Marcus Gold Rush points');
 const dx=target.x-origin.x,dy=target.y-origin.y,angle=Math.atan2(dy,dx),distance=Math.hypot(dx,dy);
 const near=Math.min(distance*.35,70),far=Math.min(distance*.7,140);
 return [
  {x:origin.x+Math.cos(angle-.6)*near,y:origin.y+Math.sin(angle-.6)*near},
  {x:origin.x+Math.cos(angle+.6)*far,y:origin.y+Math.sin(angle+.6)*far},
  {x:target.x,y:target.y}
 ];
}
