import { canonicalStringify, freezeWire, requireContract } from "../contracts/wire.js";
import { bytesToHex, hashBytes, utf8 } from "../contracts/hashing.js";

// Fixed authored registry. Tokens are assigned here, never derived from labels,
// array order, controllers or runtime instances. Coordinates are topology only.
export const REGION_ID = "region:7a01";
export const LAYOUT_VERSION = 1;
export const GEOGRAPHY_DEFINITION_ID = "def:7a0000000000000000000000000000ff";
export const SPACE_IDS = freezeWire({
  town: "spc:7a000000000000000000000000000001",
  sw: "spc:7a000000000000000000000000000011", s: "spc:7a000000000000000000000000000012", se: "spc:7a000000000000000000000000000013",
  w: "spc:7a000000000000000000000000000014", c: "spc:7a000000000000000000000000000015", e: "spc:7a000000000000000000000000000016",
  nw: "spc:7a000000000000000000000000000017", n: "spc:7a000000000000000000000000000018", ne: "spc:7a000000000000000000000000000019",
});
const W = 32, H = 26, TILE = 32;
const sockets = {
  north: { x: 528, y: 48, anchor: { x: 528, y: 112 }, opposite: "south" },
  south: { x: 528, y: 784, anchor: { x: 528, y: 720 }, opposite: "north" },
  west: { x: 48, y: 432, anchor: { x: 112, y: 432 }, opposite: "east" },
  east: { x: 976, y: 432, anchor: { x: 912, y: 432 }, opposite: "west" },
};
const party = (p) => [{ x: p.x-12, y: p.y-12 }, { x: p.x+12, y: p.y-12 }, { x: p.x-12, y: p.y+12 }, { x: p.x+12, y: p.y+12 }];
// Independent explicit socket pairs. Old Ward Road uses the first five links.
export const OLDWARD_LINKS = freezeWire([
  ["socket:7101", "town", "north", "socket:7102", "sw", "south", "road:701"],
  ["socket:7103", "sw", "east", "socket:7104", "s", "west", "road:702"],
  ["socket:7105", "s", "north", "socket:7106", "c", "south", "road:703"],
  ["socket:7107", "c", "east", "socket:7108", "e", "west", "road:704"],
  ["socket:7109", "e", "north", "socket:710a", "ne", "south", "road:705"],
  ["socket:7111", "sw", "north", "socket:7112", "w", "south", null],
  ["socket:7113", "w", "north", "socket:7114", "nw", "south", null],
  ["socket:7115", "w", "east", "socket:7116", "c", "west", null],
  ["socket:7117", "nw", "east", "socket:7118", "n", "west", null],
  ["socket:7119", "c", "north", "socket:711a", "n", "south", null],
  ["socket:711b", "n", "east", "socket:711c", "ne", "west", null],
  ["socket:711d", "s", "east", "socket:711e", "se", "west", null],
  ["socket:711f", "se", "north", "socket:7120", "e", "south", null],
]);
const links = OLDWARD_LINKS;
const records = [
  ["town", "Alderwatch", 0, 3, "anchor:7201"],
  ["sw", "Oldward Wood · South Gate", 0, 2, "anchor:7211"],
  ["s", "Oldward Wood · Alder Bend", 1, 2, "anchor:7212"],
  ["se", "Oldward Wood · Fern Hollow", 2, 2, "anchor:7213"],
  ["w", "Oldward Wood · Moss Glade", 0, 1, "anchor:7214"],
  ["c", "Oldward Wood · Ward Crossing", 1, 1, "anchor:7215"],
  ["e", "Oldward Wood · Stone Rise", 2, 1, "anchor:7216"],
  ["nw", "Oldward Wood · High Canopy", 0, 0, "anchor:7217"],
  ["n", "Oldward Wood · Amber Clearing", 1, 0, "anchor:7218"],
  ["ne", "Oldward Wood · Road's End", 2, 0, "anchor:7219"],
];
const names = Object.fromEntries(records.map(([key, label]) => [key, label]));
const definitionIds = {
  town: "def:7a000000000000000000000000000001", sw: "def:7a000000000000000000000000000011",
  s: "def:7a000000000000000000000000000012", se: "def:7a000000000000000000000000000013",
  w: "def:7a000000000000000000000000000014", c: "def:7a000000000000000000000000000015",
  e: "def:7a000000000000000000000000000016", nw: "def:7a000000000000000000000000000017",
  n: "def:7a000000000000000000000000000018", ne: "def:7a000000000000000000000000000019",
};
// Authored obstacle groups leave a connected, ordinary walkable forest floor.
const groves = {
  sw: [[3,4,5,4],[10,3,3,5],[22,3,5,5],[3,17,5,5],[23,18,5,4]],
  s: [[3,3,6,4],[22,4,6,5],[7,18,5,5],[21,18,6,4],[10,8,2,2]],
  se: [[4,4,5,5],[22,3,5,6],[3,18,5,4],[21,18,7,4],[10,7,2,2]],
  w: [[3,3,5,4],[23,3,5,6],[3,19,5,4],[24,18,4,5],[10,4,2,3]],
  c: [[3,3,6,5],[23,4,5,5],[3,18,6,5],[22,18,6,5]],
  e: [[3,3,6,4],[23,4,5,5],[3,19,6,4],[23,18,5,5],[10,7,2,2]],
  nw: [[3,3,7,5],[23,3,5,6],[3,17,6,6],[23,18,5,4]],
  n: [[4,4,5,4],[23,3,5,6],[3,18,6,5],[22,18,6,5]],
  ne: [[3,4,6,5],[23,3,5,6],[3,18,6,5],[23,18,5,5]],
};
function authorSpace([key, label, gridX, gridY, anchorId]) {
  const town = key === "town", tiles = Array.from({ length: H }, () => Array(W).fill("1"));
  const terrain = Array.from({ length: H }, () => Array(W).fill(town ? "g" : "f"));
  const blockers = [], exits = [];
  function rect(x, y, width, height, kind, detail = "") {
    blockers.push({ x, y, width, height, kind, detail });
    for (let row=y; row<y+height; row++) for (let col=x; col<x+width; col++) tiles[row][col] = "2";
  }
  rect(0,0,W,1,town ? "fence" : "thicket"); rect(0,H-1,W,1,town ? "fence" : "thicket");
  rect(0,1,1,H-2,town ? "fence" : "thicket"); rect(W-1,1,1,H-2,town ? "fence" : "thicket");
  for (const link of links) {
    let [exitId, from, side, reciprocalExitId, to, otherSide, roadSegmentId] = link;
    if (key === to) [exitId, from, side, reciprocalExitId, to, otherSide] = [reciprocalExitId, to, otherSide, exitId, from, side];
    if (key !== from) continue;
    const socket = sockets[side];
    exits.push({ exitId, side, x: socket.x, y: socket.y, radius: 38, destinationSpaceId: SPACE_IDS[to], reciprocalExitId,
      anchorId: `${exitId}/arrival`, partyPositions: party(socket.anchor), roadSegmentId,
      label: to === "town" ? "Enter Alderwatch" : `${roadSegmentId ? "Old Ward Road" : "Woodland path"} → ${names[to].split(" · ").at(-1)}` });
    // Road connects each road socket to the central clearing; footpaths are
    // narrower and never wall off the surrounding traversable forest floor.
    const horizontal = side === "east" || side === "west", radius = roadSegmentId || town ? 1 : 0;
    const end = horizontal ? socket.x/TILE-0.5 : socket.y/TILE-0.5, mid = horizontal ? 16 : 13;
    for (let step=Math.min(mid,end); step<=Math.max(mid,end); step++) for (let d=-radius; d<=radius; d++) {
      const x = horizontal ? step : 16+d, y = horizontal ? 13+d : step;
      if (terrain[y][x] !== "r") terrain[y][x] = roadSegmentId || town ? "r" : "p";
    }
  }
  for (let y=10;y<=16;y++) for(let x=13;x<=19;x++) if (terrain[y][x] === "f") terrain[y][x] = "g";
  if (town) {
    for (let y=1;y<H-1;y++) for(let x=15;x<=17;x++) terrain[y][x]="r";
    for (let x=1;x<W-1;x++) for(let y=12;y<=14;y++) terrain[y][x]="r";
    [[3,6,"The Alder Inn"],[12,6,"Merchant"],[18,6,"Town Hall"],[26,6,"Watch House"],
      [3,17,"Smith"],[12,17,"Cottage"],[18,17,"Vault"],[26,17,"Cottage"],
      [3,10,"Mastery Hall"],[26,10,"Storehouse"]].forEach(([x,y,name])=>rect(x,y,3, town && y===10 ? 2 : 4,"building",name));
  } else {
    groves[key].forEach(([x,y,w,h]) => rect(x,y,w,h,"trees"));
    rect(10,19,2,2,"rock"); rect(21,9,2,2,"rock");
  }
  return { spaceId: SPACE_IDS[key], contentDefinitionId: definitionIds[key], regionId: REGION_ID, label,
    kind: town ? "settlement" : "woodland", grid: { x: gridX, y: gridY },
    collision: { tileSize: TILE, width: W, height: H, tiles: tiles.map(row=>row.join("")) },
    visual: { terrain: terrain.map(row=>row.join("")), blockers, atmosphere: town ? "alderwatch" : key },
    anchor: { anchorId, partyPositions: party({x:528,y:town ? 368 : 432}) }, exits,
    safety: { encounterAllowed: !town, settlementSafe: town, exteriorHostileBuffer: town ? 0 : 128,
      protectedArrivalRadius: 64, townApproach: key === "sw" ? { exitId: "socket:7102", exclusionRadius: 192 } : null } };
}
export const OLDWARD_SPACES = freezeWire(records.map(authorSpace));
export const OLDWARD_ROAD = freezeWire({ roadId: "road:700", label: "Old Ward Road", segments: links.filter(l=>l[6]).map(l=>({
  roadSegmentId: l[6], fromSpaceId: SPACE_IDS[l[1]], exitId: l[0], toSpaceId: SPACE_IDS[l[4]], reciprocalExitId: l[3] })) });
