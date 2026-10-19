import {D9_RUNTIME_POLICY as BASE} from './world_runtime_policy_d9.js';
import {hasAlphaPopulation} from './alpha_site_population_v1.js';
export const ALPHA_POPULATION_RETENTION=Object.freeze({version:'world-retained-site-policy-alpha-population-v1',parentVersion:BASE.version,retainedSiteActors:320,retainedSiteGroups:96,entityIndexKeys:512,worldActors:BASE.residentActors,worldGroups:BASE.residentGroups,worldChunks:BASE.residentChunks,simulationAndActiveWorkUnchanged:true});
// Retained interior data has its own bounded allowance. This does not enlarge
// the overworld work window, admission batch, active radius or authority clock.
export function retainedSiteCountsD9(state){
 const w=state.d9World;if(!hasAlphaPopulation(w?.plannedWorld)||w.runtimePolicy!==ALPHA_POPULATION_RETENTION.version)return {actors:0,groups:0,extended:false};
 const spaces=new Set(),groups=new Set();for(const s of Object.values(w.functionalSitesById))for(const f of s.floors??[]){spaces.add(f.spaceInstanceId);groups.add(f.groupId);}
 return {actors:Object.values(state.entitiesById).filter(a=>a.team==='hostile'&&spaces.has(a.residency.spaceInstanceId)).length,groups:Object.keys(state.groupsById).filter(id=>groups.has(id)).length,extended:true};
}
export function withinRetainedSiteBudgetsD9(state){const c=retainedSiteCountsD9(state);return c.actors<=ALPHA_POPULATION_RETENTION.retainedSiteActors&&c.groups<=ALPHA_POPULATION_RETENTION.retainedSiteGroups&&Object.keys(state.entitiesById).length-c.actors<=BASE.residentActors&&Object.keys(state.groupsById).length-c.groups<=BASE.residentGroups;}
