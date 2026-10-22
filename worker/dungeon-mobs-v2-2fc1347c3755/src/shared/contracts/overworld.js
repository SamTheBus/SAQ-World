import { validateMajorPlaceNames } from './major_place_names.js';
import {runtimeManifestD9} from './world_runtime_d9.js';
import { validateSiteInteriors } from './site_interiors.js';
import { validateOrdinaryPopulation } from '../contracts/ordinary_population.js';
import { canonicalStringify, closedRecord, copyWire, freezeWire, requireContract, safeInteger, validateWire } from "./wire.js";
import { bytesToHex, hashBytes, utf8, validateHex } from "./hashing.js";
import { validateId } from "./identities.js";
import { validateGenerationIdentity } from "./rng.js";

const SIDES = ["north", "south", "west", "east"];
const sortedUnique = values => [...new Set(values)].sort();
export const CONQUEST_TIERS = Object.freeze(["C", "B", "A", "S"]);
// Independent of the original stable-ID/layout recipe; included in the body hash.
export const SEMANTIC_POLICY_VERSION = "connected-regions-tier-capacity-v1";
export const SEAM_POLICY_VERSION = "open-world-spans-v1";

function requireConnectedSubset(ids, adjacency, message) {
  const allowed=new Set(ids),visited=new Set(),pending=[ids[0]];
  while(pending.length){
    const id=pending.pop();if(visited.has(id))continue;visited.add(id);
    for(const next of adjacency.get(id))if(allowed.has(next)&&!visited.has(next))pending.push(next);
  }
  requireContract(visited.size===allowed.size,message);
}

function validateVisual(visual, width, height) {
  closedRecord(visual, ["terrain", "blockers", "atmosphere"]);
  requireContract(typeof visual.atmosphere === "string" && visual.atmosphere.length <= 64, "Invalid atmosphere identity");
  requireContract(Array.isArray(visual.terrain) && visual.terrain.length === height, "Terrain row count mismatch");
  visual.terrain.forEach(row => requireContract(typeof row === "string" && row.length === width && /^[fgpr]+$/.test(row), "Invalid terrain row"));
  requireContract(Array.isArray(visual.blockers) && visual.blockers.length <= 64, "Area blocker bound");
  for (const blocker of visual.blockers) {
    closedRecord(blocker, ["x", "y", "width", "height", "kind", "detail"]);
    for (const key of ["x", "y"]) safeInteger(blocker[key], 0);
    for (const key of ["width", "height"]) safeInteger(blocker[key], 1);
    requireContract(blocker.x + blocker.width <= width && blocker.y + blocker.height <= height, "Blocker outside area");
    requireContract(["building", "fence", "thicket", "trees", "rock"].includes(blocker.kind), "Unknown blocker kind");
    requireContract(typeof blocker.detail === "string" && blocker.detail.length <= 64, "Invalid blocker detail");
  }
}

export const technicalChunkId = chunk => chunk.chunkId ?? chunk.areaId;
const endpointChunkId = endpoint => endpoint.chunkId ?? endpoint.areaId;

export function overworldManifestBody(definition) {
  validateOverworldManifestDefinition(definition);
  const { contentDefinitionId: _definitionId, kind: _kind, manifestHash: _hash, ...body }=definition;
  return freezeWire(body);
}

export async function verifyOverworldManifestHash(definition,{sha256}={}) {
  const digest=bytesToHex(await hashBytes(utf8(canonicalStringify(overworldManifestBody(definition))),sha256));
  requireContract(digest===definition.manifestHash,"Overworld manifest hash mismatch");
  for(const interior of definition.siteInteriors??[]){const {contentHash,...body}=interior;
    requireContract(contentHash===bytesToHex(await hashBytes(utf8(canonicalStringify(body)),sha256)),'Site interior hash mismatch');}
  return true;
}

export function generationBindingForManifest(definition){
  validateOverworldManifestDefinition(definition);requireContract(definition.manifestVersion===2&&definition.sourceKind==="generated-campaign","Generated campaign manifest required");
  return freezeWire({identity:copyWire(definition.generation),manifestId:definition.manifestId,manifestSha256:definition.manifestHash,manifestBody:copyWire(definition)});
}

