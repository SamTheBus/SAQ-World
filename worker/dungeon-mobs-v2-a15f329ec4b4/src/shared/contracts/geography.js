import { closedRecord, copyWire, canonicalStringify, requireContract } from "./wire.js";
import { bytesToHex, hashBytes, utf8, validateHex } from "./hashing.js";
import { OLDWARD_LAYOUT, OLDWARD_SPACES, OLDWARD_ROAD, REGION_ID, LAYOUT_VERSION, GEOGRAPHY_DEFINITION_ID, SPACE_IDS, oldwardSpace } from "../content/oldward_wood.js";
export { oldwardSpace, OLDWARD_SPACES, SPACE_IDS } from "../content/oldward_wood.js";

export async function authoredGeographyDefinition(sha256) {
  return { contentDefinitionId: GEOGRAPHY_DEFINITION_ID, kind: "authoredGeography", regionId: REGION_ID,
    layoutVersion: LAYOUT_VERSION, layoutFingerprint: bytesToHex(await hashBytes(utf8(canonicalStringify(OLDWARD_LAYOUT)), sha256)) };
}
export function initialDiscovery(definition) {
  return { regionId: REGION_ID, layoutVersion: LAYOUT_VERSION, layoutFingerprint: definition.layoutFingerprint,
    visitedSpaceIds: [SPACE_IDS.town], traversedRoadSegmentIds: [] };
}
export function validateDiscovery(value) {
  closedRecord(value, ["regionId", "layoutVersion", "layoutFingerprint", "visitedSpaceIds", "traversedRoadSegmentIds"]);
  requireContract(value.regionId === REGION_ID && value.layoutVersion === LAYOUT_VERSION, "Unsupported authored geography");
  validateHex(value.layoutFingerprint, 32);
  for (const [entries, known] of [[value.visitedSpaceIds, OLDWARD_SPACES.map(s=>s.spaceId)],
    [value.traversedRoadSegmentIds, OLDWARD_ROAD.segments.map(s=>s.roadSegmentId)]]) {
    requireContract(Array.isArray(entries) && entries.length <= known.length, "Discovery bounds");
    entries.forEach((id,i)=>requireContract(known.includes(id) && (i===0 || entries[i-1] < id), "Unknown/duplicate/unsorted discovery identity"));
  }
  requireContract(value.visitedSpaceIds.includes(SPACE_IDS.town), "Campaign must discover its starting town");
  for (const id of value.traversedRoadSegmentIds) {
    const segment = OLDWARD_ROAD.segments.find(s=>s.roadSegmentId===id);
    requireContract([segment.fromSpaceId,segment.toSpaceId].every(s=>value.visitedSpaceIds.includes(s)), "Road discovery needs visited endpoints");
  }
}
export function validateWorldGeography(state) {
  const regional = OLDWARD_SPACES.some(s=>s.spaceId===state.space?.spaceId);
  requireContract(regional === Boolean(state.campaign.geography), "Authored space/discovery linkage mismatch");
  if (!regional) return;
  const progress = state.campaign.geography, space = oldwardSpace(state.space.spaceId);
  validateDiscovery(progress);
  const definition = state.content.definitionsById[GEOGRAPHY_DEFINITION_ID];
  requireContract(definition?.kind === "authoredGeography" && definition.regionId === progress.regionId &&
    definition.layoutVersion === progress.layoutVersion && definition.layoutFingerprint === progress.layoutFingerprint,
    "Authored layout fingerprint linkage mismatch");
  requireContract(progress.visitedSpaceIds.includes(space.spaceId) && state.space.contentDefinitionId === space.contentDefinitionId &&
    canonicalStringify(state.space.collision) === canonicalStringify(space.collision), "Active authored geometry mismatch");
  requireContract(space.safety.encounterAllowed || (state.space.encounterId === null &&
    Object.values(state.space.entitiesById).every(e=>e.team === "party")), "Alderwatch forbids encounters and hostile actors");
}
export function discoverCrossing(progress, destinationSpaceId, roadSegmentId) {
  const next = copyWire(progress);
  next.visitedSpaceIds = [...new Set([...next.visitedSpaceIds, destinationSpaceId])].sort();
  if (roadSegmentId) next.traversedRoadSegmentIds = [...new Set([...next.traversedRoadSegmentIds, roadSegmentId])].sort();
  validateDiscovery(next);
  return next;
}
