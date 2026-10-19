import { createSpatialIndex } from './activity_spatial.js';
import { requireContract, safeInteger } from '../shared/contracts/wire.js';
import {functionalSiteSpaceIdsD12} from '../shared/contracts/functional_site_d9.js';
export const ACTIVITY_DEFAULTS=Object.freeze({prepareRadius:512,leaveRadius:704,mergeDistance:768,splitTicks:60,sleepTicks:120,softActors:24,hardActors:48});
export function createActivityScheduler(state,options={}, {beforeSleep=()=>true,onWake=()=>{}}={}) {
  const config=Object.freeze({...ACTIVITY_DEFAULTS,...options});
  for(const v of Object.values(config))safeInteger(v,1);
  requireContract(config.prepareRadius>=400&&config.leaveRadius>config.prepareRadius&&config.mergeDistance>=config.prepareRadius&&config.hardActors<=48&&config.softActors<=config.hardActors,'Unsafe activity configuration');
  requireContract(config.hardActors>=Object.keys(state.playersById).length,'Actor budget must include every player');
  const dormant=createSpatialIndex(),active=new Map(),separatedSince=new Map();let clusters=[],deferred=0,wakes=0,sleeps=0;
  const actors=g=>g.entityIds.map(id=>state.entitiesById[id]);
  function index(g){if(!g.cleared)dormant.insert(g.groupId,g.spaceInstanceId,actors(g).filter(a=>a.alive).map(a=>a.position));}
  for(const g of Object.values(state.groupsById)){if(!g.cleared&&g.lastRequiredTick!==null&&state.tick-g.lastRequiredTick<config.sleepTicks)active.set(g.groupId,g.lastRequiredTick);else index(g);}
  function schedule() {
    const players=Object.values(state.playersById).map(p=>state.entitiesById[p.entityId]).filter(a=>a.alive);
    const near=(g,r)=>players.some(p=>p.residency.spaceInstanceId===g.spaceInstanceId&&actors(g).some(a=>a.alive&&Math.hypot(a.position.x-p.position.x,a.position.y-p.position.y)<=r));
    const interiorSpace=g=>Boolean(state.campaign.sitesById&&Object.values(state.campaign.sitesById).some(r=>r.spaceInstanceId===g.spaceInstanceId)||Object.values(state.d9World?.functionalSitesById??{}).some(site=>functionalSiteSpaceIdsD12(site).includes(g.spaceInstanceId)));
    // Only active records are revisited. Dormant records enter via spatial queries, never polling.
    for(const [id,lastNear] of active){const g=state.groupsById[id];if(g.cleared){active.delete(id);continue;}
      // Authored interiors have no remote simulation tail. The final resident
      // leaving parks the exact live encounter immediately; re-entry wakes the
      // same actors from their preserved HP/position/cadence/effect state.
      if(interiorSpace(g)&&!players.some(p=>p.residency.spaceInstanceId===g.spaceInstanceId)){active.delete(id);index(g);sleeps++;continue;}
      if(near(g,config.leaveRadius)){g.lastRequiredTick=state.tick;active.set(id,state.tick);}
      else if(state.tick-lastNear>=config.sleepTicks&&beforeSleep(g,config.leaveRadius)){active.delete(id);index(g);sleeps++;}}
    let live=players.length+[...active.keys()].reduce((n,id)=>n+actors(state.groupsById[id]).filter(a=>a.alive).length,0);
    const candidates=new Set();for(const p of players)for(const id of dormant.query(p.residency.spaceInstanceId,p.position,config.prepareRadius))candidates.add(id);
    deferred=0;
    for(const id of [...candidates].sort()){const g=state.groupsById[id];if(!near(g,config.prepareRadius))continue;
      const count=actors(g).filter(a=>a.alive).length;if(live+count>config.hardActors){deferred++;continue;}
      onWake(g,config.prepareRadius);dormant.remove(id);g.lastRequiredTick=state.tick;active.set(id,state.tick);live+=count;wakes++;}
    const sorted=players.slice().sort((a,b)=>a.entityId.localeCompare(b.entityId)),parent=sorted.map((_,i)=>i),find=i=>parent[i]===i?i:(parent[i]=find(parent[i]));
    const relevantPairs=new Set();
    for(let i=0;i<sorted.length;i++)for(let j=i+1;j<sorted.length;j++){
      const a=sorted[i],b=sorted[j],key=`${a.entityId}/${b.entityId}`;relevantPairs.add(key);
      if(a.residency.spaceInstanceId!==b.residency.spaceInstanceId){separatedSince.delete(key);continue;}
      const close=Math.hypot(a.position.x-b.position.x,a.position.y-b.position.y)<=config.mergeDistance;
      const previouslyTogether=clusters.some(c=>c.playerEntityIds.includes(a.entityId)&&c.playerEntityIds.includes(b.entityId));
      if(close)separatedSince.delete(key);else if(previouslyTogether&&!separatedSince.has(key))separatedSince.set(key,state.tick);
      if(close||(previouslyTogether&&state.tick-(separatedSince.get(key)??state.tick)<config.splitTicks))parent[find(j)]=find(i);
    }
    for(const key of separatedSince.keys())if(!relevantPairs.has(key))separatedSince.delete(key);
    const components=new Map();sorted.forEach((p,i)=>{const root=find(i);if(!components.has(root))components.set(root,{spaceInstanceId:p.residency.spaceInstanceId,playerEntityIds:[]});components.get(root).playerEntityIds.push(p.entityId);});
    clusters=[...components.values()];
    const activeIds=new Set(players.map(a=>a.entityId));for(const id of active.keys())for(const a of actors(state.groupsById[id]))if(a.alive)activeIds.add(a.entityId);
    return [...activeIds].sort();
  }
  const registered=new Set(Object.keys(state.groupsById));
  return {schedule,config,refreshGroups(){for(const id of registered){dormant.remove(id);if(!state.groupsById[id])active.delete(id);}registered.clear();for(const g of Object.values(state.groupsById)){registered.add(g.groupId);if(!active.has(g.groupId))index(g);}},renewGroup(g){active.delete(g.groupId);dormant.remove(g.groupId);index(g);},inspect:()=>({clusters:clusters.map(c=>({...c,playerEntityIds:[...c.playerEntityIds]})),activeGroups:[...active.keys()].sort(),
    dormantGroups:dormant.stats().records,spatialCells:dormant.stats().cells,pairRecords:separatedSince.size,deferredGroups:deferred,wakes,sleeps})};
}
