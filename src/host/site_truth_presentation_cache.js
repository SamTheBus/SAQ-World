// Presentation cache only. Authority admission, validation and discovery keep
// their normal paths. The fingerprint includes every mutable input consumed
// by the non-finale truth projection; no tick/actor position affects it.
export function createSiteTruthPresentationCache(resolve){
 let priorState=null,priorContent=null,key=null,value=null;
 return state=>{
  const w=state.d9World,next=JSON.stringify({
   chunks:(w?.runtime.chunks??[]).map(c=>[c.chunkX,c.chunkY]),
   reservations:Object.entries(w?.siteReservationsById??{}).map(([id,r])=>[id,r.packageId,r.socket,r.parcel?.label,r.parcel?.tier,r.parcel?.regionName,r.parcel?.layoutSeed,r.parcel?.pages,r.parcel?.roadAnchor,r.parcel?.placementProvenance]),
   sites:Object.entries(w?.functionalSitesById??{}).map(([id,s])=>[id,s.packageId,s.packageVersion,s.socket,s.label,s.regionName,s.siteKind,s.familyId,s.sizeTier,s.floorCount,s.layoutSeed,s.conqueredTick,s.compound?.pages,s.interior?.contentHash]),
   proofCase:state.proofCase,historicalProgress:state.campaign?.sitesById
  });
  if(state!==priorState||state.content!==priorContent||next!==key){value=resolve(state);priorState=state;priorContent=state.content;key=next;}
  return value;
 };
}
