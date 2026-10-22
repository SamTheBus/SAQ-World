import {ordinaryRangedProfile} from '../shared/content/ordinary_ranged_profiles_v2.js';
import {copyWire} from '../shared/contracts/wire.js';
import {collisionTile} from '../shared/rules/world_geometry.js';

// Host-owned straight shots. The client receives copied positions and never
// chooses a target, advances a shot or decides whether damage happened.
const GLOBAL_LIMIT=128, SOURCE_LIMIT=4;
const idle=(tick)=>({phase:'idle',phaseStartedTick:tick,phaseEndsTick:tick,targetEntityId:null,aim:null,actionSequence:0});
const point=(p,d,t)=>({x:p.x+d.x*t,y:p.y+d.y*t});

function segmentCircle(start,delta,center,radius){
  const x=start.x-center.x,y=start.y-center.y,a=delta.x*delta.x+delta.y*delta.y,c=x*x+y*y-radius*radius;
  if(c<=0)return 0;if(a===0)return null;
  const b=2*(x*delta.x+y*delta.y),discriminant=b*b-4*a*c;
  if(discriminant<0)return null;
  const t=(-b-Math.sqrt(discriminant))/(2*a);
  return t>=0&&t<=1?t:null;
}

function segmentBox(start,delta,left,top,right,bottom){
  let lo=0,hi=1;
  for(const [p,d,min,max] of [[start.x,delta.x,left,right],[start.y,delta.y,top,bottom]]){
    if(d===0){if(p<min||p>max)return null;}
    else {const a=(min-p)/d,b=(max-p)/d;lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));if(lo>hi)return null;}
  }
  return lo;
}

// Radius-expanded tiles prevent tunnelling and stop diagonal corner shots.
// A wall wins ties with an actor, including a newly closed doorway.
function wallContact(collision,start,delta,radius){
  const end=point(start,delta,1),size=collision.tileSize;let first=null;
  for(let y=Math.floor((Math.min(start.y,end.y)-radius)/size);y<=Math.floor((Math.max(start.y,end.y)+radius)/size);y++)
    for(let x=Math.floor((Math.min(start.x,end.x)-radius)/size);x<=Math.floor((Math.max(start.x,end.x)+radius)/size);x++){
      if(collisionTile(collision,x,y)==='1')continue;
      const t=segmentBox(start,delta,x*size-radius,y*size-radius,(x+1)*size+radius,(y+1)*size+radius);
      if(t!==null&&(first===null||t<first))first=t;
    }
  return first;
}

