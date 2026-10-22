import {validatePlannedBinding} from '../shared/generation/planned_world_foundation_v1.js';

// Presentation identity follows the validated terrain asset, not inspection
// coordinates. This never changes a campaign binding or selects world content.
export function hybridArtTerrainBinding(binding){
 validatePlannedBinding(binding);
 const geometry={};
 for(const key of ['version','assetId','assetHash','planHash','routeHash','planningHash','physicalHash'])geometry[key]=binding[key];
 return Object.freeze({version:'hybrid-art-terrain-binding-v1',kitId:'hybrid-art-v2',geometry:Object.freeze(geometry),coverage:'compatible-terrain',supportedBiomeCodes:Object.freeze(['w','a'])});
}
