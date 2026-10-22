import {freezeWire} from '../contracts/wire.js';
export const MULTIROOM_VERSION='core-families-multiroom-v1';
export const MULTIROOM_POLICY=freezeWire({version:MULTIROOM_VERSION,parentRuntime:'c224c9e8b940ebab',floors:{small:1,standard:2,large:3,deep:4},rooms:{small:[4,5],standard:[5,6],large:[6,7],deep:[7,8]},maximumAttempts:48,minimumStairRouteTiles:32,minimumStairRoomEdges:3,corridorWidthTiles:5,maximumFloorTiles:[80,44],allowQuarterTurn:true,wholeFloorOccupancyRadius:1500,maximumOrdinaryActorsPerFloor:5,encounterCounts:{fort:3,ruin:{small:2,standard:3,large:4,deep:5},crypt:{small:3,standard:4,large:4,deep:4}},preserveGearProvenanceRosterCounts:true,exteriorAndSiteIdentitiesUnchanged:true,stairSelection:'farthest-safe-room-by-walkable-route-with-optional-branch',generation:'seeded-connected-room-graph-family-grammar',oldSaveMigration:false});
export const MULTIROOM_HASH='da5bdc04ec8045a117ddaad78525e60abccc860feb723f49d9b56cc54d900d51';
export const usesMultiroom=b=>b?.interiorGeneration===MULTIROOM_VERSION&&b.interiorGenerationHash===MULTIROOM_HASH;
export const multiroomLinks=tier=>Array.from({length:MULTIROOM_POLICY.floors[tier]},(_,i)=>({up:i?i-1:null,down:i+1<MULTIROOM_POLICY.floors[tier]?i+1:null}));
export const multiroomPolicy=tier=>({floors:Array.from({length:MULTIROOM_POLICY.floors[tier]},(_,i)=>({role:'floor-'+i}))});
