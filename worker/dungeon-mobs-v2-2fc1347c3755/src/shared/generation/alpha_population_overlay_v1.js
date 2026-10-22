import {ALPHA_POPULATION_VERSION,ALPHA_POPULATION_HASH,ALPHA_POPULATION_BASE_HASH,ALPHA_POPULATION_PLAN_HASH,ALPHA_POPULATION_ROUTE_HASH,ALPHA_POPULATION_SELECTIONS,hasAlphaPopulation} from '../content/alpha_site_population_v1.js';
import {requireContract as check} from '../contracts/wire.js';
// Parent commits retain their original meanings. This explicitly committed delta
// adds roster/deployment and local approach connections; no geography is rebuilt.
export function applyAlphaPopulationOverlay(base,binding,delta){
 check(hasAlphaPopulation(binding)&&base.assetId==='alpha'&&binding.assetHash===ALPHA_POPULATION_BASE_HASH&&delta.version===ALPHA_POPULATION_VERSION&&delta.planHash===ALPHA_POPULATION_PLAN_HASH&&delta.routeHash===ALPHA_POPULATION_ROUTE_HASH&&delta.sourceCommitments.baseAssetHash===binding.assetHash&&delta.sourceCommitments.basePlanHash===binding.planHash&&delta.sourceCommitments.baseRouteHash===binding.routeHash&&delta.sourceCommitments.basePhysicalHash===binding.physicalHash,'Population overlay source drift');
 check(base.sites.length===48&&delta.addedReservations.length===3&&delta.effectiveReservationCount===51,'Population roster count drift');
 const a=JSON.parse(JSON.stringify(base));a.sites.push(...delta.addedReservations);a.routes.destinations.push(...delta.routeDestinations);a.routes.edges.push(...delta.routeEdges);
 const pages=new Map(a.routes.routePages.map(p=>[p.key,p.rows.map(r=>r.split(''))]));for(const p of delta.routePages){if(!pages.has(p.key))pages.set(p.key,Array.from({length:26},()=>Array(32).fill('0')));for(let y=0;y<26;y++)for(let x=0;x<32;x++)pages.get(p.key)[y][x]=String(Math.max(Number(pages.get(p.key)[y][x]),Number(p.rows[y][x])));}
 a.routes.routePages=[...pages].sort((a,b)=>a[0].localeCompare(b[0])).map(([key,rows])=>({key,rows:rows.map(r=>r.join(''))}));
 a.populationOverlay={version:ALPHA_POPULATION_VERSION,hash:ALPHA_POPULATION_HASH,planHash:delta.planHash,routeHash:delta.routeHash,parentAssetHash:binding.assetHash,parentPlanHash:binding.planHash,parentRouteHash:binding.routeHash};
 for(const r of ALPHA_POPULATION_SELECTIONS){const s=a.sites.find(s=>s.id===r.id);check(s&&JSON.stringify(s.footprint)===JSON.stringify(r.footprint)&&JSON.stringify(s.approach)===JSON.stringify(r.approach)&&s.familyId===r.familyId&&s.tier===r.tier&&s.landmassId===r.landmassId&&s.band===r.band,'Population assignment drift');}
 return a;
}
