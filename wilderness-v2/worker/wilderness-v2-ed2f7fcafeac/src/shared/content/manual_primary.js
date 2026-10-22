import { freezeWire } from "../contracts/wire.js";

// New World prototype policy, not an H4A combo. Direct damage stays unchanged.
export const SHIELD_SWORD_PRIMARY = freezeWire({
  contentDefinitionId: "def:b1000000000000000000000000000010", kind: "primaryProfile", family: "shield-sword-prototype",
  continuationTicks: 48, forwardDotMinimum: 0.5,
  steps: [
    { startup: 6, active: 3, recovery: 13, startupMovement: 0.65, activeMovement: 0.65, recoveryMovement: 0.8 },
    { startup: 7, active: 3, recovery: 14, startupMovement: 0.65, activeMovement: 0.65, recoveryMovement: 0.8 },
    { startup: 14, active: 4, recovery: 22, startupMovement: 0.65, activeMovement: 0.65, recoveryMovement: 0.8 },
  ],
});
export const SLIME_CLEARING = freezeWire({
  encounterId: "enc:b1000000000000000000000000000001", label: "Fern Hollow slime clearing",
  spaceId: "spc:7a000000000000000000000000000013",
  activation: { x: 464, y: 432, radius: 48 },
  hostilePosition: { x: 640, y: 432 }, hostileProfileId: "def:c1000000000000000000000000000002",
  acquireRange: 128,
});
