import {WILDERNESS_VERSION,WILDERNESS_HASH} from '../shared/content/wilderness_v2.js';
import {WORLD_COMBAT_VERSION,WORLD_COMBAT_HASH} from '../shared/content/world_combat_v1.js';
import {SERVICES_V2,SERVICES_V2_HASH} from '../shared/content/settlement_services_v2.js';

import {SETTLEMENT_LIFE_VERSION,SETTLEMENT_LIFE_HASH} from '../shared/content/settlement_life_v1.js';

import {FERRY_VERSION,FERRY_HASH,FERRY_NETWORK} from '../shared/content/ferry_plan_v1.js';

import {MULTIROOM_VERSION,MULTIROOM_HASH} from '../shared/content/multiroom_policy_v1.js';

import {ALPHA_POPULATION_VERSION,ALPHA_POPULATION_HASH,newPopulationSelection} from '../shared/content/alpha_site_population_v1.js';

import {PLANNED_CRYPT_V2} from '../shared/content/planned_crypt_policy_v2.js';

import {PLANNED_CRYPT_VERSION} from '../shared/content/planned_crypt_policy_v1.js';

import {PLANNED_RUIN_V2} from '../shared/content/planned_ruin_policy_v2.js';

import {naturalClusterReviewTargets} from './natural_cluster_review_v1.js';

import {PLANNED_RUIN_VERSION} from '../shared/content/planned_ruin_policy_v1.js';

import {PLANNED_FORT_V2} from '../shared/content/planned_fort_policy_v2.js';

import {PLANNED_FORT_VERSION} from '../shared/content/planned_fort_policy_v1.js';

import {PLANNED_CAVE_POPULATION_VERSION} from '../shared/content/planned_cave_population_v2.js';

import {createPlannedWorldAssetStore} from '../storage/planned_world_assets_v1.js';

import {createPlannedTerrain,BIOME_PRESENTATION_COVERAGE} from '../shared/generation/planned_world_foundation_v1.js';

