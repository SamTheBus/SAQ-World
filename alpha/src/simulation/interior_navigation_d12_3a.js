import {FUNCTIONAL_CRYPT_FAMILY} from '../shared/content/planned_crypt_policy_v1.js';
import {FUNCTIONAL_RUIN_FAMILY} from '../shared/content/planned_ruin_policy_v1.js';
import {FUNCTIONAL_FORT_FAMILY} from '../shared/content/planned_fort_policy_v1.js';
import {functionalSiteForSpaceD12} from '../shared/contracts/functional_site_d9.js';
import {CAVE_INTERIOR_NAVIGATION_D12_3A} from '../shared/content/interior_navigation_d12_3a.js';
import {collidesWithTiles} from '../shared/rules/world_geometry.js';
import {meleeLineClear} from './melee_assist.js';

const D=CAVE_INTERIOR_NAVIGATION_D12_3A;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const pointKey=p=>`${p.col},${p.row}`;
const now=()=>globalThis.performance?.now?.()??0;
const percentile=(values,q)=>{if(!values.length)return 0;const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*q))];};

export function buildInteriorNavigationGridD12_3A(collision,hullRadius){
 const {width,height,tileSize}=collision,open=Array.from({length:height},()=>new Uint8Array(width));
 for(let row=0;row<height;row++)for(let col=0;col<width;col++)open[row][col]=collidesWithTiles(collision,col*tileSize+tileSize/2,row*tileSize+tileSize/2,hullRadius)?0:1;
 return Object.freeze({width,height,tileSize,hullRadius,open});
}

const cellFor=(grid,position)=>({col:Math.floor(position.x/grid.tileSize),row:Math.floor(position.y/grid.tileSize)});
const cellOpen=(grid,col,row)=>row>=0&&row<grid.height&&col>=0&&col<grid.width&&grid.open[row][col]===1;
function nearestOpen(grid,position){
 const base=cellFor(grid,position);if(cellOpen(grid,base.col,base.row))return base;
 for(let radius=1;radius<=4;radius++){const rows=[];for(let row=base.row-radius;row<=base.row+radius;row++)for(let col=base.col-radius;col<=base.col+radius;col++)if(Math.max(Math.abs(col-base.col),Math.abs(row-base.row))===radius&&cellOpen(grid,col,row))rows.push({col,row,d:(col+.5-position.x/grid.tileSize)**2+(row+.5-position.y/grid.tileSize)**2});if(rows.length)return rows.sort((a,b)=>a.d-b.d||a.row-b.row||a.col-b.col)[0];}
 return null;
}
class MinHeap{
 constructor(compare){this.rows=[];this.compare=compare;}
 push(value){const a=this.rows;a.push(value);let i=a.length-1;while(i){const p=(i-1)>>1;if(this.compare(a[p],value)<=0)break;a[i]=a[p];i=p;}a[i]=value;}
 pop(){const a=this.rows;if(!a.length)return null;const first=a[0],last=a.pop();if(a.length){let i=0;while(true){let left=i*2+1;if(left>=a.length)break;let right=left+1,child=right<a.length&&this.compare(a[right],a[left])<0?right:left;if(this.compare(a[child],last)>=0)break;a[i]=a[child];i=child;}a[i]=last;}return first;}
 get length(){return this.rows.length;}
}
const DIRECTIONS=Object.freeze([[0,-1,10],[-1,0,10],[1,0,10],[0,1,10],[-1,-1,14],[1,-1,14],[-1,1,14],[1,1,14]]);
const heuristic=(a,b)=>{const dx=Math.abs(a.col-b.col),dy=Math.abs(a.row-b.row);return 14*Math.min(dx,dy)+10*Math.abs(dx-dy);};

