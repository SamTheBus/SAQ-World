import { canonicalStringify, freezeWire, requireContract } from "../contracts/wire.js";
import { createId } from "../contracts/identities.js";
import { bytesToHex, frameUtf8, hashBytes, utf8 } from "../contracts/hashing.js";
import { validateStoredSeed } from "../contracts/seed.js";
import { deriveScopedStream, nextBoundedInteger } from "../contracts/rng.js";
import { OLDWARD_SPACES, oldwardAreaDefinition } from "../content/oldward_wood.js";
import { ARTIFACT_PROOF_CATALOG, currentProceduralContentCatalogHash, LOCATION_SITE_PROOF_CATALOG } from "../content/procedural_catalog.js";
import { compileOverworldManifest, validateOverworldManifestDefinition, CONQUEST_TIERS, SEMANTIC_POLICY_VERSION, SEAM_POLICY_VERSION } from "../contracts/overworld.js";

import { createMajorNameRegistry, MAJOR_NAME_POLICY_VERSION } from '../contracts/major_place_names.js';
import { generateSiteInterior } from './site_interiors.js';
import { generateOrdinaryPopulation } from '../contracts/ordinary_population.js';

export const PROCEDURAL_GENERATOR_VERSION = "world-overworld-generator-v1";
export const PROCEDURAL_RECIPE_VERSION = "proof-catalog-layout-v1";
export const PROCEDURAL_MANIFEST_VERSION = 2;

export { ARTIFACT_PROOF_CATALOG, currentProceduralContentCatalogHash, LOCATION_SITE_PROOF_CATALOG };