export async function loadPlannedReviewV1(environment,assetId,sha256){

 const shore=environment.document.body.dataset.shorelineReview==='true';

 const get=async file=>{const response=await environment.fetch(new URL('../../'+file,import.meta.url));if(!response.ok)throw new Error('Missing planned review asset '+file);return response.text();},registry=JSON.parse(await get((environment.document.body.dataset.waterReview==='true'?'assets/planned-world-water-v3':shore?'assets/planned-world-shore-v2':'assets/planned-world-v1')+'/registry.json'));

 if(environment.document.body.dataset.fortFixture==='deep')registry['fort-deep-fixture']={binding:JSON.parse(await get('assets/planned-world-water-v3/fort-deep-fixture-binding.json'))};

 if(environment.document.body.dataset.ruinFixture==='deep')registry['ruin-deep-fixture']={binding:JSON.parse(await get('assets/planned-world-water-v3/ruin-deep-fixture-binding.json'))};

 if(environment.document.body.dataset.cryptFixture==='large')registry['crypt-large-fixture']={binding:JSON.parse(await get('assets/planned-world-water-v3/crypt-large-fixture-binding.json'))};

 if(!registry[assetId])throw new Error('Unknown planned review seed');const rawBinding=environment.document.body.dataset.townReview==='true'?{...registry[assetId].binding,townPrototype:'planned-town-start-art-candidate-v2',...(environment.document.body.dataset.sitePopulation==='true'?{sitePopulation:ALPHA_POPULATION_VERSION,sitePopulationHash:ALPHA_POPULATION_HASH,...(environment.document.body.dataset.multiroom==='true'?{interiorGeneration:MULTIROOM_VERSION,interiorGenerationHash:MULTIROOM_HASH,...(environment.document.body.dataset.ferryReview==='true'?{ferryVersion:FERRY_VERSION,ferryHash:FERRY_HASH,...(environment.document.body.dataset.settlementLife==='true'?{settlementLifeVersion:SETTLEMENT_LIFE_VERSION,settlementLifeHash:SETTLEMENT_LIFE_HASH,...(environment.document.body.dataset.settlementServices==='v2'?{settlementServicesVersion:SERVICES_V2,settlementServicesHash:SERVICES_V2_HASH,...(environment.document.body.dataset.worldCombat==='v1'?{combatVersion:WORLD_COMBAT_VERSION,combatHash:WORLD_COMBAT_HASH}:{})}:{})}:{})}:{})}:{})}:{}),...(environment.document.body.dataset.caveReview==='true'?{cavePrototype:environment.document.body.dataset.cavePopulation==='true'?PLANNED_CAVE_POPULATION_VERSION:'planned-cave-integration-candidate-v1',...(environment.document.body.dataset.fortReview==='true'?{fortPrototype:environment.document.body.dataset.fortVersion==='v2'?PLANNED_FORT_V2:PLANNED_FORT_VERSION,...(environment.document.body.dataset.ruinReview==='true'?{ruinPrototype:environment.document.body.dataset.ruinVersion==='v2'?PLANNED_RUIN_V2:PLANNED_RUIN_VERSION,...(environment.document.body.dataset.cryptReview==='true'?{cryptPrototype:environment.document.body.dataset.cryptVersion==='v2'?PLANNED_CRYPT_V2:PLANNED_CRYPT_VERSION}:{})}:{})}:{})}:{})}:registry[assetId].binding,binding=environment.document.body.dataset.wildernessV2==='true'?{...rawBinding,wildernessVersion:WILDERNESS_VERSION,wildernessHash:WILDERNESS_HASH}:rawBinding,{asset,generator,caveReservation,caveReservations,fortReservations,ruinReservations,cryptReservations}=await createPlannedWorldAssetStore({readText:get,sha256}).load(binding),terrain=createPlannedTerrain(asset),targets=[];if(binding.settlementLifeVersion)targets.push({id:'life:village',label:'Band 2 village · PLAYABLE services (inspection)',tile:{x:4503,y:7616}},{id:'life:town-merchant',label:'Town merchant · PLAYABLE services (inspection)',tile:{x:5911,y:5750}},{id:'life:town-smith',label:'Town smith · PLAYABLE services (inspection)',tile:{x:5870,y:5777}});

 for(const d of asset.routes.destinations)if(d.point)targets.push({id:d.id,label:(d.kind==='main'?'Road':'Approach')+' · '+d.id+' · RESERVED',tile:d.point});

 for(const e of asset.routes.edges.filter(e=>e.kind!=='local').slice(0,12))targets.push({id:e.id,label:e.kind.toUpperCase()+' route midpoint',tile:e.path[Math.floor(e.path.length/2)]});

 for(const kind of ['main','secondary','trail']){let choice=null;for(const edge of asset.routes.edges.filter(e=>e.kind===kind)){for(let i=0;i+6<edge.path.length;i++){const start=edge.path[i],end=edge.path[i+6],axis=start.x===end.x?'y':start.y===end.y?'x':null;if(axis&&edge.path.slice(i,i+7).every(q=>axis==='x'?q.y===start.y:q.x===start.x)&&Math.abs(end[axis]-start[axis])>=12&&(Math.floor(start.x/32)!==Math.floor(end.x/32)||Math.floor(start.y/26)!==Math.floor(end.y/26))){choice={start,end,axis};break;}}if(choice)break;}if(choice)targets.push({id:'walk:'+kind,label:'Walk check · '+kind+' · provisional',tile:choice.start,walking:choice});}

 const degree=new Map();for(const edge of asset.routes.edges.filter(e=>e.kind!=='local'))for(const id of [edge.from,edge.to])degree.set(id,(degree.get(id)??0)+1);const junction=asset.routes.destinations.find(d=>d.point&&degree.get(d.id)>=3);if(junction)targets.push({id:'junction',label:'Route junction · candidate hierarchy',tile:junction.point});

 for(const [i,b] of asset.routes.bridges.entries())if(i<12){targets.push({id:b.id,label:'Bridge · '+b.orientation+' · '+b.widthTiles+' tiles',tile:b.start});targets.push({id:b.id+':center',label:'Bridge center · collision check',tile:{x:Math.round((b.start.x+b.end.x)/2),y:Math.round((b.start.y+b.end.y)/2)}});}

 const examples=asset.reviewWaterExamples??(new URL(environment.location.href).searchParams.get('waterCompare')==='1'?JSON.parse(await get('assets/planned-world-water-v3/'+assetId+'.json')).reviewWaterExamples:[])??[];for(const e of examples)targets.push({id:e.id,label:e.label,tile:e.tile,walking:e.walking,walkingPath:e.walkingPath});

 const journeys=asset.reviewJourneys??(new URL(environment.location.href).searchParams.get('compare')==='1'?(JSON.parse(await get('assets/planned-world-shore-v2/alpha.json')).reviewJourneys??[]).map(j=>({...j,path:j.beforePath})):[]);

 for(const j of journeys)targets.push({id:j.id,label:j.label,tile:j.path[0],walkingPath:j.path});

 for(const [i,r] of fortReservations.entries()){const p=r.parcel,s=r.socket.entrance,x=(Number(s.chunkX)-1024)*32+s.localX/32-.5,y=(Number(s.chunkY)-1024)*26+s.localY/32-.5,road=asset.routes.destinations.find(d=>d.id===r.socket.provenance.reservationId).point;targets.push({id:newPopulationSelection(r.socket.provenance.reservationId)?r.socket.provenance.reservationId+':entrance':'fort:'+i+':entrance',label:p.label+' · '+p.tier+' · PLAYABLE',tile:{x,y}},{id:newPopulationSelection(r.socket.provenance.reservationId)?r.socket.provenance.reservationId+':approach':'fort:'+i+':approach',label:p.label+' · existing approach',tile:road});}

 for(const [i,r] of ruinReservations.entries()){const p=r.parcel,s=r.socket.entrance,road=asset.routes.destinations.find(d=>d.id===r.socket.provenance.reservationId).point;targets.unshift({id:newPopulationSelection(r.socket.provenance.reservationId)?r.socket.provenance.reservationId+':approach':'ruin:'+i+':approach',label:p.label+' · '+p.tier+' · Band '+r.socket.provenance.band+' · existing approach (inspection)',tile:road},{id:newPopulationSelection(r.socket.provenance.reservationId)?r.socket.provenance.reservationId+':entrance':'ruin:'+i+':entrance',label:p.label+' · PLAYABLE entrance (inspection)',tile:{x:(Number(s.chunkX)-1024)*32+s.localX/32-.5,y:(Number(s.chunkY)-1024)*26+s.localY/32-.5}});}

 const seen=new Set();for(const row of asset.cellRows)for(const c of row.cells){const x=c[0]*64+15,y=row.y*52+13,b=terrain.base(x,y);if(b.walkable&&!seen.has(b.biome)){seen.add(b.biome);targets.push({id:'biome:'+b.biome,label:'Terrain · '+b.biomeId+' · Band '+b.band,tile:{x,y}});}if(terrain.base(x,y).walkable&&terrain.base(x+64,y).kind==='ocean'&&!targets.some(t=>t.id==='coast'))targets.push({id:'coast',label:'Coast · land/ocean collision boundary',tile:{x:c[0]*64+59,y}});}

 for(const s of asset.factions){const c=s.arrival[0];targets.push({id:s.id+':arrival',label:'Faction arrival · '+s.id+' · UNREALIZED',tile:{x:c.x*32+15,y:c.y*26+13}});}

 for(const row of asset.cellRows){const c=row.cells.find(c=>c[5]>0&&!c[4]);if(c){targets.push({id:'river-boundary',label:'River · impassable channel edge',tile:{x:c[0]*64+24,y:row.y*52+26}});break;}}

 if(environment.document.body.dataset.artPilot==='true'&&assetId==='alpha'){const journey=JSON.parse(await get('assets/hybrid-art-pilot-v1/journey.json'));if(journey.geometryBinding.assetHash!==binding.assetHash)throw Error('Art journey geometry mismatch');targets.unshift(...journey.stops,journey.supplement);}

 if(binding.townPrototype)targets.unshift({id:'art:woodland-wide',label:'V2 coverage - woodland beyond old corridor',tile:{x:3872,y:338}},{id:'art:woodland-wide-2',label:'V2 coverage - second woodland beyond old corridor',tile:{x:3936,y:338}},{id:'town:start',label:'Town campaign arrival (inspection only)',tile:{x:5871,y:5760}},{id:'town:countryside',label:'Populated open town - countryside approach',tile:{x:5807,y:5733}},{id:'town:entrance',label:'Populated open town - street entrance',tile:{x:5826,y:5764}},{id:'town:tavern',label:'Populated town - Tavern frontage',tile:{x:5874,y:5740}});

 for(const r of [...caveReservations].reverse()){const e=r.socket.entrance,p=r.socket.provenance,d=asset.routes.destinations.find(d=>d.id===p.reservationId),prefix=newPopulationSelection(p.reservationId)?p.reservationId:p.sizeTier==='standard'?'cave':'cave:'+p.sizeTier;targets.unshift({id:prefix+':approach',label:'Playable '+r.parcel.label+' / '+p.sizeTier+' / Band '+p.band+' - approach (inspection)',tile:d.point},{id:prefix+':entrance',label:'Playable '+r.parcel.label+' / '+p.sizeTier+' / Band '+p.band+' - mouth (inspection)',tile:{x:(Number(e.chunkX)-1024)*32+e.localX/32-.5,y:(Number(e.chunkY)-1024)*26+e.localY/32-.5}});}

 for(const r of cryptReservations){const road=asset.routes.destinations.find(d=>d.id===r.socket.provenance.reservationId).point,s=r.socket.entrance;const tier=r.parcel.tier,prefix=newPopulationSelection(r.socket.provenance.reservationId)?r.socket.provenance.reservationId:tier==='small'?'crypt':'crypt:'+tier,label=tier[0].toUpperCase()+tier.slice(1)+' '+r.parcel.label;targets.unshift({id:prefix+':approach',label:label+' / Band '+r.socket.provenance.band+' / existing approach',tile:road},{id:prefix+':entrance',label:label+' / PLAYABLE entrance',tile:{x:(Number(s.chunkX)-1024)*32+s.localX/32-.5,y:(Number(s.chunkY)-1024)*26+s.localY/32-.5}});}

 if(binding.ferryVersion)for(const l of FERRY_NETWORK.landings)targets.push({id:l.id,label:'FERRY '+l.name+' / '+l.biomeId+' / Band '+l.band,tile:l.tile});

 targets.unshift(...naturalClusterReviewTargets(asset,generator));

 return Object.freeze({asset,binding,caveReservation,caveReservations,fortReservations,ruinReservations,cryptReservations,targets,coverage:BIOME_PRESENTATION_COVERAGE});

}

