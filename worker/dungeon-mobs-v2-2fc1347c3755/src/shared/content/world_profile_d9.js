import {freezeWire} from '../contracts/wire.js';
export const D9_PROFILE=freezeWire({
 version:'world-geography-d9-v1',coordinateVersion:'world-address-d9-v1',progressionPolicy:'effective-level-depth-d9-v1',
 chunkWidth:1024,chunkHeight:832,tileSize:32,regionChunks:8,coordinateDigits:256,
 biomes:['woodland','rocky-uplands','marsh'],floorBands:[[1,5],[6,10],[11,20],[21,40],[41,80]],
 lowFloorPercent:20,anomalyPercent:10,originCollarChunks:1,renewalVacancyTicks:18000,
 prepareRadius:768,leaveRadius:960,projectionRadius:900,placementSafetyRadius:384,placementCandidates:64,
 residentRadiusChunks:2,preloadRadiusChunks:3,softActors:24,hardActors:48,
 minimapWidth:128,minimapHeight:96,mapTileBudget:128,
 siteSocketVersion:'site-socket-d9-v1',siteSocketSlots:1,siteSocketChanceDenominator:8
});