export function validateOverworldManifestDefinition(definition) {
  validateWire(definition);
  const generated = definition.manifestVersion === 2;
  closedRecord(definition, generated ? ["contentDefinitionId", "kind", "manifestHash", "format", "manifestVersion", "manifestId",
    "sourceKind", "semanticPolicyVersion", "seamPolicyVersion", "generation", "logicalSpaceId", "label", "tileSize", "dimensions", "chunks", "seams", "regions",
    "settlements", "corridors", "sites", "artifactAssignments", "start", "safeRegions", ...(definition.population?["population"]:[]), ...(definition.siteInteriors?["siteInteriors"]:[]), ...(definition.majorNamePolicyVersion!==undefined?["majorNamePolicyVersion"]:[])] :
    ["contentDefinitionId", "kind", "manifestHash", "format", "manifestVersion", "manifestId",
      "sourceKind", "logicalSpaceId", "label", "tileSize", "dimensions", "chunks", "seams", "roads", "safeRegions"]);
  validateId("contentDefinitionId", definition.contentDefinitionId); validateId("spaceId", definition.logicalSpaceId);
  requireContract(definition.kind === "overworldManifest" && definition.format === "saq-world-overworld-manifest" &&
    [1,2].includes(definition.manifestVersion), "Unsupported overworld manifest definition");
  validateHex(definition.manifestHash, 32);
  if(generated)requireContract((definition.generation.generatorVersion==='world-overworld-generator-d1-v1')===Boolean(definition.population),'Generated population version mismatch');
  if(definition.population)validateOrdinaryPopulation(definition);
  if(definition.siteInteriors){requireContract(Boolean(definition.population),'Site population dependency');validateSiteInteriors(definition);}
  requireContract(/^manifest:[a-z0-9._-]{1,96}$/.test(definition.manifestId) &&
    (generated ? definition.sourceKind === "generated-campaign" : definition.sourceKind === "deterministic-reference-fixture"),
  "Invalid manifest identity/source");
  if (generated) {
    validateMajorPlaceNames(definition);
    validateGenerationIdentity(definition.generation);
    requireContract(definition.semanticPolicyVersion===SEMANTIC_POLICY_VERSION,"Unsupported generated semantic policy; stored worlds are never regenerated");
    requireContract(definition.seamPolicyVersion===SEAM_POLICY_VERSION,"Unsupported generated seam policy; stored worlds are never regenerated");
  }
  requireContract(typeof definition.label === "string" && definition.label.length <= 96, "Invalid overworld label");
  requireContract(definition.tileSize === 32, "Overworld proof preserves 32px movement geometry");
  closedRecord(definition.dimensions, ["width", "height"]);
  for (const key of ["width", "height"]) requireContract(Number.isSafeInteger(definition.dimensions[key]) &&
    definition.dimensions[key] >= 32 && definition.dimensions[key] <= 4096 && definition.dimensions[key] % 32 === 0,
  "Invalid overworld dimensions");
  requireContract(Array.isArray(definition.chunks) && definition.chunks.length >= 1 && definition.chunks.length <= 32, "Manifest chunk bound");
  const chunks = new Map();
  for (const chunk of definition.chunks) {
    closedRecord(chunk, generated ? ["chunkId", "origin", "dimensions", "collisionDefinitionId", "terrainDefinitionId"] :
      ["areaId", "label", "discoveryId", "origin", "dimensions", "collisionDefinitionId", "terrainDefinitionId"]);
    const chunkId=technicalChunkId(chunk); validateId("spaceId", chunkId);
    if (!generated) { validateId("spaceId", chunk.discoveryId);
      requireContract(typeof chunk.label === "string" && chunk.label.length <= 96, "Invalid area label"); }
    requireContract(!chunks.has(chunkId), "Duplicate technical chunk"); chunks.set(chunkId, chunk);
    closedRecord(chunk.origin, ["x", "y"]); closedRecord(chunk.dimensions, ["width", "height"]);
    for (const key of ["x", "y"]) safeInteger(chunk.origin[key], 0, 4096);
    for (const key of ["width", "height"]) safeInteger(chunk.dimensions[key], 32, 4096);
    for (const key of ["collisionDefinitionId", "terrainDefinitionId"]) validateId("contentDefinitionId", chunk[key]);
    requireContract(chunk.origin.x % definition.tileSize === 0 && chunk.origin.y % definition.tileSize === 0 &&
      chunk.dimensions.width % definition.tileSize === 0 && chunk.dimensions.height % definition.tileSize === 0 &&
      chunk.origin.x + chunk.dimensions.width <= definition.dimensions.width &&
      chunk.origin.y + chunk.dimensions.height <= definition.dimensions.height, "Chunk definition/placement mismatch");
  }
  const placed=[...chunks.values()];
  for(let i=0;i<placed.length;i++)for(let j=i+1;j<placed.length;j++)requireContract(
    placed[i].origin.x+placed[i].dimensions.width<=placed[j].origin.x||placed[j].origin.x+placed[j].dimensions.width<=placed[i].origin.x||
    placed[i].origin.y+placed[i].dimensions.height<=placed[j].origin.y||placed[j].origin.y+placed[j].dimensions.height<=placed[i].origin.y,
  "Overlapping technical chunks");
  requireContract(Array.isArray(definition.seams) && definition.seams.length <= 64, "Manifest seam bound");
  const seamIds = new Set(), roadSegmentIds = new Set(), connected=new Map([...chunks.keys()].map(id=>[id,new Set()]));
  const broadConnected=new Map([...chunks.keys()].map(id=>[id,new Set()])),usedSides=new Set();
  for (const seam of definition.seams) {
    closedRecord(seam, generated ? ["seamId", "a", "b", "roadSegmentId", "seamForm", "openingStartTiles", "openingTiles"] :
      ["seamId", "a", "b", "roadSegmentId", "openingTiles"]);
    requireContract(/^seam:[a-z0-9._-]{1,96}$/.test(seam.seamId) && !seamIds.has(seam.seamId), "Invalid/duplicate seam"); seamIds.add(seam.seamId);
    for (const endpoint of [seam.a, seam.b]) {
      closedRecord(endpoint, generated ? ["chunkId", "side", "exitId"] : ["areaId", "side", "exitId"]);
      const chunkId=endpointChunkId(endpoint); validateId("spaceId", chunkId);
      requireContract(chunks.has(chunkId) && SIDES.includes(endpoint.side) && typeof endpoint.exitId === "string" && endpoint.exitId.length <= 64,
        "Invalid seam endpoint");
      const sideKey=chunkId+"/"+endpoint.side;
      requireContract(!usedSides.has(sideKey),"Duplicate seam on technical chunk side");usedSides.add(sideKey);
    }
    const aId=endpointChunkId(seam.a),bId=endpointChunkId(seam.b),opposites = { north: "south", south: "north", west: "east", east: "west" };
    requireContract(aId !== bId && opposites[seam.a.side] === seam.b.side, "Seam sides are not reciprocal");
    if(!generated)safeInteger(seam.openingTiles, 1, 7);
    requireContract(seam.roadSegmentId === null || /^road:[a-zA-Z0-9]+$/.test(seam.roadSegmentId), "Invalid seam road identity");
    if (seam.roadSegmentId !== null) {
      requireContract(!roadSegmentIds.has(seam.roadSegmentId), "Duplicate seam road identity");
      roadSegmentIds.add(seam.roadSegmentId);
    }
    const a = chunks.get(aId), b = chunks.get(bId);
    const adjacent = seam.a.side === "east" ? a.origin.x + a.dimensions.width === b.origin.x && a.origin.y === b.origin.y :
      seam.a.side === "west" ? b.origin.x + b.dimensions.width === a.origin.x && a.origin.y === b.origin.y :
      seam.a.side === "south" ? a.origin.y + a.dimensions.height === b.origin.y && a.origin.x === b.origin.x :
      b.origin.y + b.dimensions.height === a.origin.y && a.origin.x === b.origin.x;
    requireContract(adjacent, "Seam endpoints are not adjacent in world coordinates");
    if(generated){
      const horizontal=["north","south"].includes(seam.a.side),dimension=horizontal?"width":"height";
      // A single span on an aligned, equal shared edge is reciprocal by definition.
      // Leave one corner tile at each end so opening a seam cannot breach an outer edge.
      requireContract(a.dimensions[dimension]===b.dimensions[dimension],"Seam shared-edge lengths differ");
      const length=a.dimensions[dimension]/definition.tileSize;
      safeInteger(seam.openingStartTiles,1,length-2);safeInteger(seam.openingTiles,1,length-2);
      requireContract(seam.openingStartTiles+seam.openingTiles<=length-1,"Seam opening exceeds shared edge");
      requireContract(["OPEN","NATURAL","CORRIDOR"].includes(seam.seamForm),"Invalid seam form");
      if(seam.seamForm==="CORRIDOR")safeInteger(seam.openingTiles,3,Math.min(5,Math.floor(length/4)));
      else {
        requireContract(seam.openingTiles>=Math.ceil(length/2),"Broad seam must expose at least half the shared edge");
        if(seam.seamForm==="NATURAL")requireContract(2*seam.openingStartTiles+seam.openingTiles!==length,"Natural seam span must be offset");
        broadConnected.get(aId).add(bId);broadConnected.get(bId).add(aId);
      }
    }
    connected.get(aId).add(bId);connected.get(bId).add(aId);
  }
  const reached=new Set(),queue=[chunks.keys().next().value];while(queue.length){const id=queue.shift();if(reached.has(id))continue;reached.add(id);queue.push(...connected.get(id));}
  requireContract(reached.size===chunks.size,"Inaccessible placed technical chunk");
  const knownRoadSegments = new Set(definition.seams.map(seam => seam.roadSegmentId).filter(Boolean));
  if (!generated) {
    requireContract(Array.isArray(definition.roads) && definition.roads.length <= 16, "Manifest road bound");
    for (const road of definition.roads) { closedRecord(road, ["roadId", "label", "roadSegmentIds"]);
      requireContract(/^road:[a-zA-Z0-9]+$/.test(road.roadId) && typeof road.label === "string", "Invalid road identity");
      requireContract(Array.isArray(road.roadSegmentIds) && road.roadSegmentIds.every(id => knownRoadSegments.has(id)), "Road references unknown seam"); }
  } else {
    const regionIds=new Set(),settlementIds=new Set(),siteIds=new Set(),discoveryIds=new Set(),corridorIds=new Set();
    requireContract(Array.isArray(definition.regions)&&definition.regions.length>=1&&definition.regions.length<=16,"Generated region bound");
    for(const region of definition.regions){closedRecord(region,["regionId","label","landscapeKind","discoveryId","chunkIds",...(definition.population?["threatTier"]:[])]);
      requireContract(/^region:[0-9a-f]{32}$/.test(region.regionId)&&!regionIds.has(region.regionId),"Invalid/duplicate generated region");regionIds.add(region.regionId);
      requireContract(typeof region.label==="string"&&region.label.length<=64&&["forest","marsh","hills","coast"].includes(region.landscapeKind),"Invalid generated region semantics");
      requireContract(/^discovery:[0-9a-f]{32}$/.test(region.discoveryId)&&Array.isArray(region.chunkIds)&&region.chunkIds.length>=2&&
        region.chunkIds.every((id,n)=>chunks.has(id)&&(n===0||region.chunkIds[n-1]<id)),"Region must span sorted technical chunks");}
    for(const region of definition.regions){requireContract(!discoveryIds.has(region.discoveryId),"Duplicate semantic discovery identity");discoveryIds.add(region.discoveryId);}
    const regionChunks=definition.regions.flatMap(region=>region.chunkIds);
    requireContract(regionChunks.length===chunks.size&&new Set(regionChunks).size===chunks.size,"Each technical chunk needs exactly one region semantic");
    for(const region of definition.regions)requireConnectedSubset(region.chunkIds,connected,"Semantic region is disconnected through overworld seams");
    for(const region of definition.regions)requireConnectedSubset(region.chunkIds,broadConnected,"Semantic region needs broad internal seam connectivity");
    requireContract(Array.isArray(definition.settlements)&&definition.settlements.length===1,"Exactly one proof settlement required");
    for(const settlement of definition.settlements){closedRecord(settlement,["settlementId","label","localityKind","home","discoveryId","chunkIds"]);
      requireContract(/^settlement:[0-9a-f]{32}$/.test(settlement.settlementId)&&!settlementIds.has(settlement.settlementId),"Invalid/duplicate settlement");settlementIds.add(settlement.settlementId);
      requireContract(typeof settlement.label==="string"&&settlement.label.length<=64&&settlement.localityKind==="town"&&settlement.home===true,"Invalid home settlement");
      requireContract(/^discovery:[0-9a-f]{32}$/.test(settlement.discoveryId)&&Array.isArray(settlement.chunkIds)&&settlement.chunkIds.length>=2&&
        settlement.chunkIds.every((id,n)=>chunks.has(id)&&(n===0||settlement.chunkIds[n-1]<id)),"Settlement must span sorted technical chunks");}
    for(const settlement of definition.settlements){requireContract(!discoveryIds.has(settlement.discoveryId),"Duplicate semantic discovery identity");discoveryIds.add(settlement.discoveryId);}
    for(const settlement of definition.settlements){
      requireConnectedSubset(settlement.chunkIds,connected,"Home settlement is disconnected through overworld seams");
      requireConnectedSubset(settlement.chunkIds,broadConnected,"Home settlement needs broad internal seam connectivity");
      requireContract(definition.regions.some(region=>settlement.chunkIds.every(id=>region.chunkIds.includes(id))),
        "Home settlement must be contained within one semantic region");
    }
    const homeChunks=new Set(definition.settlements[0].chunkIds);
    requireContract(definition.seams.some(seam=>seam.roadSegmentId!==null&&homeChunks.has(endpointChunkId(seam.a))!==homeChunks.has(endpointChunkId(seam.b))),
      "Home settlement needs a road leading into its region");
    requireContract(Array.isArray(definition.corridors)&&definition.corridors.length>=1&&definition.corridors.length<=16,"Corridor bound");
    for(const corridor of definition.corridors){closedRecord(corridor,["corridorId","label","corridorKind","roadSegmentIds"]);
      requireContract(/^corridor:[0-9a-f]{32}$/.test(corridor.corridorId)&&!corridorIds.has(corridor.corridorId)&&typeof corridor.label==="string"&&["road","river","trail"].includes(corridor.corridorKind),"Invalid/duplicate corridor");corridorIds.add(corridor.corridorId);
      requireContract(Array.isArray(corridor.roadSegmentIds)&&corridor.roadSegmentIds.length>=1&&corridor.roadSegmentIds.every((id,n)=>knownRoadSegments.has(id)&&(n===0||corridor.roadSegmentIds[n-1]<id)),"Corridor must reference sorted unique known segments");}
    requireContract(Array.isArray(definition.sites)&&definition.sites.length>=3&&definition.sites.length<=32,"Generated site bound");
    for(const site of definition.sites){closedRecord(site,["locationId","locationDefinitionId","label","siteKind","chunkId","regionId","position","siteRole","hostilePosition","provenance",
      "siteTier","siteRewardCapacityTier","artifactEligible"],["properName"]);
      if(site.properName!==undefined)requireContract(Boolean(definition.siteInteriors)&&typeof site.properName==='string'&&site.properName.length>0&&site.properName.length<=64,'Invalid site proper name');
      validateId("locationId",site.locationId);validateId("contentDefinitionId",site.locationDefinitionId);validateId("spaceId",site.chunkId);
      requireContract(!siteIds.has(site.locationId)&&chunks.has(site.chunkId)&&regionIds.has(site.regionId),"Invalid/duplicate generated site identity");siteIds.add(site.locationId);
      requireContract(definition.regions.find(region=>region.regionId===site.regionId).chunkIds.includes(site.chunkId),"Generated site region/chunk mismatch");
      requireContract(typeof site.label==="string"&&site.label.length<=64&&["dungeon","ruin","shrine","cave"].includes(site.siteKind)&&["primary-proof","proof-site"].includes(site.siteRole),"Invalid site semantics");
      requireContract(CONQUEST_TIERS.includes(site.siteTier)&&CONQUEST_TIERS.includes(site.siteRewardCapacityTier)&&typeof site.artifactEligible==="boolean",
        "Invalid conquerable site tier/capacity/eligibility");
      requireContract(CONQUEST_TIERS.indexOf(site.siteRewardCapacityTier)<=CONQUEST_TIERS.indexOf(site.siteTier),
        "Proof reward capacity cannot exceed conquest tier");
      closedRecord(site.position,["x","y"]);const chunk=chunks.get(site.chunkId);safeInteger(site.position.x,chunk.origin.x,chunk.origin.x+chunk.dimensions.width-1);safeInteger(site.position.y,chunk.origin.y,chunk.origin.y+chunk.dimensions.height-1);
      if(site.hostilePosition!==null){requireContract(site.siteRole==="primary-proof","Only primary proof site may place hostile anchor");closedRecord(site.hostilePosition,["x","y"]);safeInteger(site.hostilePosition.x,chunk.origin.x,chunk.origin.x+chunk.dimensions.width-1);safeInteger(site.hostilePosition.y,chunk.origin.y,chunk.origin.y+chunk.dimensions.height-1);}
      closedRecord(site.provenance,["generatorVersion","recipeKey","sourceAnchorId"]);requireContract(site.provenance.generatorVersion===definition.generation.generatorVersion,"Site generation provenance mismatch");
    }
    requireContract(definition.sites.filter(site=>site.siteRole==="primary-proof"&&site.hostilePosition!==null).length===1,"Exactly one primary proof site required");
    requireContract(Array.isArray(definition.artifactAssignments)&&definition.artifactAssignments.length>=1&&definition.artifactAssignments.length<=16,"Artifact assignment bound");
    const assignments=new Set(),artifacts=new Set(),assignedSites=new Set();for(const assignment of definition.artifactAssignments){closedRecord(assignment,["assignmentId","artifactDefinitionId","generatedLocationId","artifactTier","provenance"]);
      validateId("legendAssignmentId",assignment.assignmentId);validateId("contentDefinitionId",assignment.artifactDefinitionId);validateId("locationId",assignment.generatedLocationId);
      requireContract(!assignments.has(assignment.assignmentId)&&!artifacts.has(assignment.artifactDefinitionId)&&siteIds.has(assignment.generatedLocationId),"Invalid/duplicate artifact assignment");assignments.add(assignment.assignmentId);artifacts.add(assignment.artifactDefinitionId);
      const site=definition.sites.find(value=>value.locationId===assignment.generatedLocationId);
      requireContract(CONQUEST_TIERS.includes(assignment.artifactTier),"Invalid artifact tier");
      requireContract(site.artifactEligible&&!assignedSites.has(site.locationId),"Artifact site is ineligible or already assigned");
      requireContract(CONQUEST_TIERS.indexOf(assignment.artifactTier)<=CONQUEST_TIERS.indexOf(site.siteRewardCapacityTier),
        "Artifact tier exceeds site reward capacity");
      assignedSites.add(site.locationId);
      closedRecord(assignment.provenance,["generatorVersion","streamDomain"]);requireContract(assignment.provenance.generatorVersion===definition.generation.generatorVersion,"Assignment generation provenance mismatch");}
    closedRecord(definition.start,["settlementId","chunkId","position"]);requireContract(settlementIds.has(definition.start.settlementId)&&chunks.has(definition.start.chunkId)&&definition.settlements[0].chunkIds.includes(definition.start.chunkId),"Invalid generated start binding");
    closedRecord(definition.start.position,["x","y"]);const startChunk=chunks.get(definition.start.chunkId);
    safeInteger(definition.start.position.x,startChunk.origin.x,startChunk.origin.x+startChunk.dimensions.width-1);
    safeInteger(definition.start.position.y,startChunk.origin.y,startChunk.origin.y+startChunk.dimensions.height-1);
  }
  requireContract(Array.isArray(definition.safeRegions) && definition.safeRegions.length <= 16, "Safe-region bound");
  const safeRegionIds=new Set();
  for (const region of definition.safeRegions) {
    closedRecord(region, generated ? ["safeRegionId", "settlementId", "x", "y", "width", "height", "marker"] :
      ["safeRegionId", "areaId", "x", "y", "width", "height", "marker"]);
    requireContract(/^safe:[a-z0-9._-]{1,96}$/.test(region.safeRegionId)&&!safeRegionIds.has(region.safeRegionId), "Invalid/duplicate safe-region identity");safeRegionIds.add(region.safeRegionId);
    if(generated){const settlement=definition.settlements.find(value=>value.settlementId===region.settlementId);requireContract(settlement,"Safe region references unknown settlement");
      requireContract(settlement.chunkIds.some(id=>{const chunk=chunks.get(id);return region.x>=chunk.origin.x&&region.y>=chunk.origin.y&&
        region.x+region.width<=chunk.origin.x+chunk.dimensions.width&&region.y+region.height<=chunk.origin.y+chunk.dimensions.height;}),"Safe region must be inside its settlement chunks");}
    else {validateId("spaceId", region.areaId);requireContract(chunks.has(region.areaId), "Safe region references unknown area");}
    for (const key of ["x", "y"]) safeInteger(region[key], 0, 4096);
    for (const key of ["width", "height"]) safeInteger(region[key], 1, 4096);
    requireContract(region.x + region.width <= definition.dimensions.width && region.y + region.height <= definition.dimensions.height,
      "Safe region outside overworld");
    closedRecord(region.marker, ["x", "y", "label"]);
    safeInteger(region.marker.x, region.x, region.x + region.width - 1); safeInteger(region.marker.y, region.y, region.y + region.height - 1);
    requireContract(typeof region.marker.label === "string" && region.marker.label.length <= 64, "Invalid safe-region marker");
  }
  if(generated)for(const settlement of definition.settlements)for(const id of settlement.chunkIds){
    const chunk=chunks.get(id);
    // Prototype policy: an exact safe rectangle per home chunk. No implicit
    // unsafe outskirts or gaps between rectangles are accepted.
    requireContract(definition.safeRegions.some(region=>region.settlementId===settlement.settlementId&&
      region.x===chunk.origin.x&&region.y===chunk.origin.y&&region.width===chunk.dimensions.width&&region.height===chunk.dimensions.height),
    "Home settlement chunk must have complete safe-town coverage");
  }
  if(generated)for(const site of definition.sites)requireContract(!definition.safeRegions.some(region=>site.position.x>=region.x&&site.position.y>=region.y&&site.position.x<region.x+region.width&&site.position.y<region.y+region.height),"Generated site inside town safe region");
  return definition;
}