export const OLDWARD_LAYOUT = freezeWire({ regionId: REGION_ID, layoutVersion: LAYOUT_VERSION, spaces: OLDWARD_SPACES, road: OLDWARD_ROAD });
export const SEAMLESS_MANIFEST_DEFINITION_ID = "def:7a0000000000000000000000000000aa";
export const SEAMLESS_OVERWORLD_SPACE_ID = "spc:7a0000000000000000000000000000aa";

// The authored G-A arrangement is one input fixture for the generic manifest
// compiler. It is not imported by movement, collision or rendering code.
export async function createOldwardSeamlessManifest(sha256) {
  const chunks = OLDWARD_SPACES.map(space => ({ areaId: space.spaceId, label: space.label,
    discoveryId: space.spaceId, origin: { x: space.grid.x * W * TILE, y: space.grid.y * H * TILE },
    dimensions: { width: W * TILE, height: H * TILE }, collisionDefinitionId: space.contentDefinitionId,
    terrainDefinitionId: space.contentDefinitionId }));
  const seams = links.map(([exitId, from, fromSide, reciprocalExitId, to, toSide, roadSegmentId], index) => ({
    seamId: `seam:oldward-${String(index + 1).padStart(2, "0")}`,
    a: { areaId: SPACE_IDS[from], side: fromSide, exitId },
    b: { areaId: SPACE_IDS[to], side: toSide, exitId: reciprocalExitId },
    roadSegmentId, openingTiles: 3,
  }));
  const town = chunks.find(chunk => chunk.areaId === SPACE_IDS.town);
  const body = { format: "saq-world-overworld-manifest", manifestVersion: 1,
    manifestId: "manifest:oldward-reference-v1", sourceKind: "deterministic-reference-fixture",
    logicalSpaceId: SEAMLESS_OVERWORLD_SPACE_ID, label: "Alderwatch & Oldward Wood",
    tileSize: TILE, dimensions: { width: 3 * W * TILE, height: 4 * H * TILE },
    chunks, seams,
    roads: [{ roadId: OLDWARD_ROAD.roadId, label: OLDWARD_ROAD.label,
      roadSegmentIds: OLDWARD_ROAD.segments.map(segment => segment.roadSegmentId) }],
    safeRegions: [{ safeRegionId: "safe:alderwatch", areaId: SPACE_IDS.town,
      x: town.origin.x, y: town.origin.y, width: town.dimensions.width, height: town.dimensions.height,
      marker: { x: town.origin.x + 528, y: town.origin.y + 368, label: "ALDERWATCH" } }],
  };
  const manifestHash = bytesToHex(await hashBytes(utf8(canonicalStringify(body)), sha256));
  return freezeWire({ contentDefinitionId: SEAMLESS_MANIFEST_DEFINITION_ID, kind: "overworldManifest", manifestHash, ...body });
}
export function oldwardAreaDefinition(contentDefinitionId) {
  const space = OLDWARD_SPACES.find(candidate => candidate.contentDefinitionId === contentDefinitionId);
  requireContract(space, "Unknown Oldward area definition");
  return freezeWire({ collision: space.collision, visual: space.visual });
}
export function oldwardSpace(spaceId) {
  const record = OLDWARD_SPACES.find(space=>space.spaceId === spaceId);
  requireContract(record, "Unknown authored Oldward space");
  return record;
}
export function isOldwardExit(exitId) { return OLDWARD_SPACES.some(space=>space.exits.some(exit=>exit.exitId === exitId)); }
