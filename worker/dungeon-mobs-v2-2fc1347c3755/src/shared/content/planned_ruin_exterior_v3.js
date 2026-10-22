import {freezeWire} from '../contracts/wire.js';
// The fitted authored facade has four occupied rows behind the threshold.
// A broad three-tile central doorway remains clear. Sparse rear corners follow
// the original sprite's visible roof outline, rather than allocation rectangles.
export const PLANNED_RUIN_ENTRY_MASK=freezeWire(['111010111','100000001','000111000','000111000']);
export const PLANNED_RUIN_EXTERIOR_VERSION='planned-ruin-centered-storybook-v3';
export const PLANNED_RUIN_EXTERIOR_POLICY=freezeWire({version:PLANNED_RUIN_EXTERIOR_VERSION,parent:'planned-ruin-exterior-doorway-v2',entryTiles:[9,4],entryPassageTiles:3,entryMaskBasis:'authored-facade-visible-mass-with-three-tile-clear-doorway',entranceLocation:'center-of-usable-reservation',naturalScenery:'retain-except-structures-and-explicit-circulation',permanentSiteIdentityVersion:'planned-ruin-family-candidate-v1',interiorRulesChanged:false});