function seamCenter(manifest, endpoint) {
  const chunk = manifest.chunks.find(candidate => technicalChunkId(candidate) === endpointChunkId(endpoint));
  const horizontal = endpoint.side === "north" || endpoint.side === "south";
  return horizontal ? chunk.origin.x / manifest.tileSize + Math.floor(chunk.dimensions.width / manifest.tileSize / 2) :
    chunk.origin.y / manifest.tileSize + Math.floor(chunk.dimensions.height / manifest.tileSize / 2);
}

function openingSpan(manifest,seam,endpoint){
  const chunk=manifest.chunks.find(value=>technicalChunkId(value)===endpointChunkId(endpoint));
  const horizontal=["north","south"].includes(endpoint.side);
  const origin=(horizontal?chunk.origin.x:chunk.origin.y)/manifest.tileSize;
  const center=seamCenter(manifest,endpoint);
  const start=manifest.manifestVersion===2?origin+seam.openingStartTiles:center-Math.floor(seam.openingTiles/2);
  // Preserve legacy fixture geometry (including its old odd-width interpretation).
  const count=manifest.manifestVersion===2?seam.openingTiles:2*Math.floor(seam.openingTiles/2)+1;
  return {start,count,roadCenter:Math.max(start+1,Math.min(start+count-2,center))};
}

