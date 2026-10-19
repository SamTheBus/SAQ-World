import {collidesWithTiles} from '../shared/rules/world_geometry.js';

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const toward=(from,to,speed)=>{const d=distance(from,to);if(!d)return {x:0,y:0};const denominator=Math.max(d,speed);return {x:(to.x-from.x)/denominator,y:(to.y-from.y)/denominator};};
const angleSeed=value=>{let h=2166136261;for(let i=0;i<value.length;i++)h=Math.imul(h^value.charCodeAt(i),16777619);return (h>>>0)/4294967296*Math.PI*2;};

export function createEncounterContainmentD11_2(state,{participantPolicy=()=>null,targetPolicy=()=>null}={}){
 const groupsByActor=new Map(),participantsByGroup=new Map();let transitions=0,returns=0,reengagements=0,alerts=0;
 function refreshGroups(){groupsByActor.clear();for(const group of Object.values(state.groupsById))if(group.containment)for(const id of group.entityIds)groupsByActor.set(id,group);}
 const participants=(group,radius,phase)=>Object.values(state.playersById).filter(p=>p.connectionStatus==='connected').map(p=>state.entitiesById[p.entityId]).filter(a=>{if(!a?.alive||a.residency.spaceInstanceId!==group.spaceInstanceId)return false;const decision=participantPolicy(group,a,phase);return decision===null?distance(a.position,group.containment.homeAnchor)<=radius:Boolean(decision);}).sort((a,b)=>a.entityId.localeCompare(b.entityId));
 const setMode=(group,mode)=>{const c=group.containment;if(c.mode===mode)return;c.mode=mode;c.modeStartedTick=state.tick;c.outsideTicks=0;transitions++;if(mode==='returning'){returns++;for(const id of group.entityIds){const melee=state.entitiesById[id]?.ai?.melee;if(melee){melee.phase='idle';melee.phaseStartedTick=state.tick;melee.phaseEndsTick=state.tick;melee.targetEntityId=null;}}}if(mode==='engaged'&&state.tick>0)reengagements++;};
 function beginTick(){participantsByGroup.clear();for(const group of Object.values(state.groupsById).sort((a,b)=>a.groupId.localeCompare(b.groupId))){const c=group.containment;if(!c||group.cleared)continue;const acquire=participants(group,c.acquireRadius,'acquire'),pursuit=participants(group,c.pursuitRadius,'pursuit');
   if(c.mode==='guard'){if(acquire.length)setMode(group,'engaged');}
   else if(c.mode==='engaged'){if(pursuit.length)c.outsideTicks=0;else if(++c.outsideTicks>=c.disengageTicks)setMode(group,'returning');}
   else if(c.mode==='returning'&&acquire.length)setMode(group,'engaged');
   participantsByGroup.set(group.groupId,c.mode==='engaged'?participants(group,c.pursuitRadius,'pursuit'):[]);
  }}
 function targetFor(actor,eligible){const group=groupsByActor.get(actor.entityId);if(!group||group.containment.mode!=='engaged')return null;return (participantsByGroup.get(group.groupId)??[]).filter(target=>eligible(actor,target)).map(target=>({target,d:distance(actor.position,target.position)})).sort((a,b)=>a.d-b.d||a.target.entityId.localeCompare(b.target.entityId))[0]?.target??null;}
 function approach(actor,target,collision){const group=groupsByActor.get(actor.entityId),c=group?.containment;if(!c)return toward(actor.position,target.position,actor.moveSpeed);const ordinal=group.entityIds.indexOf(actor.entityId),count=Math.max(1,group.entityIds.length),base=angleSeed(group.groupId+'/'+target.entityId)+ordinal*Math.PI*2/count,offsets=[0,1,-1,2,-2,3,-3,4,-4,5,-5,6];let point=null;
  for(const offset of offsets){const angle=base+offset*Math.PI/12,p={x:target.position.x+Math.cos(angle)*c.approachRadius,y:target.position.y+Math.sin(angle)*c.approachRadius};if(!collidesWithTiles(collision,p.x,p.y,actor.hullRadius)){point=p;break;}}
  if(!point)return toward(actor.position,target.position,actor.moveSpeed);if(distance(actor.position,point)<=Math.max(1.5,actor.moveSpeed*1.25))return {x:0,y:0};return toward(actor.position,point,actor.moveSpeed);
 }
 function returnIntent(actor){const group=groupsByActor.get(actor.entityId),c=group?.containment;if(!c||c.mode!=='returning')return null;return toward(actor.position,c.memberHomesById[actor.entityId],actor.moveSpeed);}
 function finishTick(){for(const group of Object.values(state.groupsById).sort((a,b)=>a.groupId.localeCompare(b.groupId))){const c=group.containment;if(!c||c.mode!=='returning')continue;const live=group.entityIds.map(id=>state.entitiesById[id]).filter(a=>a?.alive);if(live.every(a=>distance(a.position,c.memberHomesById[a.entityId])<=c.homeTolerance)){for(const actor of live){actor.position={...c.memberHomesById[actor.entityId]};actor.movementIntent={x:0,y:0};actor.movedLastTick=false;}setMode(group,'guard');}}
 }
 function targetStillValid(actor,target,eligible){const group=groupsByActor.get(actor.entityId),decision=group&&target?targetPolicy(actor,target):null;return Boolean(group?.containment.mode==='engaged'&&target&&(decision===null?distance(target.position,group.containment.homeAnchor)<=group.containment.pursuitRadius:decision)&&eligible(actor,target));}
 function alert(actor){const group=groupsByActor.get(actor.entityId);if(!group?.containment||group.cleared)return false;setMode(group,'engaged');group.containment.outsideTicks=0;alerts++;return true;}
 refreshGroups();
 return Object.freeze({refreshGroups,beginTick,finishTick,targetFor,approach,returnIntent,targetStillValid,alert,groupForActor:id=>groupsByActor.get(id)??null,beforeSleep:group=>!group.containment||group.containment.mode==='guard',inspect:()=>({containedGroups:new Set(groupsByActor.values()).size,transitions,returns,reengagements,alerts})});
}
