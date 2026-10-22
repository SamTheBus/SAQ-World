import { freezeWire, requireContract } from "../contracts/wire.js";

// Exactly two hand-authored technical fixtures. No region or generation system.
const field = { tileSize: 32, width: 28, height: 18, tiles: [
  "2222222222222222222222222222",
  ...Array.from({ length: 16 }, (_, y) => y >= 3 && y <= 9 ?
    "2111111111222111111111111112" : "2111111111111111111111111112"),
  "2222222222222222222222222222",
] };
const room = { tileSize: 32, width: 18, height: 12, tiles: [
  "222222222222222222", ...Array.from({ length: 10 }, (_, y) => y >= 2 && y <= 5 ?
    "211111122111111112" : "211111111111111112"), "222222222222222222",
] };
export const ACTIVE_SPACE_FIXTURES = freezeWire([
  { spaceId: "spc:f1000000000000000000000000000001", contentDefinitionId: "def:f1000000000000000000000000000001",
    label: "Test field A", collision: field, anchor: { x: 112, y: 272 },
    exit: { exitId: "field-to-room", x: 208, y: 272, radius: 28, destinationIndex: 1 } },
  { spaceId: "spc:f1000000000000000000000000000002", contentDefinitionId: "def:f1000000000000000000000000000002",
    label: "Test room B", collision: room, anchor: { x: 112, y: 272 },
    exit: { exitId: "room-to-field", x: 208, y: 272, radius: 28, destinationIndex: 0 } },
]);
export function activeSpaceFixture(spaceId) {
  const fixture = ACTIVE_SPACE_FIXTURES.find((entry) => entry.spaceId === spaceId);
  requireContract(fixture, "Unknown active-space fixture");
  return fixture;
}