export function compileOverworldManifest(definition, resolveAreaDefinition) {
  validateOverworldManifestDefinition(definition);
  requireContract(typeof resolveAreaDefinition === "function", "Explicit area-definition resolver required");
  const tile = definition.tileSize, width = definition.dimensions.width / tile, height = definition.dimensions.height / tile;
  const collision = Array.from({ length: height }, () => Array(width).fill("0"));
  const terrain = Array.from({ length: height }, () => Array(width).fill("f"));
  const blockers = [];
  const chunks = new Map(definition.chunks.map(chunk => [technicalChunkId(chunk), chunk]));
  for (const chunk of definition.chunks) {
    const source = resolveAreaDefinition(chunk.collisionDefinitionId), visualSource = resolveAreaDefinition(chunk.terrainDefinitionId);
    const ox = chunk.origin.x / tile, oy = chunk.origin.y / tile;
    closedRecord(source, ["collision", "visual"]); closedRecord(visualSource, ["collision", "visual"]);
    const sourceCollision = source.collision;
    requireContract(sourceCollision.tileSize === tile && sourceCollision.width * tile === chunk.dimensions.width &&
      sourceCollision.height * tile === chunk.dimensions.height, "Resolved area dimensions mismatch");
    validateVisual(source.visual, sourceCollision.width, sourceCollision.height);
    validateVisual(visualSource.visual, sourceCollision.width, sourceCollision.height);
    for (let y = 0; y < sourceCollision.height; y++) for (let x = 0; x < sourceCollision.width; x++) {
      collision[oy + y][ox + x] = sourceCollision.tiles[y][x];
      terrain[oy + y][ox + x] = visualSource.visual.terrain[y][x];
    }
    for (const blocker of visualSource.visual.blockers) {
      const boundary = blocker.x === 0 || blocker.y === 0 || blocker.x + blocker.width === source.collision.width ||
        blocker.y + blocker.height === source.collision.height;
      if (!boundary) blockers.push({ ...copyWire(blocker), x: ox + blocker.x, y: oy + blocker.y });
    }
  }
  for (const seam of definition.seams) {
    for (const endpoint of [seam.a, seam.b]) {
      const chunk = chunks.get(endpointChunkId(endpoint)), ox = chunk.origin.x / tile, oy = chunk.origin.y / tile;
      const {start,count,roadCenter}=openingSpan(definition,seam,endpoint);
      for (let offset = 0; offset < count; offset++) {
        const along=start+offset;
        const x=endpoint.side==="west"?ox:endpoint.side==="east"?ox+chunk.dimensions.width/tile-1:along;
        const y=endpoint.side==="north"?oy:endpoint.side==="south"?oy+chunk.dimensions.height/tile-1:along;
        collision[y][x]="1";
        if(definition.manifestVersion===1)terrain[y][x]=seam.roadSegmentId?"r":"p";
        else {
          // Continue local terrain across the exposed border, retaining a narrow
          // road stripe where present. A broad landscape seam is not a broad road.
          const ix=x+(endpoint.side==="west"?1:endpoint.side==="east"?-1:0);
          const iy=y+(endpoint.side==="north"?1:endpoint.side==="south"?-1:0);
          terrain[y][x]=seam.roadSegmentId&&Math.abs(along-roadCenter)<=1?"r":terrain[iy][ix];
        }
      }
    }
  }
  // Rebuild only authored border strips after openings are cut, merging runs so
  // solid collision never becomes an invisible full-length wall.
  for (const chunk of definition.chunks) {
    const ox = chunk.origin.x / tile, oy = chunk.origin.y / tile, w = chunk.dimensions.width / tile, h = chunk.dimensions.height / tile;
    const kind = definition.safeRegions.some(region => region.x < chunk.origin.x+chunk.dimensions.width && region.x+region.width > chunk.origin.x &&
      region.y < chunk.origin.y+chunk.dimensions.height && region.y+region.height > chunk.origin.y) ? "fence" : "thicket";
    for (const side of SIDES) {
      const length = side === "north" || side === "south" ? w : h; let start = null;
      const solid = index => { const x = side === "west" ? ox : side === "east" ? ox + w - 1 : ox + index;
        const y = side === "north" ? oy : side === "south" ? oy + h - 1 : oy + index; return collision[y][x] !== "1"; };
      for (let index = 0; index <= length; index++) {
        if (index < length && solid(index)) { if (start === null) start = index; continue; }
        if (start !== null) {
          blockers.push({ x: side === "west" ? ox : side === "east" ? ox + w - 1 : ox + start,
            y: side === "north" ? oy : side === "south" ? oy + h - 1 : oy + start,
            width: side === "north" || side === "south" ? index - start : 1,
            height: side === "west" || side === "east" ? index - start : 1, kind, detail: "" }); start = null;
        }
      }
    }
  }
  if(definition.manifestVersion===2)for(const site of definition.sites){const x=Math.floor(site.position.x/tile),y=Math.floor(site.position.y/tile);
    requireContract(collision[y]?.[x]==="1","Generated site occupies invalid collision");}
  const compiled = { spaceId: definition.logicalSpaceId, contentDefinitionId: definition.contentDefinitionId, label: definition.label,
    collision: { tileSize: tile, width, height, tiles: collision.map(row => row.join("")) },
    visual: { terrain: terrain.map(row => row.join("")), blockers, atmosphere: "seamless-overworld" }, exits: [],
    chunks: definition.chunks, seams: definition.seams, safeRegions: definition.safeRegions,
    ...(definition.manifestVersion===2?{regions:definition.regions,settlements:definition.settlements,corridors:definition.corridors,
      sites:definition.sites,artifactAssignments:definition.artifactAssignments,start:definition.start,generation:definition.generation}: {}) };
  return freezeWire(compiled);
}