export function findInteriorPathD12_3A(grid,startPosition,goalPosition){
 const start=nearestOpen(grid,startPosition),goal=nearestOpen(grid,goalPosition);if(!start||!goal)return {reachable:false,path:[],cost:null,expandedNodes:0,start,goal};
 const width=grid.width,count=width*grid.height,startId=start.row*width+start.col,goalId=goal.row*width+goal.col,inf=0x3fffffff,g=new Int32Array(count),parent=new Int32Array(count),closed=new Uint8Array(count);g.fill(inf);parent.fill(-1);g[startId]=0;
 const heap=new MinHeap((a,b)=>a.f-b.f||a.h-b.h||a.id-b.id),h0=heuristic(start,goal);heap.push({id:startId,col:start.col,row:start.row,g:0,h:h0,f:h0});let expanded=0;
 while(heap.length){const current=heap.pop();if(closed[current.id]||current.g!==g[current.id])continue;closed[current.id]=1;expanded++;if(current.id===goalId)break;
  for(const [dc,dr,cost] of DIRECTIONS){const col=current.col+dc,row=current.row+dr;if(!cellOpen(grid,col,row))continue;if(dc&&dr&&(!cellOpen(grid,current.col+dc,current.row)||!cellOpen(grid,current.col,current.row+dr)))continue;const id=row*width+col,score=current.g+cost;if(score>=g[id])continue;g[id]=score;parent[id]=current.id;const h=heuristic({col,row},goal);heap.push({id,col,row,g:score,h,f:score+h});}
 }
 if(g[goalId]===inf)return {reachable:false,path:[],cost:null,expandedNodes:expanded,start,goal};
 const cells=[];for(let id=goalId;id!==-1;id=parent[id]){cells.push({col:id%width,row:Math.floor(id/width)});if(id===startId)break;}cells.reverse();const path=cells.map(cell=>({x:(cell.col+.5)*grid.tileSize,y:(cell.row+.5)*grid.tileSize,col:cell.col,row:cell.row}));
 return {reachable:true,path,cost:g[goalId],expandedNodes:expanded,start,goal};
}

