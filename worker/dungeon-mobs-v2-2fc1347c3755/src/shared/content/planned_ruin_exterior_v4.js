import {freezeWire} from '../contracts/wire.js';
export {PLANNED_RUIN_ENTRY_MASK} from './planned_ruin_exterior_v3.js';
export const PLANNED_RUIN_EXTERIOR_VERSION='planned-ruin-modular-storybook-v4-frontage-v1';
// Preserve the already-reviewed remnant choices; only the local frontage moves.
export const PLANNED_RUIN_REMNANT_VARIATION_VERSION='planned-ruin-modular-storybook-v4';
export const PLANNED_RUIN_EXTERIOR_POLICY=freezeWire({version:PLANNED_RUIN_EXTERIOR_VERSION,parent:'planned-ruin-modular-storybook-v4',pilot:'Small Woodland only',entryTiles:[9,4],entryPassageTiles:3,entranceLocation:'center-of-usable-reservation',frontage:{halfWidthTiles:5,fromThresholdTiles:-4,toThresholdTiles:10,solidRemnantsAllowed:false},naturalScenery:'retain-except-structures-and-explicit-circulation',kit:'ruin-modular-scene-v1',structureIntent:['partial-west-room','rear-west-wing','lateral-collapsed-forecourt'],permanentSiteIdentityVersion:'planned-ruin-family-candidate-v1',interiorRulesChanged:false});