export function originManifestForState(state) {
  const binding = state.campaign?.overworld;
  if (!binding) return null;
  const definition = state.content?.definitionsById?.[binding.manifestDefinitionId];
  requireContract(definition?.kind === "overworldManifest" && definition.manifestHash === binding.manifestHash,
    "Overworld manifest binding mismatch");
  return definition;
}
export const manifestForState=state=>runtimeManifestD9(state,originManifestForState(state));

export function areaAtWorldPosition(manifest, position) {
  return manifest.chunks.find(chunk => position.x >= chunk.origin.x && position.y >= chunk.origin.y &&
    position.x < chunk.origin.x + chunk.dimensions.width && position.y < chunk.origin.y + chunk.dimensions.height) ?? null;
}

export function semanticPlaceAtWorldPosition(manifest, position) {
  const chunk=areaAtWorldPosition(manifest,position);if(!chunk)return null;
  if(manifest.manifestVersion===1)return freezeWire({placeId:chunk.areaId,discoveryId:chunk.discoveryId,label:chunk.label,placeKind:"legacy-area"});
  const chunkId=technicalChunkId(chunk),settlement=manifest.settlements.find(value=>value.chunkIds.includes(chunkId));
  if(settlement)return freezeWire({placeId:settlement.settlementId,discoveryId:settlement.discoveryId,label:settlement.label,placeKind:"settlement"});
  const region=manifest.regions.find(value=>value.chunkIds.includes(chunkId));
  return region&&freezeWire({placeId:region.regionId,discoveryId:region.discoveryId,label:region.label,placeKind:"region"});
}