export function createInteriorNavigationD12_3A(state,{eligible=(source,target)=>source.alive&&target.alive&&source.team!==target.team,lineClear=meleeLineClear,inAttackGeometry=()=>false}={}){
 const groupsByActor=new Map(),managedGroups=new Map(),grids=new Map(),routes=new Map(),pairCache=new Map(),expandedSamples=[],tickMsSamples=[];
 const metrics={gridBuilds:0,gridCacheHits:0,pathSearches:0,replans:0,routeCacheHits:0,pairCacheHits:0,unreachableResults:0,maxExpandedNodes:0};let tickWorkMs=0;
 function refreshGroups(){groupsByActor.clear();managedGroups.clear();for(const group of Object.values(state.groupsById)){const site=functionalSiteForSpaceD12(state,group.spaceInstanceId);if(![D.floorFamilyVersion,FUNCTIONAL_FORT_FAMILY,FUNCTIONAL_RUIN_FAMILY,FUNCTIONAL_CRYPT_FAMILY].includes(site?.version))continue;managedGroups.set(group.groupId,group);for(const id of group.entityIds)if(state.entitiesById[id]?.ai?.interiorNavigation?.version===D.version)groupsByActor.set(id,group);}for(const id of routes.keys())if(!groupsByActor.has(id))routes.delete(id);}
 function gridFor(actor){const key=`${actor.residency.spaceInstanceId}/${actor.hullRadius}`,prior=grids.get(key);if(prior){metrics.gridCacheHits++;return prior;}const collision=state.spacesByInstanceId[actor.residency.spaceInstanceId].collision,grid=buildInteriorNavigationGridD12_3A(collision,actor.hullRadius);grids.set(key,grid);metrics.gridBuilds++;return grid;}
 function recordSearch(result){metrics.pathSearches++;metrics.maxExpandedNodes=Math.max(metrics.maxExpandedNodes,result.expandedNodes);expandedSamples.push(result.expandedNodes);if(expandedSamples.length>512)expandedSamples.shift();if(!result.reachable)metrics.unreachableResults++;return result;}
 function search(actor,from,to){return recordSearch(findInteriorPathD12_3A(gridFor(actor),from,to));}
 function pairPath(actor,target){const grid=gridFor(actor),start=nearestOpen(grid,actor.position),goal=nearestOpen(grid,target.position);if(!start||!goal)return search(actor,actor.position,target.position);const key=`${actor.entityId}/${target.entityId}/${pointKey(start)}/${pointKey(goal)}`,cached=pairCache.get(key);if(cached&&cached.expiresTick>=state.tick){metrics.pairCacheHits++;return cached.result;}const result=search(actor,actor.position,target.position);pairCache.set(key,{expiresTick:state.tick+D.replanIntervalTicks,result});if(pairCache.size>256)pairCache.delete(pairCache.keys().next().value);return result;}
 const playersInSpace=spaceId=>Object.values(state.playersById).filter(p=>p.connectionStatus==='connected').map(p=>state.entitiesById[p.entityId]).filter(a=>a?.alive&&a.residency.spaceInstanceId===spaceId).sort((a,b)=>a.entityId.localeCompare(b.entityId));
 const withinMemberHome=(group,actor,target,radius)=>distance(group.containment.memberHomesById[actor.entityId]??group.containment.homeAnchor,target.position)<=radius;
 const visible=(actor,target)=>eligible(actor,target)&&lineClear(state.spacesByInstanceId[actor.residency.spaceInstanceId].collision,actor,target);
 function reachableVisible(actor,target,range){if(distance(actor.position,target.position)>range||!visible(actor,target))return null;const path=pairPath(actor,target);return path.reachable?path:null;}
 function canGroupAcquire(group,target){if(!managedGroups.has(group.groupId))return false;return group.entityIds.map(id=>state.entitiesById[id]).filter(a=>a?.alive).sort((a,b)=>a.entityId.localeCompare(b.entityId)).some(actor=>withinMemberHome(group,actor,target,group.containment.pursuitRadius)&&Boolean(reachableVisible(actor,target,actor.ai.acquireRange)));}
 function participantPolicy(group,target,phase){if(!managedGroups.has(group.groupId))return null;if(phase==='acquire')return canGroupAcquire(group,target);return group.entityIds.some(id=>{const actor=state.entitiesById[id],nav=actor?.ai?.interiorNavigation;return actor?.alive&&withinMemberHome(group,actor,target,group.containment.pursuitRadius)&&nav?.targetEntityId===target.entityId&&nav.memoryExpiresTick!==null&&state.tick<=nav.memoryExpiresTick;});}
 function targetPolicy(actor,target){const group=groupsByActor.get(actor.entityId);return group?withinMemberHome(group,actor,target,group.containment.pursuitRadius):null;}
 function reset(nav,mode='idle'){nav.mode=mode;nav.targetEntityId=null;nav.lastKnownPosition=null;nav.lastSeenTick=null;nav.memoryExpiresTick=null;nav.blockedTicks=0;nav.replanAfterTick=state.tick;}
 function remember(actor,target){const nav=actor.ai.interiorNavigation;nav.mode='pursuit';nav.targetEntityId=target.entityId;nav.lastKnownPosition={x:target.position.x,y:target.position.y};nav.lastSeenTick=state.tick;nav.memoryExpiresTick=state.tick+D.memoryTicks;}
 function alert(actor,target){const group=groupsByActor.get(actor.entityId);if(!group||!actor.alive||!target?.alive||target.residency.spaceInstanceId!==actor.residency.spaceInstanceId)return false;remember(actor,target);routes.delete(actor.entityId);return true;}
 function selectVisible(actor,group,nav){const candidates=playersInSpace(group.spaceInstanceId).filter(target=>withinMemberHome(group,actor,target,group.containment.pursuitRadius));if(nav.targetEntityId){const current=candidates.find(target=>target.entityId===nav.targetEntityId);if(current){const route=reachableVisible(actor,current,group.containment.pursuitRadius);if(route)return {target:current,route};}}
  const range=actor.ai.acquireRange,rows=[];for(const target of candidates){const route=reachableVisible(actor,target,range);if(route)rows.push({target,route});}return rows.sort((a,b)=>a.route.cost-b.route.cost||distance(actor.position,a.target.position)-distance(actor.position,b.target.position)||a.target.entityId.localeCompare(b.target.entityId))[0]??null;
 }
 function routeIntent(actor,destination,{returning=false,directTarget=null,seedRoute=null,arrivalTolerance=D.arrivalTolerance}={}){const nav=actor.ai.interiorNavigation,grid=gridFor(actor),goal=nearestOpen(grid,destination);if(!goal)return {intent:{x:0,y:0},reached:false,unreachable:true};let record=routes.get(actor.entityId);
  if(record?.requested&&(!actor.ai.melee||actor.ai.melee.phase==='idle')&&!actor.movedLastTick)nav.blockedTicks++;else if(actor.movedLastTick)nav.blockedTicks=0;
  const goalKey=pointKey(goal),needs=!record||record.spaceInstanceId!==actor.residency.spaceInstanceId||record.goalKey!==goalKey&&state.tick>=nav.replanAfterTick||nav.blockedTicks>=D.blockedReplanTicks||record.unreachable&&state.tick>=nav.replanAfterTick;
  if(needs){const result=seedRoute&&pointKey(seedRoute.goal)===goalKey?seedRoute:search(actor,actor.position,destination);metrics.replans++;nav.replanAfterTick=state.tick+(result.reachable?D.replanIntervalTicks:D.unreachableRetryTicks);nav.blockedTicks=0;record={spaceInstanceId:actor.residency.spaceInstanceId,goalKey,path:result.path,index:Math.min(1,Math.max(0,result.path.length-1)),unreachable:!result.reachable,requested:false};routes.set(actor.entityId,record);}
  else metrics.routeCacheHits++;
  if(record.unreachable){record.requested=false;if(!returning)nav.mode='unreachable';return {intent:{x:0,y:0},reached:false,unreachable:true};}
  if(directTarget&&inAttackGeometry(actor,directTarget)&&visible(actor,directTarget)){record.requested=false;return {intent:{x:0,y:0},reached:true,unreachable:false};}
  while(record.index<record.path.length-1&&distance(actor.position,record.path[record.index])<=Math.max(8,actor.moveSpeed*1.5))record.index++;
  const remaining=distance(actor.position,destination);if(!directTarget&&remaining<=arrivalTolerance){record.requested=false;return {intent:{x:0,y:0},reached:true,unreachable:false};}
  let waypoint=record.path[record.index]??destination,d=distance(actor.position,waypoint);if(record.index>=record.path.length-1&&pointKey(cellFor(grid,actor.position))===record.goalKey){waypoint=destination;d=remaining;}
  if(!d){record.requested=false;return {intent:{x:0,y:0},reached:true,unreachable:false};}record.requested=true;return {intent:{x:(waypoint.x-actor.position.x)/d,y:(waypoint.y-actor.position.y)/d},reached:false,unreachable:false};
 }
 function intentFor(actor){const group=groupsByActor.get(actor.entityId);if(!group)return null;const nav=actor.ai.interiorNavigation;if(group.containment.mode==='guard'){reset(nav);routes.delete(actor.entityId);return {target:null,intent:{x:0,y:0},returning:false};}
  if(group.containment.mode==='returning'){if(nav.mode!=='returning'){reset(nav,'returning');routes.delete(actor.entityId);}const home=group.containment.memberHomesById[actor.entityId],move=routeIntent(actor,home,{returning:true,arrivalTolerance:group.containment.homeTolerance});return {target:null,intent:move.intent,returning:true};}
  if(actor.ai.melee&&actor.ai.melee.phase!=='idle'){const record=routes.get(actor.entityId);if(record)record.requested=false;const target=state.entitiesById[actor.ai.melee.targetEntityId];if(target?.alive&&withinMemberHome(group,actor,target,group.containment.pursuitRadius)&&visible(actor,target))remember(actor,target);return {target:target?.alive?target:null,intent:{x:0,y:0},returning:false};}
  const selected=selectVisible(actor,group,nav);if(selected){remember(actor,selected.target);const move=routeIntent(actor,selected.target.position,{directTarget:selected.target,seedRoute:selected.route});return {target:selected.target,intent:move.intent,returning:false};}
  const remembered=nav.targetEntityId&&state.entitiesById[nav.targetEntityId],valid=remembered?.alive&&remembered.residency.spaceInstanceId===actor.residency.spaceInstanceId&&nav.lastKnownPosition&&nav.memoryExpiresTick!==null&&state.tick<=nav.memoryExpiresTick&&withinMemberHome(group,actor,remembered,group.containment.pursuitRadius);
  if(valid){nav.mode='memory';const move=routeIntent(actor,nav.lastKnownPosition);if(move.reached)nav.memoryExpiresTick=state.tick;return {target:null,intent:move.intent,returning:false};}
  reset(nav);routes.delete(actor.entityId);return {target:null,intent:{x:0,y:0},returning:false};
 }
 function timed(fn){const started=now();try{return fn();}finally{tickWorkMs+=Math.max(0,now()-started);}}
 function startTick(){tickWorkMs=0;}
 function finishTick(){tickMsSamples.push(tickWorkMs);if(tickMsSamples.length>512)tickMsSamples.shift();}
 function inspect(){return {version:D.version,gridBuilds:metrics.gridBuilds,cachedFloorRecords:grids.size,pathSearches:metrics.pathSearches,replans:metrics.replans,cacheHits:metrics.gridCacheHits+metrics.routeCacheHits+metrics.pairCacheHits,gridCacheHits:metrics.gridCacheHits,routeCacheHits:metrics.routeCacheHits,pairCacheHits:metrics.pairCacheHits,unreachableResults:metrics.unreachableResults,expandedNodes:{max:metrics.maxExpandedNodes,p95:percentile(expandedSamples,.95)},authorityTickMs:{max:tickMsSamples.length?Math.max(...tickMsSamples):0,p95:percentile(tickMsSamples,.95)},managedGroups:managedGroups.size,managedActors:groupsByActor.size};}
 refreshGroups();
 return Object.freeze({refreshGroups,startTick,finishTick,inspect,intentFor:actor=>timed(()=>intentFor(actor)),alert:(actor,target)=>timed(()=>alert(actor,target)),manages:actor=>groupsByActor.has(actor.entityId),groupForActor:id=>groupsByActor.get(id)??null,participantPolicy:(group,target,phase)=>timed(()=>participantPolicy(group,target,phase)),targetPolicy});
}
