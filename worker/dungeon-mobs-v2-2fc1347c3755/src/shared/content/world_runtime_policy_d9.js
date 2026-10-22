// Technical admission budgets, independent of immutable geography/content policy.
// Reaching a preparation bound defers work; it never deletes owned items or
// clamps a gameplay value. A new budget policy can be versioned separately.
export const D9_RUNTIME_POLICY=Object.freeze({
 version:'world-residency-policy-d9-v1',residentChunks:100,preparedChunks:196,
 residentActors:192,residentGroups:80,proceduralGroups:64,frames:5,
 handoffChunks:8,evictChunks:4,generationBatch:2,dirtyPages:256,flushPages:128,
 projectedDropsPerParticipant:128,groundItemsPerCell:64,groundTransferItems:256,
 occupancyRadius:1500,navigationPendingPages:128,navigationFlushPages:2,
 mapOverviewLevels:12,mapViewportCells:64,garbageCollectionPages:32
});