export function worldPointForArea(manifest, areaId, local) {
  const chunk = manifest.chunks.find(candidate => technicalChunkId(candidate) === areaId);
  requireContract(chunk && Number.isFinite(local.x) && Number.isFinite(local.y), "Unknown manifest area/local point");
  return freezeWire({ x: chunk.origin.x + local.x, y: chunk.origin.y + local.y });
}

export function initialOverworldCampaign(manifest, startingAreaId) {
  validateOverworldManifestDefinition(manifest);
  const chunk = manifest.chunks.find(candidate => technicalChunkId(candidate) === startingAreaId); requireContract(chunk, "Unknown starting area");
  return freezeWire({ manifestDefinitionId: manifest.contentDefinitionId, manifestId: manifest.manifestId,
    manifestHash: manifest.manifestHash, discovery: manifest.manifestVersion===1?
      { visitedAreaIds: [chunk.discoveryId], traversedRoadSegmentIds: [] }:
      { discoveredRegionIds: manifest.regions.filter(region=>region.chunkIds.includes(startingAreaId)).map(region=>region.discoveryId).sort(),
        discoveredSettlementIds: manifest.settlements.filter(value=>value.chunkIds.includes(startingAreaId)).map(value=>value.discoveryId).sort(),
        discoveredSiteIds: [], traversedCorridorSegmentIds: [] } });
}

