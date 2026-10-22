import {freezeWire} from '../contracts/wire.js';
// Exterior-only successor. Permanent reservation/site seeds and interior rules
// retain planned-ruin-family-candidate-v1. New chunk geometry has its own domain.
export const PLANNED_RUIN_EXTERIOR_VERSION='planned-ruin-exterior-doorway-v2';
export const PLANNED_RUIN_ENTRY_MASK=freezeWire(['000000000','000000000','000111000','000111000','000111000','001111100','001111100','011111110']);
export const PLANNED_RUIN_EXTERIOR_POLICY=freezeWire({version:PLANNED_RUIN_EXTERIOR_VERSION,legacyGeometry:'woodland-ruin-exterior-d11.3.2-v1',legacyArt:'ruin-art-d11.3',entryTiles:[9,8],entryPassageTiles:3,permanentSiteIdentityVersion:'planned-ruin-family-candidate-v1',small:'compact-ruined-building-with-scattered-remnants',standard:'ruined-building-and-partial-courtyard',variation:'campaign-seed-plus-reservation-domain-no-mutable-rng',interiorRulesChanged:false});