export function mountPlannedReviewControlsV1({environment,controls,review,session}){

 const travel=async id=>{if(environment.document.body.dataset.waterReview==='true'){const saved=await session.save();if(saved.status!=='committed')throw new Error('Review travel requires a confirmed development checkpoint');}return session.plannedTravel(id);};

 const doc=environment.document,section=doc.createElement('details');section.id='planned-world-review';const title=doc.createElement('summary');title.textContent=(doc.body.dataset.cumulativeReview==='true'?'Cumulative world preview · ':'Planned world review · ')+review.asset.assetId;section.append(title);

 if(review.binding.settlementServicesVersion)review.targets.push({id:'life:town-enchanter',label:'Selene · Enchanter (inspection)',tile:{x:5909,y:5754}});const note=doc.createElement('p');note.textContent=review.binding.sitePopulation?(review.binding.wildernessVersion?'Wilderness V2: 108 playable sites (40 caves, 18 forts, 34 ruins, 16 crypts) including 73 scattered wilderness additions. Trails and event clearing capacities reserved. Original Alpha geography and baseline sites preserved. ':'Alpha population: 35 playable sites - 12 caves, 7 forts, 9 ruins, 7 crypts. All tiers now have real Alpha destinations. Original 48 reservations remain; three explicit additions bring the roster to 51. Signature families remain reserved and UNBUILT. Town and furnished tavern, refined water, Hybrid V2, provisional routes and six future islands are preserved. Named coastal ferries connect all seven populated islands. Walk to a landing and press E/touch; no inspection travel is required.  Large Cave rewards are provisional; Deep Cave finale remains UNBOUND. Optional fixtures remain separate campaigns.'):(review.asset.reviewFixture?'ISOLATED '+(review.asset.assetId==='crypt-large-fixture'?'LARGE CRYPT':review.asset.assetId==='ruin-deep-fixture'?'DEEP RUIN':'DEEP FORT')+' FIXTURE. Separate disposable campaign; NOT a populated Alpha destination. ':'')+(review.binding.cryptPrototype?'Crypt family: Alpha Small (1), Standard (2) and Deep (4) floors; Large (3) is an optional isolated fixture. '+ '': '')+(review.binding.ruinPrototype?(review.binding.ruinPrototype===PLANNED_RUIN_V2?(review.asset.reviewFixture?'Deep Ruin: four floors. ':'Three Alpha ruins: Small, Standard and Large (three floors). Deep is a separate optional fixture. '):'Small and Standard ruins playable. ')+'Ordinary personal floor chests; existing temporary encounters. ':'')+(review.binding.fortPrototype?'Fort family review. Existing upper commander/underground elites are temporary encounters. Ocean-separated forts need inspection travel. ':'')+(review.binding.cavePrototype?(review.caveReservations.length>1?'Four procedural caves playable; native cave art/rosters reused. Large rewards provisional; Deep finale UNBOUND. Island Deep has no walking connection to the mainland. ':'One Desert Standard Cave is playable via the existing trail. Native cave art/roster reused. '):'')+(review.binding.townPrototype?'One populated open town and furnished two-floor tavern; remaining reservations are UNBUILT. ':'')+'Provisional travel-network candidate · actual campaign · 20 settlements / 48 sites / 6 future islands / 3 campuses reserved. Other settlement buildings and destination interiors remain UNBUILT. Timber bridges cross suitable local channels. Ocean travel is not implemented.';if(review.binding.settlementLifeVersion)note.textContent+=' Settlement Life V1: the open town and Band 2 mainland village now have named merchants, smiths and innkeepers. The other 18 settlement reservations remain unbuilt.';if(review.binding.settlementServicesVersion)note.textContent+=' Services V2: Mara Bazaar, Bren Forge & Smeltery, Selene Enchantment Altar and Ada tavern rest. Specialists use your personal equipment, gold and materials.';section.append(note);

 const select=doc.createElement('select');select.id='planned-review-target';for(const t of review.targets){const option=doc.createElement('option');option.value=t.id;option.textContent=t.label;select.append(option);}section.append(select);

 const mapControl=doc.createElement('label'),mapCheck=doc.createElement('input');mapCheck.type='checkbox';mapCheck.id='planned-review-map-markers';mapControl.append(mapCheck,doc.createTextNode(' Show UNBUILT review reservations on map'));section.append(mapControl);

 const visit=doc.createElement('button'),status=doc.createElement('p');visit.id='planned-review-visit';visit.textContent='Review travel';visit.onclick=async()=>{visit.disabled=true;try{await travel(select.value);status.textContent='Arrived. Use ordinary movement to inspect the route.';}catch(error){status.textContent=error.message;}finally{visit.disabled=false;}};section.append(visit,status);

 if(review.binding.townPrototype){const label=doc.createElement('label'),box=doc.createElement('input');box.type='checkbox';box.id='town-reservation-overlay';label.append(box,doc.createTextNode(' Town reservation / collision overlay'));section.append(label);Object.defineProperty(environment,'__SAQ_TOWN_REVIEW__',{configurable:true,value:Object.freeze({overlay:()=>box.checked})});}

 const links=doc.createElement('p');for(const id of (review.binding.fortPrototype||review.binding.ruinPrototype?[review.asset.assetId]:review.binding.townPrototype?['alpha']:['alpha','bravo','charlie','scan-008'])){const a=doc.createElement('a'),url=new URL(environment.location.href);url.searchParams.set('plan',id);url.searchParams.set('activityNew','1');a.href=url.href;a.textContent=id+' ';links.append(a);}

 if(doc.body.dataset.cumulativeReview==='true'||review.asset.reviewFixture){for(const [href,label] of [['./world-cumulative-dev.html?plan=alpha','Cumulative Alpha world'],['./world-fort-deep-v2-dev.html?plan=fort-deep-fixture','Optional isolated Deep Fort test'],['./world-ruin-deep-v2-dev.html?plan=ruin-deep-fixture','Optional isolated Deep Ruin test'],['./world-crypt-large-v2-dev.html?plan=crypt-large-fixture','Optional isolated Large Crypt test'],['./review/current/comparison-index.html','Feature inventory and visiting guide']]){const a=doc.createElement('a');a.href=href;a.textContent=label;links.append(doc.createTextNode(' · '),a);}}

 section.append(links);controls.append(section);

 // Read-only diagnostics and developer travel, never mutable authority objects.

 Object.defineProperty(environment,'__SAQ_PLANNED_REVIEW__',{configurable:true,value:Object.freeze({mapReservations:()=>mapCheck.checked?[...review.asset.settlements.filter(s=>!review.binding.townPrototype||s.id!=='settlement-slot:town:05'&&(!review.binding.settlementLifeVersion||s.id!=='settlement-slot:village-outpost:02')).map(s=>({id:s.id,tile:{x:s.anchor.x*64+32,y:s.anchor.y*52+26}})),...review.asset.sites.filter(s=>(!review.binding.fortPrototype||!review.fortReservations.some(r=>r.socket.provenance.reservationId===s.id))&&(!review.binding.cavePrototype||!review.caveReservations.some(r=>r.socket.provenance.reservationId===s.id))&&(!review.binding.ruinPrototype||!review.ruinReservations.some(r=>r.socket.provenance.reservationId===s.id))&&(!review.binding.cryptPrototype||!review.cryptReservations.some(r=>r.socket.provenance.reservationId===s.id))).map(s=>({id:s.id,tile:{x:s.anchor.x*64+32,y:s.anchor.y*52+26}}))]:[],binding:review.binding,targets:review.targets,travel:id=>travel(id),save:()=>session.save(),read:(options)=>session.clientPort.getReadModel(options),resources:()=>session.resources(),coverage:review.coverage})});

}