export function createHostileProjectileSimulation(state,{damage,eligible,identity,lineClear,canAct=()=>true,canLaunch=eligible,getSourceLevel=()=>1}){
  const profile=ordinaryRangedProfile;
  const root=()=>state.hostileCombat;
  const connected=a=>Object.values(state.playersById).some(p=>p.entityId===a?.entityId&&p.connectionStatus==='connected');
  const resetAction=action=>({...idle(state.tick),...(action?.nextShotTick!==undefined?{nextShotTick:action.nextShotTick}:{})});
  function cancelSource(id){const c=root();if(!c)return;delete c.actionsByEntityId[id];for(const [key,p] of Object.entries(c.projectiles))if(p.sourceId===id)delete c.projectiles[key];}
  function cancelTarget(id){const c=root();if(!c)return;for(const [key,a] of Object.entries(c.actionsByEntityId))if(a.targetEntityId===id)c.actionsByEntityId[key]=resetAction(a);for(const [key,p] of Object.entries(c.projectiles))if(p.intendedTargetId===id)delete c.projectiles[key];}
  function beginTick(activeIds){const c=root();if(!c)return;const active=new Set(activeIds);
    for(const [id,action] of Object.entries(c.actionsByEntityId)){
      const source=state.entitiesById[id];
      if(!source?.alive||!profile(source)){cancelSource(id);continue;}
      if(!active.has(id)){
        if(action.nextShotTick!==undefined){c.actionsByEntityId[id]=resetAction(action);for(const [key,p] of Object.entries(c.projectiles))if(p.sourceId===id)delete c.projectiles[key];}
        else cancelSource(id);continue;
      }
      if(action.phase==='recovery'&&state.tick>=action.phaseEndsTick)c.actionsByEntityId[id]=resetAction(action);
    }
    for(const [id,shot] of Object.entries(c.projectiles)){
      const source=state.entitiesById[shot.sourceId],target=state.entitiesById[shot.intendedTargetId];
      if(!source?.alive||source.residency.spaceInstanceId!==shot.spaceInstanceId||source.residency.residencyRevision!==shot.sourceResidencyRevision||!target?.alive||!connected(target)||target.residency.spaceInstanceId!==shot.spaceInstanceId)delete c.projectiles[id];
    }
  }
  function observeTarget(source,target,intent){const config=profile(source),c=root();if(!config||!c)return intent;
    const action=c.actionsByEntityId[source.entityId]??=idle(state.tick);
    if(action.phase!=='idle')return {x:0,y:0};
    if(config.meleeFallback&&source.ai?.melee&&source.ai.melee.phase!=='idle')return {x:0,y:0};
    if(!target||!connected(target)||!canLaunch(source,target)||!canAct(source))return intent;
    const dx=target.position.x-source.position.x,dy=target.position.y-source.position.y,d=Math.hypot(dx,dy);
    // Close hybrid targets use the retained contact attack and its normal reach
    // test. A committed shot finishes its warning before modes can change.
    if(config.meleeFallback&&d<=config.minimumRange)return intent;
    const collision=state.spacesByInstanceId[source.residency.spaceInstanceId].collision,clear=lineClear(collision,source,target);
    if(d<=config.range&&clear&&source.attackTimer>=source.attackDelayTicks&&state.tick>=(action.nextShotTick??0)){
      Object.assign(action,{phase:'windup',phaseStartedTick:state.tick,phaseEndsTick:state.tick+config.windupTicks,targetEntityId:target.entityId,aim:d?{x:dx/d,y:dy/d}:{x:1,y:0},actionSequence:source.nextAttackActionSequence});
      return {x:0,y:0};
    }
    if(!clear||d>config.preferredRange)return intent;
    if(d>0&&d<config.minimumRange)return {x:-dx/d*.7,y:-dy/d*.7};
    if(d===0)return {x:-.7,y:0};
    return {x:0,y:0};
  }
  function advance(){const c=root();if(!c)return;
    for(const [id,action] of Object.entries(c.actionsByEntityId).sort(([a],[b])=>a.localeCompare(b))){
      if(action.phase!=='windup'||state.tick<action.phaseEndsTick)continue;
      const source=state.entitiesById[id],target=state.entitiesById[action.targetEntityId],config=profile(source);
      if(!source?.alive||!config||!target?.alive||!connected(target)||!canLaunch(source,target)){cancelSource(id);continue;}
      if(!canAct(source))continue;
      const collision=state.spacesByInstanceId[source.residency.spaceInstanceId].collision;
      const fullOffset=config.muzzleOffset??source.hullRadius+config.radius+1;
      const fullDelta={x:action.aim.x*fullOffset,y:action.aim.y*fullOffset};let muzzleOffset=fullOffset;
      // Do not skip an overlapping party member between the body and muzzle.
      for(const p of Object.values(state.playersById)){
        const actor=state.entitiesById[p.entityId];if(p.connectionStatus!=='connected'||!actor?.alive||!eligible(source,actor))continue;
        const t=segmentCircle(source.position,fullDelta,actor.position,config.radius+actor.combatRadius);
        if(t!==null)muzzleOffset=Math.min(muzzleOffset,t*fullOffset);
      }
      const muzzle=point(source.position,action.aim,muzzleOffset);
      const launchDelta={x:muzzle.x-source.position.x,y:muzzle.y-source.position.y};
      const blocked=wallContact(collision,source.position,launchDelta,config.radius)!==null;
      if(!blocked&&Object.keys(c.projectiles).length<GLOBAL_LIMIT&&Object.values(c.projectiles).filter(p=>p.sourceId===id).length<SOURCE_LIMIT){
        const shotId=identity('act');
        c.projectiles[shotId]={id:shotId,actionSequence:source.nextAttackActionSequence,sourceId:id,sourceResidencyRevision:source.residency.residencyRevision,spaceInstanceId:source.residency.spaceInstanceId,intendedTargetId:target.entityId,position:muzzle,direction:{...action.aim},remaining:config.travelRange,remainingTicks:config.lifeTicks,firedTick:state.tick,radius:config.radius,type:config.projectileType,attack:copyWire(source.attackDamage),sourceLevel:copyWire(getSourceLevel(source.entityId))};
      }
      source.attackTimer=0;source.nextAttackActionSequence++;
      if(config.cooldownTicks)action.nextShotTick=state.tick+config.cooldownTicks;
      Object.assign(action,{phase:'recovery',phaseStartedTick:state.tick,phaseEndsTick:state.tick+config.recoveryTicks});
    }
    // Keep a new shot at its muzzle for one simulation tick. Its first visible
    // position therefore precedes any later collision or damage event.
    for(const [id,shot] of Object.entries(c.projectiles).sort(([a],[b])=>a.localeCompare(b))){
      if(c.projectiles[id]!==shot)continue;
      if(shot.firedTick===state.tick)continue;
      const source=state.entitiesById[shot.sourceId],config=profile(source),collision=state.spacesByInstanceId[shot.spaceInstanceId]?.collision;
      if(!source?.alive||!config||!collision){delete c.projectiles[id];continue;}
      const distance=Math.min(config.speed,shot.remaining),delta={x:shot.direction.x*distance,y:shot.direction.y*distance};
      const wall=wallContact(collision,shot.position,delta,shot.radius);let hit=null,hitTime=null;
      for(const p of Object.values(state.playersById).sort((a,b)=>a.entityId.localeCompare(b.entityId))){
        const actor=state.entitiesById[p.entityId];if(p.connectionStatus!=='connected'||!actor?.alive||!eligible(source,actor))continue;
        const t=segmentCircle(shot.position,delta,actor.position,shot.radius+actor.combatRadius);
        if(t!==null&&(hitTime===null||t<hitTime)){hit=actor;hitTime=t;}
      }
      if(wall!==null&&(hitTime===null||wall<=hitTime)){delete c.projectiles[id];continue;}
      if(hit){const position=point(shot.position,delta,hitTime);delete c.projectiles[id];damage(source,hit,shot.attack,'hostile',null,{directEnemyAttack:'ranged',projectileImpact:true,projectileDirection:{...shot.direction},sourceActionSequence:shot.actionSequence,sourceLevel:shot.sourceLevel,projectileContact:{position,style:shot.type}});continue;}
      shot.position=point(shot.position,delta,1);shot.remaining-=distance;shot.remainingTicks--;
      if(shot.remaining<=1e-9||shot.remainingTicks<=0)delete c.projectiles[id];
    }
  }
  function canMelee(source,target){
    const config=profile(source);if(!config)return true;
    if(!config.meleeFallback||!target||root()?.actionsByEntityId[source.entityId]?.phase!=='idle')return false;
    return Math.hypot(target.position.x-source.position.x,target.position.y-source.position.y)<=config.minimumRange;
  }
  return Object.freeze({beginTick,observeTarget,advance,cancelSource,cancelTarget,isRanged:a=>Boolean(profile(a)),canMelee});
}
