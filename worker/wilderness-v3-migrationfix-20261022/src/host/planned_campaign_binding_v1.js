import {hasWorldCombat,COMBAT_RUNTIME_VERSION} from '../shared/content/world_combat_v1.js';
import {upgradeOriginHordes} from '../shared/contracts/origin_hordes_v1.js';
import {adoptOrdinaryRosters} from '../shared/contracts/ordinary_roster_v1.js';
import {adoptOrdinaryRostersV2} from '../shared/contracts/ordinary_roster_v2.js';
import {worldOrdinaryMeleeProfile} from '../shared/content/world_melee_geometry.js';
import {installSettlementServices} from '../shared/contracts/settlement_services_v1.js';
import {PLANNED_TOWN_START_VERSION,TOWN_START_TILES} from '../shared/generation/planned_town_v1.js';
import {collidesWithTiles} from '../shared/rules/world_geometry.js';
import {installCampaignTavern} from '../shared/contracts/campaign_tavern_v1.js';
import {copyWire,requireContract as check} from '../shared/contracts/wire.js';
import {planLocalFramesD9,projectToLocalFrameD9} from '../shared/contracts/local_world_frames_d9.js';
import {rebaseWorldRuntimeD9,captureWorldPositionsD9} from '../shared/contracts/world_runtime_d9.js';
import {attachChunkRuntimeD9} from '../shared/contracts/world_paging_d9.js';
import {tileAddress,validatePlannedBinding} from '../shared/generation/planned_world_foundation_v1.js';
import {validateActivityState} from '../shared/contracts/activity_state.js?v=wilderness-v3-3-20261022';
import {hasAlphaPopulation} from '../shared/content/alpha_site_population_v1.js';
import {ALPHA_POPULATION_RETENTION} from '../shared/content/alpha_population_retention_v1.js';
// A one-time genesis binding in the normal campaign. This is never a save
// migration or a raw live-player relocation. The Worker prepares the complete
// geometry/address cut before publication, with the normal geometry validator.
export async function preparePlannedCampaignBindingV1(source,binding,{plannedAssets}){
 validatePlannedBinding(binding);check(source.tick===0&&!source.d9World.plannedWorld&&source.d9World.runtime.chunks.length===0&&!Object.keys(source.d9World.siteReservationsById).length,'Planned genesis requires a fresh campaign');
 const {asset,generator,caveReservations,fortReservations,ruinReservations,cryptReservations}=await plannedAssets.load(binding);check(asset.campaignSeedHex===source.campaign.seed.seedHex,'Planned genesis seed mismatch');
 const s=copyWire(source),spawn=tileAddress(...(binding.townPrototype===PLANNED_TOWN_START_VERSION?[TOWN_START_TILES[0].x,TOWN_START_TILES[0].y]:[asset.spawnTile.x,asset.spawnTile.y])),frames=copyWire(planLocalFramesD9(s.session.playerIds.map(playerId=>({playerId,position:spawn})),{keepOrigin:true}));frames[0].originBounds={width:s.d9World.origin.width/1024,height:s.d9World.origin.height/832};rebaseWorldRuntimeD9(s,frames);
 const q=projectToLocalFrameD9(spawn,frames);check(q,'Planned start outside computation atlas');
 // Install the initial movement window first, while players still occupy the
 // retained genesis area. All subsequent chunks use ordinary residency demand.
 for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++)attachChunkRuntimeD9(s,await generator.generate({seed:s.campaign.seed.seedHex,chunkX:String(BigInt(spawn.chunkX)+BigInt(x)),chunkY:String(BigInt(spawn.chunkY)+BigInt(y))}),null);
 s.d9World.plannedWorld=copyWire(binding);if(hasAlphaPopulation(binding))s.d9World.runtimePolicy=hasWorldCombat(binding)?COMBAT_RUNTIME_VERSION:ALPHA_POPULATION_RETENTION.version;s.d9World.plannedStart=copyWire(spawn);for(const r of [...caveReservations,...fortReservations,...ruinReservations,...cryptReservations])s.d9World.siteReservationsById[r.siteId]=copyWire(r);
 for(const [i,pid] of [...s.session.playerIds].sort().entries()){const actor=s.entitiesById[s.playersById[pid].entityId],tile=TOWN_START_TILES[i],arrival=binding.townPrototype===PLANNED_TOWN_START_VERSION?projectToLocalFrameD9(tileAddress(tile.x,tile.y),frames):['fort-deep-fixture','ruin-deep-fixture','crypt-large-fixture'].includes(binding.assetId)?projectToLocalFrameD9(tileAddress(asset.spawnTile.x+(i%2)*2,asset.spawnTile.y+Math.floor(i/2)*2),frames):q;check(arrival&&!collidesWithTiles(s.spacesByInstanceId[s.overworldInstanceId].collision,arrival.x,arrival.y,actor.hullRadius),'Town start must be hull-safe and prepared');actor.position={x:arrival.x,y:arrival.y};actor.movementIntent={x:0,y:0};}
 if(binding.townPrototype)await installCampaignTavern(s,plannedAssets.sha256??(async bytes=>{throw Error('Tavern identity hash unavailable');}));
 installSettlementServices(s);if(hasWorldCombat(s)){for(const p of Object.values(s.playersById))s.entitiesById[p.entityId].attackReach=32;for(const actor of Object.values(s.entitiesById)){if(actor.team!=='hostile')continue;const profile=worldOrdinaryMeleeProfile(s,s.content.definitionsById[actor.contentDefinitionId]);if(profile){actor.attackReach=profile.attackReach;actor.attackReachMode=profile.attackReachMode;}}}upgradeOriginHordes(s);adoptOrdinaryRosters(s,{groupIds:[]});adoptOrdinaryRostersV2(s,{groupIds:[]});captureWorldPositionsD9(s);validateActivityState(s);return s;
}