export function validateOverworldCampaign(value, manifest) {
  closedRecord(value, ["manifestDefinitionId", "manifestId", "manifestHash", "discovery"]);
  validateId("contentDefinitionId", value.manifestDefinitionId); validateHex(value.manifestHash, 32);
  requireContract(value.manifestDefinitionId === manifest.contentDefinitionId && value.manifestId === manifest.manifestId &&
    value.manifestHash === manifest.manifestHash, "Campaign overworld identity mismatch");
  closedRecord(value.discovery, manifest.manifestVersion===1?["visitedAreaIds", "traversedRoadSegmentIds"]:
    ["discoveredRegionIds","discoveredSettlementIds","discoveredSiteIds","traversedCorridorSegmentIds"]);
  const inventories=manifest.manifestVersion===1?[[value.discovery.visitedAreaIds,manifest.chunks.map(chunk=>chunk.discoveryId)],
    [value.discovery.traversedRoadSegmentIds,manifest.seams.map(seam=>seam.roadSegmentId).filter(Boolean)]]:
    [[value.discovery.discoveredRegionIds,manifest.regions.map(region=>region.discoveryId)],
      [value.discovery.discoveredSettlementIds,manifest.settlements.map(entry=>entry.discoveryId)],
      [value.discovery.discoveredSiteIds,manifest.sites.map(site=>site.locationId)],
      [value.discovery.traversedCorridorSegmentIds,manifest.seams.map(seam=>seam.roadSegmentId).filter(Boolean)]];
  for (const [entries, known] of inventories) {
    requireContract(Array.isArray(entries) && canonicalStringify(entries) === canonicalStringify(sortedUnique(entries)) &&
      entries.every(id => known.includes(id)), "Invalid overworld discovery identities");
  }
  return value;
}

