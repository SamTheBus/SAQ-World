import { freezeWire, requireContract } from "../shared/contracts/wire.js";
import { SLIME_CLEARING, proofClearingForState } from "../shared/contracts/encounter_proof.js";
import { activeTravelSpace } from "../shared/contracts/travel.js";
import { areaAtWorldPosition, isWorldPointSafe, manifestForState, semanticPlaceAtWorldPosition, technicalChunkId } from "../shared/contracts/overworld.js";
import { appliedClientSequence } from "../shared/contracts/history.js";

export function createWorldClientPort({ authority, localPlayerId }) {
  let cachedManifestHash=null,cachedFixture=null,cachedState=null,cachedStatusKey=null,cachedTravelKey=null,cachedModel=null;
  const readClientState=()=>authority.readClientState?.()??authority.readState();
  function getReadModel() {
    const state=readClientState();
    requireContract(state.playersById[localPlayerId],"Selected local controller missing");
    const persistence=authority.getPersistenceStatus(),travel=authority.getTravelResult();
    const statusKey=`${persistence.phase}/${persistence.pendingTransactionId}/${persistence.confirmedSaveRevision}/${persistence.confirmedCheckpointId}`;
    const travelKey=travel?`${travel.status}/${travel.reason??""}/${travel.requestId}/${travel.sessionId}/${travel.spaceInstanceId}/${travel.spaceRevision}`:"";
    if(state===cachedState&&statusKey===cachedStatusKey&&travelKey===cachedTravelKey)return cachedModel;
    const manifest=manifestForState(state);
    if(manifest&&manifest.manifestHash!==cachedManifestHash){cachedFixture=activeTravelSpace(state);cachedManifestHash=manifest.manifestHash;}
    const fixture=manifest?cachedFixture:activeTravelSpace(state);
    const exits=freezeWire((fixture.exits??[fixture.exit]).map(e=>({exitId:e.exitId,x:e.x,y:e.y,radius:e.radius,label:e.label??null})));
    const playersById={},entitiesById={};
    for(const [id,player] of Object.entries(state.playersById))playersById[id]={entityId:player.entityId};
    for(const [id,actor] of Object.entries(state.space.entitiesById))entitiesById[id]={
      position:{...actor.position},hp:{...actor.hp},maxHp:{...actor.maxHp},alive:actor.alive,
      hullRadius:actor.hullRadius,movedLastTick:actor.movedLastTick,team:actor.team};
    const localActor=state.space.entitiesById[state.playersById[localPlayerId].entityId];
    const currentArea=manifest&&areaAtWorldPosition(manifest,localActor.position);
    const currentPlace=manifest&&semanticPlaceAtWorldPosition(manifest,localActor.position);
    const clearing=state.campaign.encounterProof&&proofClearingForState(state);
    const context=freezeWire({protocolVersion:state.protocolVersion,campaignId:state.campaign.campaignId,sessionId:state.session.sessionId,
      spaceInstanceId:state.space.spaceInstanceId,spaceRevision:state.space.spaceRevision,
      nextClientSequence:appliedClientSequence(state,localPlayerId)+1});
    // Collision, visual and manifest arrays are immutable authority/content
    // values. Sharing them avoids copying the complete world projection.
    const discovery=state.campaign.overworld?.discovery;
    const discoveryCount=manifest?.manifestVersion===2?discovery.discoveredRegionIds.length+discovery.discoveredSettlementIds.length+discovery.discoveredSiteIds.length:
      discovery?.visitedAreaIds.length;
    const discoveryTotal=manifest?.manifestVersion===2?manifest.regions.length+manifest.settlements.length+manifest.sites.length:manifest?.chunks.length;
    const space=Object.freeze({spaceId:fixture.spaceId,label:currentPlace?.label??currentArea?.label??fixture.label,collision:state.space.collision,
      ...(exits.length?{exit:exits[0]}:{}),exits,
      ...(fixture.visual?{visual:fixture.visual,
        settlementSafe:manifest?isWorldPointSafe(manifest,localActor.position):fixture.safety.settlementSafe,
        visitedCount:manifest?discoveryCount:state.campaign.geography.visitedSpaceIds.length,visitedTotal:manifest?discoveryTotal:state.campaign.geography.spaces?.length??10,
        ...(manifest?{overworld:Object.freeze({manifestId:manifest.manifestId,manifestHash:manifest.manifestHash,
          currentAreaId:currentArea?technicalChunkId(currentArea):null,currentPlaceId:currentPlace?.placeId??null,
          manifestVersion:manifest.manifestVersion,seedHex:manifest.generation?.seedHex??null,generatorVersion:manifest.generation?.generatorVersion??null,
          chunks:manifest.chunks,seams:manifest.seams,safeRegions:manifest.safeRegions,
          ...(manifest.manifestVersion===2?{regions:manifest.regions,settlements:manifest.settlements,corridors:manifest.corridors,sites:manifest.sites}: {})})}:{})}:{}),
    });
    const primary=state.primary?freezeWire({actorsById:Object.fromEntries(Object.entries(state.primary.actorsById).map(([id,a])=>[id,{
      facing:a.facing,current:a.current?{comboStep:a.current.comboStep,phase:a.current.phase,phaseStartedTick:a.current.phaseStartedTick,
        phaseEndsTick:a.current.phaseEndsTick,aim:a.current.aim,primaryActionId:a.current.primaryActionId}:null,
      held:a.heldCommandId!==null,queued:a.queuedCommandId!==null,nextComboStep:a.nextComboStep,comboDeadline:a.comboDeadline}])),
      events:authority.readPresentationEvents()}):null;
    const encounter=state.primary&&state.campaign.encounterProof?freezeWire({cleared:state.campaign.encounterProof.cleared,
      active:state.space.encounterId!==null,label:SLIME_CLEARING.label,
      activation:state.space.spaceId===clearing.spaceId?clearing.activation:null}):null;
    cachedModel=Object.freeze({localPlayerId,playersById:freezeWire(playersById),entitiesById:freezeWire(entitiesById),tick:state.tick,
      context,space,...(primary?{primary,encounter}:{}),persistence,
      travel:travel?freezeWire({status:travel.status,reason:travel.reason??null,requestId:travel.requestId,
        sessionId:travel.sessionId,spaceInstanceId:travel.spaceInstanceId,spaceRevision:travel.spaceRevision}):null});
    cachedState=state;cachedStatusKey=statusKey;cachedTravelKey=travelKey;
    return cachedModel;
  }
  requireContract(readClientState().playersById[localPlayerId],"Explicit local player selection required");
  return Object.freeze({getReadModel,send:(command)=>{
    requireContract(["movement.setIntent","space.travel","combat.primaryIntent"].includes(command.kind),"Unsupported World client command");
    const admitted=authority.createControllerPort(localPlayerId).send(command);
    authority.drainCommands();
    return admitted;
  },reconcile:()=>authority.reconcile()});
}
