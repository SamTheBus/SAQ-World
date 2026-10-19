export const CAVE_INTERIOR_NAVIGATION_D12_3A_VERSION='cave-interior-navigation-d12.3a-v1';

export const CAVE_INTERIOR_NAVIGATION_D12_3A=Object.freeze({
 version:CAVE_INTERIOR_NAVIGATION_D12_3A_VERSION,
 memoryTicks:180,
 replanIntervalTicks:18,
 unreachableRetryTicks:90,
 blockedReplanTicks:10,
 arrivalTolerance:10,
 floorFamilyVersion:'functional-site-family-d12-2-v1'
});

export function initialCaveInteriorNavigationD12_3A(tick){
 return {version:CAVE_INTERIOR_NAVIGATION_D12_3A_VERSION,mode:'idle',targetEntityId:null,lastKnownPosition:null,lastSeenTick:null,memoryExpiresTick:null,replanAfterTick:tick,blockedTicks:0};
}