export function discoverOverworldActors(state) {
  const manifest = state.d9World?originManifestForState(state):manifestForState(state); if (!manifest) return null;
  const discovery = copyWire(state.campaign.overworld.discovery);
  if(manifest.manifestVersion===2){
    const regions=new Set(discovery.discoveredRegionIds),settlements=new Set(discovery.discoveredSettlementIds),sites=new Set(discovery.discoveredSiteIds);
    for(const player of Object.values(state.playersById)){const actor=state.space.entitiesById[player.entityId],chunk=actor&&areaAtWorldPosition(manifest,actor.position);
      if(!chunk)continue;const chunkId=technicalChunkId(chunk);
      for(const region of manifest.regions.filter(value=>value.chunkIds.includes(chunkId)))regions.add(region.discoveryId);
      for(const settlement of manifest.settlements.filter(value=>value.chunkIds.includes(chunkId)))settlements.add(settlement.discoveryId);
      for(const site of manifest.sites)if(Math.hypot(actor.position.x-site.position.x,actor.position.y-site.position.y)<=manifest.tileSize*2)sites.add(site.locationId);
    }
    discovery.discoveredRegionIds=[...regions].sort();discovery.discoveredSettlementIds=[...settlements].sort();discovery.discoveredSiteIds=[...sites].sort();
    const roads=new Set(discovery.traversedCorridorSegmentIds);discoverRoadSegments(state,manifest,roads);discovery.traversedCorridorSegmentIds=[...roads].sort();
    return freezeWire(discovery);
  }
  const visited = new Set(discovery.visitedAreaIds);
  for (const player of Object.values(state.playersById)) {
    const actor = state.space.entitiesById[player.entityId], chunk = actor && areaAtWorldPosition(manifest, actor.position);
    if (chunk) visited.add(chunk.discoveryId);
  }
  discovery.visitedAreaIds = [...visited].sort();
  // Crossing a road seam records the stable segment whenever a party hull is
  // centered within one tile of its world boundary opening.
  const roads = new Set(discovery.traversedRoadSegmentIds);discoverRoadSegments(state,manifest,roads);
  discovery.traversedRoadSegmentIds = [...roads].sort();
  return freezeWire(discovery);
}
function discoverRoadSegments(state,manifest,roads){
  for (const seam of manifest.seams.filter(candidate => candidate.roadSegmentId)) {
    const a = manifest.chunks.find(chunk => technicalChunkId(chunk) === endpointChunkId(seam.a)), horizontal = ["east", "west"].includes(seam.a.side);
    const boundary = horizontal ? (seam.a.side === "east" ? a.origin.x + a.dimensions.width : a.origin.x) :
      (seam.a.side === "south" ? a.origin.y + a.dimensions.height : a.origin.y);
    const center = (manifest.manifestVersion===2?openingSpan(manifest,seam,seam.a).roadCenter:seamCenter(manifest,seam.a)) * manifest.tileSize;
    if (Object.values(state.playersById).some(player => { const p = state.space.entitiesById[player.entityId].position;
      return horizontal ? Math.abs(p.x - boundary) <= manifest.tileSize && Math.abs(p.y - center) <= manifest.tileSize * 1.5 :
        Math.abs(p.y - boundary) <= manifest.tileSize && Math.abs(p.x - center) <= manifest.tileSize * 1.5; })) roads.add(seam.roadSegmentId);
  }
}

export function validateOverworldState(state) {
  const manifest = manifestForState(state); if (!manifest) return;
  validateOverworldCampaign(state.campaign.overworld, manifest);
  requireContract(state.space.spaceId === manifest.logicalSpaceId && state.space.contentDefinitionId === manifest.contentDefinitionId &&
    state.space.collision.tileSize === manifest.tileSize && state.space.collision.width * manifest.tileSize === manifest.dimensions.width &&
    state.space.collision.height * manifest.tileSize === manifest.dimensions.height, "Active seamless overworld geometry mismatch");
  for (const actor of Object.values(state.space.entitiesById)) {
    requireContract(areaAtWorldPosition(manifest, actor.position), "Actor outside authored overworld footprint");
    if (actor.team === "hostile") requireContract(!manifest.safeRegions.some(region =>
      actor.position.x + actor.hullRadius > region.x && actor.position.x - actor.hullRadius < region.x + region.width &&
      actor.position.y + actor.hullRadius > region.y && actor.position.y - actor.hullRadius < region.y + region.height),
    "Hostile actor overlaps explicit safe region");
  }
}

export function validateOverworldDiscoveryProgress(before, after, manifest) {
  validateOverworldCampaign(before, manifest); validateOverworldCampaign(after, manifest);
  for (const key of manifest.manifestVersion===1?["visitedAreaIds", "traversedRoadSegmentIds"]:
    ["discoveredRegionIds","discoveredSettlementIds","discoveredSiteIds","traversedCorridorSegmentIds"])
    requireContract(before.discovery[key].every(id => after.discovery[key].includes(id)), "Overworld discovery regressed");
}

export function validateCampaignDiscoveryProgress(beforeState, afterState) {
  const before = beforeState.campaign, after = afterState.campaign;
  if (!before.overworld) {
    requireContract(canonicalStringify(before) === canonicalStringify(after), "Campaign changed during live progress");
    return;
  }
  const manifest = manifestForState(afterState), normalized = copyWire(after);
  normalized.overworld.discovery = copyWire(before.overworld.discovery);
  requireContract(canonicalStringify(normalized) === canonicalStringify(before), "Stable campaign/manifest identity changed");
  validateOverworldDiscoveryProgress(before.overworld, after.overworld, manifest);
}

export function isWorldPointSafe(manifest, position) {
  return manifest.safeRegions.some(region => position.x >= region.x && position.y >= region.y &&
    position.x < region.x + region.width && position.y < region.y + region.height);
}