const CHUNK_WIDTH_TILES = 32, CHUNK_HEIGHT_TILES = 26, TILE_SIZE = 32;
// Recipe-owned slot order. These are bounded connected polyominoes, not a
// fixed world topology and not player-facing place records.
const LAYOUT_TEMPLATES = freezeWire([
  [[0,0],[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[3,1],[1,2],[2,2]],
  [[1,0],[2,0],[0,1],[1,1],[2,1],[3,1],[0,2],[1,2],[2,2],[3,2]],
  [[0,0],[1,0],[1,1],[2,1],[3,1],[0,2],[1,2],[2,2],[3,2],[3,3]],
  [[0,0],[0,1],[1,1],[2,1],[3,1],[0,2],[1,2],[2,2],[2,3],[3,3]],
]);
const REGION_NAMES = freezeWire([
  [{ label: "Alderwild", landscapeKind: "forest" }, { label: "Stonefold Hills", landscapeKind: "hills" }],
  [{ label: "Mossward Forest", landscapeKind: "forest" }, { label: "Rainmere", landscapeKind: "marsh" }],
  [{ label: "Greenveil", landscapeKind: "forest" }, { label: "Amber Ridges", landscapeKind: "hills" }],
  [{ label: "Old Pine Reach", landscapeKind: "forest" }, { label: "Mistfen", landscapeKind: "marsh" }],
]);
export const SETTLEMENT_NAMES = freezeWire(["Alderwatch", "Briarwatch", "Greenward", "Stonewatch"]);
const SITE_ANCHORS = freezeWire([
  { x: 464, y: 432 }, { x: 528, y: 432 }, { x: 400, y: 432 }, { x: 528, y: 336 },
]);
const keyFor = ([x,y]) => `${x},${y}`;
const neighborsOf = (slot, slots) => {
  const known = new Map(slots.map(value => [keyFor(value), value]));
  return [[slot[0],slot[1]-1],[slot[0]+1,slot[1]],[slot[0],slot[1]+1],[slot[0]-1,slot[1]]]
    .filter(value => known.has(keyFor(value)));
};

async function derivedToken(identity, domain, key, sha256) {
  const digest = await hashBytes(frameUtf8(["SAQ-WORLD-GENERATED-ID-v1", identity.seedHex,
    identity.generatorVersion, identity.worldRecipeVersion, identity.contentCatalogHash, domain, key]), sha256);
  return bytesToHex(digest.slice(0, 16));
}
async function derivedId(kind, identity, domain, key, sha256) {
  return createId(kind, await derivedToken(identity, domain, key, sha256));
}
function cursorFrom(stream) {
  let state = stream.initialState;
  return {
    take(bound) { const result = nextBoundedInteger(state, bound); state = result.state; return result.value; },
    shuffle(values) { const result = [...values]; for (let n=result.length-1;n>0;n--) {
      const pick=this.take(n+1); [result[n],result[pick]]=[result[pick],result[n]];
    } return result; },
  };
}

function breadthFirstSlots(slots, start) {
  const known = new Map(slots.map(value => [keyFor(value), value])), seen = new Set([keyFor(start)]), queue = [start], result=[];
  while(queue.length) {
    const current=queue.shift(); result.push(current);
    for(const next of [[current[0],current[1]-1],[current[0]+1,current[1]],[current[0],current[1]+1],[current[0]-1,current[1]]]) {
      const key=keyFor(next); if(known.has(key)&&!seen.has(key)){seen.add(key);queue.push(known.get(key));}
    }
  }
  requireContract(result.length===slots.length,"Procedural layout template is disconnected");
  return result;
}

function worldPoint(slot, local) {
  return { x: slot[0]*CHUNK_WIDTH_TILES*TILE_SIZE+local.x, y: slot[1]*CHUNK_HEIGHT_TILES*TILE_SIZE+local.y };
}

function connectedRegionCut(bfs, slots, settlementNeighbor, random, minimumHomeChunks=2) {
  // Reuse the existing road spanning tree. Cutting an edge yields two connected
  // components; exclude cuts that separate the two home settlement chunks.
  const children=new Map(bfs.map(slot=>[keyFor(slot),[]])),roadPairs=new Set();
  for(let index=1;index<bfs.length;index++){
    const prior=new Set(bfs.slice(0,index).map(keyFor)),parent=neighborsOf(bfs[index],slots).find(slot=>prior.has(keyFor(slot)));
    requireContract(parent,"Road tree cannot connect generated slot");
    children.get(keyFor(parent)).push(keyFor(bfs[index]));
    roadPairs.add([keyFor(parent),keyFor(bfs[index])].sort().join("/"));
  }
  const candidates=[];
  for(const root of bfs.slice(1)){
    const component=new Set(),pending=[keyFor(root)];
    while(pending.length){const key=pending.pop();component.add(key);pending.push(...children.get(key));}
    if(component.size>=2&&bfs.length-component.size>=minimumHomeChunks&&!component.has(keyFor(settlementNeighbor)))candidates.push(component);
  }
  requireContract(candidates.length>0,"No connected region cut preserves the home settlement");
  const bestBalance=Math.min(...candidates.map(component=>Math.abs(bfs.length-2*component.size)));
  const balanced=candidates.filter(component=>Math.abs(bfs.length-2*component.size)===bestBalance);
  return {awayRegion:balanced[random.take(balanced.length)],roadPairs};
}

export async function generateProceduralOverworld({ campaignSeed, sha256, populationEnabled=false, sitesEnabled=false }) {
  validateStoredSeed(campaignSeed);
  requireContract(!sitesEnabled||populationEnabled,'Site ordinary-content dependency');
  const contentCatalogHash=await currentProceduralContentCatalogHash(sha256,populationEnabled);
  const identity = freezeWire({ ...campaignSeed, generatorVersion: populationEnabled?"world-overworld-generator-d1-v1":PROCEDURAL_GENERATOR_VERSION,
    worldRecipeVersion: PROCEDURAL_RECIPE_VERSION, contentCatalogHash });
  const stream = await deriveScopedStream(identity, { domain: "overworld-layout", keys: [{kind:"recipe",value:"macro-v1"}] }, { sha256 });
  const random = cursorFrom(stream), templateIndex=random.take(LAYOUT_TEMPLATES.length), slots=LAYOUT_TEMPLATES[templateIndex].map(value=>[...value]);
  const eligibleStarts=slots.filter(slot=>neighborsOf(slot,slots).length>=2);
  const startSlot=eligibleStarts[random.take(eligibleStarts.length)], bfs=breadthFirstSlots(slots,startSlot);
  const settlementNeighbor=random.shuffle(neighborsOf(startSlot,slots))[0];
  const regionPair=REGION_NAMES[random.take(REGION_NAMES.length)], settlementCandidate=SETTLEMENT_NAMES[random.take(SETTLEMENT_NAMES.length)];
  const siteProperName='Stonewatch';
  const names=sitesEnabled?createMajorNameRegistry([siteProperName]):null;
  const settlementLabel=names?names.assign(settlementCandidate,SETTLEMENT_NAMES):settlementCandidate;
  const regionIds=await Promise.all([0,1].map(index=>derivedToken(identity,"region",String(index),sha256).then(token=>`region:${token}`)));
  const settlementId=`settlement:${await derivedToken(identity,"settlement","home",sha256)}`;
  const corridorId=`corridor:${await derivedToken(identity,"corridor","primary-road",sha256)}`;

  // Macro semantics are fixed before technical chunks receive source content.
  // Separate streams preserve all existing layout/source/site draws and IDs.
  const regionRandom=cursorFrom(await deriveScopedStream(identity,{domain:"overworld-regions",keys:[{kind:"recipe",value:"connected-tree-cut-v1"}]},{sha256}));
  const {awayRegion,roadPairs}=connectedRegionCut(bfs,slots,settlementNeighbor,regionRandom,populationEnabled?4:2);
  const tierRandom=cursorFrom(await deriveScopedStream(identity,{domain:"overworld-tiers",keys:[{kind:"recipe",value:"conquest-capacity-v1"}]},{sha256}));
  const siteTiers=tierRandom.shuffle(CONQUEST_TIERS),artifactTiers=tierRandom.shuffle(["B","A","S"]);
  const macroSlots=bfs.map((slot,index)=>({slot,regionIndex:awayRegion.has(keyFor(slot))?1:0,
    settlement:index===0||keyFor(slot)===keyFor(settlementNeighbor)}));
  const wildernessSources=OLDWARD_SPACES.filter(space=>!space.safety.settlementSafe)
    .sort((a,b)=>a.contentDefinitionId.localeCompare(b.contentDefinitionId));
  const orderedSources=[OLDWARD_SPACES.find(space=>space.safety.settlementSafe),...random.shuffle(wildernessSources)];
  const chunks=[];
  for(let index=0;index<macroSlots.length;index++) {
    const macro=macroSlots[index], source=orderedSources[index];
    chunks.push({ chunkId:await derivedId("spaceId",identity,"chunk",keyFor(macro.slot),sha256),
      origin:{x:macro.slot[0]*CHUNK_WIDTH_TILES*TILE_SIZE,y:macro.slot[1]*CHUNK_HEIGHT_TILES*TILE_SIZE},
      dimensions:{width:CHUNK_WIDTH_TILES*TILE_SIZE,height:CHUNK_HEIGHT_TILES*TILE_SIZE},
      collisionDefinitionId:source.contentDefinitionId,terrainDefinitionId:source.contentDefinitionId });
  }
  const chunkBySlot=new Map(macroSlots.map((macro,index)=>[keyFor(macro.slot),chunks[index]]));
  const chunkIdAt=slot=>chunkBySlot.get(keyFor(slot)).chunkId;
  const seams=[];
  for(const slot of slots) for(const [dx,dy,aSide,bSide] of [[1,0,"east","west"],[0,1,"south","north"]]) {
    const other=[slot[0]+dx,slot[1]+dy]; if(!chunkBySlot.has(keyFor(other)))continue;
    const pairKey=[keyFor(slot),keyFor(other)].sort().join("/"),seamToken=await derivedToken(identity,"seam",pairKey,sha256);
    const roadSegmentId=roadPairs.has(pairKey)?`road:${await derivedToken(identity,"road-segment",pairKey,sha256)}`:null;
    seams.push({seamId:`seam:${seamToken}`,a:{chunkId:chunkIdAt(slot),side:aSide,exitId:`socket:${seamToken.slice(0,16)}a`},
      b:{chunkId:chunkIdAt(other),side:bSide,exitId:`socket:${seamToken.slice(0,16)}b`},roadSegmentId});
  }
  seams.sort((a,b)=>a.seamId.localeCompare(b.seamId));
  // Seam geography has its own stream: no layout, region, site or tier draw changes.
  // Keep the road spanning tree broad, including the inter-region tree edge.
  // At most one optional non-tree link is deliberately a narrow woodland pass.
  const seamRandom=cursorFrom(await deriveScopedStream(identity,{domain:"overworld-seams",keys:[{kind:"recipe",value:SEAM_POLICY_VERSION}]},{sha256}));
  const homeIds=new Set(macroSlots.filter(m=>m.settlement).map(m=>chunkIdAt(m.slot)));
  const passCandidates=seams.filter(seam=>!seam.roadSegmentId&&!(homeIds.has(seam.a.chunkId)&&homeIds.has(seam.b.chunkId)));
  const pass=passCandidates.length&&seamRandom.take(3)===0?passCandidates[seamRandom.take(passCandidates.length)]:null;
  for(const seam of seams){
    const length=["north","south"].includes(seam.a.side)?CHUNK_WIDTH_TILES:CHUNK_HEIGHT_TILES;
    const home=homeIds.has(seam.a.chunkId)&&homeIds.has(seam.b.chunkId);
    seam.seamForm=home?"OPEN":seam===pass?"CORRIDOR":seamRandom.take(3)===0?"NATURAL":"OPEN";
    if(seam.seamForm==="CORRIDOR"){
      seam.openingTiles=3+2*seamRandom.take(2);seam.openingStartTiles=Math.floor(length/2)-Math.floor(seam.openingTiles/2);
    }else if(home){seam.openingStartTiles=1;seam.openingTiles=length-2;}
    else {
      const min=Math.ceil(length*(seam.seamForm==="OPEN"?0.75:0.5));
      const max=seam.seamForm==="OPEN"?length-2:Math.floor(length*0.7);
      seam.openingTiles=min+seamRandom.take(max-min+1);
      const starts=Array.from({length:length-seam.openingTiles-1},(_,i)=>i+1)
        .filter(start=>seam.seamForm!=="NATURAL"||2*start+seam.openingTiles!==length);
      seam.openingStartTiles=starts[seamRandom.take(starts.length)];
    }
  }
  const regions=regionPair.map((record,index)=>({regionId:regionIds[index],label:record.label,landscapeKind:record.landscapeKind,
    discoveryId:`discovery:${regionIds[index].slice(7)}`,chunkIds:macroSlots.filter(m=>m.regionIndex===index).map(m=>chunkIdAt(m.slot)).sort()}));
  const settlements=[{settlementId,label:settlementLabel,localityKind:"town",home:true,
    discoveryId:`discovery:${settlementId.slice(11)}`,chunkIds:macroSlots.filter(m=>m.settlement).map(m=>chunkIdAt(m.slot)).sort()}];
  const corridors=[{corridorId,label:"Old Ward Road",corridorKind:"road",roadSegmentIds:seams.map(seam=>seam.roadSegmentId).filter(Boolean).sort()}];
  const wildernessMacros=random.shuffle(macroSlots.filter(m=>!m.settlement));
  const sites=[];
  for(let index=0;index<LOCATION_SITE_PROOF_CATALOG.length;index++) {
    const definition=LOCATION_SITE_PROOF_CATALOG[index], macro=wildernessMacros[index], chunk=chunkBySlot.get(keyFor(macro.slot));
    const local=SITE_ANCHORS[index], position=worldPoint(macro.slot,local);
    sites.push({locationId:await derivedId("locationId",identity,"location",definition.locationKey,sha256),
      locationDefinitionId:definition.contentDefinitionId,label:definition.label,siteKind:definition.siteKind,chunkId:chunk.chunkId,
      regionId:regionIds[macro.regionIndex],position,siteRole:index===0?"primary-proof":"proof-site",
      siteTier:siteTiers[index],siteRewardCapacityTier:siteTiers[index],artifactEligible:definition.artifactEligible,
      hostilePosition:index===0?worldPoint(macro.slot,{x:640,y:432}):null,
      provenance:{generatorVersion:identity.generatorVersion,recipeKey:`site-${definition.locationKey}`,sourceAnchorId:`anchor:${index+1}`}});
  }
  sites.sort((a,b)=>a.locationId.localeCompare(b.locationId));
  const eligibleSites=random.shuffle(sites.filter(site=>LOCATION_SITE_PROOF_CATALOG.find(d=>d.contentDefinitionId===site.locationDefinitionId).artifactEligible));
  const artifactAssignments=[];
  // Allocate hardest-to-place artifacts first so lower tiers cannot consume
  // the only S-capable site. Preference order is still the existing seeded draw.
  const rankedArtifacts=ARTIFACT_PROOF_CATALOG.map((artifact,index)=>({artifact,tier:artifactTiers[index]}))
    .sort((a,b)=>CONQUEST_TIERS.indexOf(b.tier)-CONQUEST_TIERS.indexOf(a.tier));
  for(const {artifact,tier} of rankedArtifacts) {
    const siteIndex=eligibleSites.findIndex(site=>CONQUEST_TIERS.indexOf(site.siteRewardCapacityTier)>=CONQUEST_TIERS.indexOf(tier));
    requireContract(siteIndex>=0,"No tier-eligible site for proof artifact");
    const [site]=eligibleSites.splice(siteIndex,1);
    artifactAssignments.push({assignmentId:await derivedId("legendAssignmentId",identity,"artifact-assignment",artifact.artifactKey,sha256),
      artifactDefinitionId:artifact.contentDefinitionId,generatedLocationId:site.locationId,
      artifactTier:tier,
      provenance:{generatorVersion:identity.generatorVersion,streamDomain:"overworld-layout"}});
  }
  artifactAssignments.sort((a,b)=>a.assignmentId.localeCompare(b.assignmentId));
  const startChunk=chunkBySlot.get(keyFor(startSlot));
  const maxX=Math.max(...slots.map(slot=>slot[0]))+1,maxY=Math.max(...slots.map(slot=>slot[1]))+1;
  const logicalSpaceId=await derivedId("spaceId",identity,"world","logical",sha256);
  const manifestDefinitionId=await derivedId("contentDefinitionId",identity,"manifest","definition",sha256);
  const manifestId=`manifest:generated-${await derivedToken(identity,"manifest","identity",sha256)}`;
  const safeRegions=[];
  for(const chunk of chunks.filter(chunk=>settlements[0].chunkIds.includes(chunk.chunkId))){
    const home=chunk.chunkId===startChunk.chunkId;
    safeRegions.push({safeRegionId:`safe:${(await derivedToken(identity,"safe-region",home?"home":"home-chunk:"+chunk.chunkId,sha256)).slice(0,24)}`,settlementId,
      x:chunk.origin.x,y:chunk.origin.y,width:chunk.dimensions.width,height:chunk.dimensions.height,
      marker:{x:chunk.origin.x+528,y:chunk.origin.y+368,label:settlementLabel.toUpperCase()}});
  }
  const body={format:"saq-world-overworld-manifest",manifestVersion:PROCEDURAL_MANIFEST_VERSION,manifestId,sourceKind:"generated-campaign",
    semanticPolicyVersion:SEMANTIC_POLICY_VERSION,
    seamPolicyVersion:SEAM_POLICY_VERSION,
    generation:identity,logicalSpaceId,label:`${settlementLabel} & ${regionPair.map(r=>r.label).join(" / ")}`,tileSize:TILE_SIZE,
    dimensions:{width:maxX*CHUNK_WIDTH_TILES*TILE_SIZE,height:maxY*CHUNK_HEIGHT_TILES*TILE_SIZE},chunks,seams,regions,settlements,corridors,sites,
    artifactAssignments,start:{settlementId,chunkId:startChunk.chunkId,position:worldPoint(startSlot,{x:516,y:356})},
    safeRegions};
  if(populationEnabled){
    // Geometry pass uses the established geography-only schema before adding population.
    const provisional=JSON.parse(JSON.stringify({contentDefinitionId:manifestDefinitionId,kind:'overworldManifest',manifestHash:'0'.repeat(64),...body}));
    provisional.generation.generatorVersion=PROCEDURAL_GENERATOR_VERSION;
    for(const record of [...provisional.sites,...provisional.artifactAssignments])record.provenance.generatorVersion=PROCEDURAL_GENERATOR_VERSION;
    const terrain=compileOverworldManifest(provisional,oldwardAreaDefinition);
    body.population=await generateOrdinaryPopulation(body,terrain.collision,sha256);
  }
  if(sitesEnabled){
    // Preserve the D1 geography stream, IDs, position, tiers and assignments.
    // Only the fresh campaign body is extended, before hashing or persistence.
    const terrain=compileOverworldManifest({contentDefinitionId:manifestDefinitionId,kind:'overworldManifest',manifestHash:'0'.repeat(64),...body},oldwardAreaDefinition);
    const host=sites.find(s=>s.locationDefinitionId==='def:d2000000000000000000000000000002');
    requireContract(host,'Missing Waystone Ruin archetype');host.properName=siteProperName;
    body.siteInteriors=[await generateSiteInterior(body,host,terrain.collision,sha256)];
    body.manifestId+='-sites-d2-names-v1';
    body.majorNamePolicyVersion=MAJOR_NAME_POLICY_VERSION;
  }
  const manifestHash=bytesToHex(await hashBytes(utf8(canonicalStringify(body)),sha256));
  const manifest=freezeWire({contentDefinitionId:manifestDefinitionId,kind:"overworldManifest",manifestHash,...body});
  validateOverworldManifestDefinition(manifest);
  const compiled=compileOverworldManifest(manifest,oldwardAreaDefinition);
  const siteWalkable=site=>compiled.collision.tiles[Math.floor(site.position.y/TILE_SIZE)]?.[Math.floor(site.position.x/TILE_SIZE)]==="1";
  requireContract(sites.every(siteWalkable),"Generated site occupies invalid collision");
  requireContract(siteWalkable({position:body.start.position}),"Generated start occupies invalid collision");
  return freezeWire({manifest,diagnostics:{templateIndex,serializedBytes:utf8(canonicalStringify(manifest)).length}});
}
