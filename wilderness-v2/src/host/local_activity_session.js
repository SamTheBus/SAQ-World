import {FORGE_REVIEW_BUILD,ACTIVITY_SAVE_NAMESPACE} from '../shared/content/forge_review.js';
import {fundForgeReview} from '../shared/contracts/forge_economy.js';
import {upgradeActivityState} from '../shared/contracts/activity_state.js';
import {copyWire} from '../shared/contracts/wire.js';
import { createActivityFixture } from '../shared/contracts/activity_fixture.js';
import { normalizeSeedInput, createRandomSeed } from '../shared/contracts/seed.js';
import { createId } from '../shared/contracts/identities.js';
import { canonicalStringify, requireContract } from '../shared/contracts/wire.js';
import { createActivityAuthority } from './activity_authority.js';
import { createExactCutAuthority } from './exact_cut_authority_core.js';
import { activityGeneration, validateActivityCut, activityCutAtRevision, parseActivityEnvelope, validateActivityProgress, createActivityEnvelope, verifyActivityEnvelope, activityCampaignTransactions, activityCampaignCodec } from '../storage/activity_campaign_store.js';
import { createActivityClientPort } from './activity_client_port.js';
export const ACTIVITY_DATABASE_NAME=ACTIVITY_SAVE_NAMESPACE;
export function createActivityCampaignAuthority({initialState,store,nextToken,sha256,measure,resumeReference=false,schedulerOptions,durabilityTask=null}){
  const generation=activityGeneration(initialState);
  return createExactCutAuthority({initialCut:{generation,snapshot:{state:initialState}},store,nextToken,sha256,expectedGenerationBinding:generation,resumeReference,durabilityTask,measure,
    createAuthority:({initialState})=>createActivityAuthority({initialState,measure,schedulerOptions}),validatePluralCut:validateActivityCut,pluralCutAtRevision:activityCutAtRevision,parsePluralEnvelope:parseActivityEnvelope,sameProofValue:(a,b)=>canonicalStringify(a)===canonicalStringify(b),validatePluralProgress:validateActivityProgress,createPluralEnvelope:createActivityEnvelope,verifyPluralEnvelope:verifyActivityEnvelope,pluralCampaignTransactions:activityCampaignTransactions,transactionVersion:'activity-cut-1',metadataForCut:cut=>({generation:cut.generation})});
}
export async function createLocalActivitySession({sha256,nextToken,entropy,seedInput,resume,storeFactory,proofCase='A',measure,durabilityTask=null}){
  let initialState,localPlayerId,generationDiagnostics=null,store;
  if(resume){store=storeFactory(null,null,activityCampaignCodec);const text=await store.loadLatestCheckpoint(resume.campaignId);requireContract(text,'Saved activity campaign missing');
    const envelope=parseActivityEnvelope(text);initialState=envelope.cut.snapshot.state;localPlayerId=resume.playerId;
    requireContract(initialState.proofCase===proofCase&&initialState.playersById[localPlayerId],'Stored proof case/controller mismatch');
  }else {if(FORGE_REVIEW_BUILD&&!seedInput)seedInput='text:WORLD-D5-FORGE-REVIEW';const campaignSeed=seedInput?await normalizeSeedInput(seedInput,{sha256}):await createRandomSeed({entropy});const standardWorld=['A','F','G','H','I','J','K','L','M','N','O'].includes(proofCase),fixture=await createActivityFixture({sha256,nextToken,campaignSeed,proofCase,populationEnabled:standardWorld,sitesEnabled:standardWorld});({initialState,localPlayerId,generationDiagnostics}=fixture);if(FORGE_REVIEW_BUILD)initialState=fundForgeReview(copyWire(upgradeActivityState(initialState)));}
  store=storeFactory(initialState.content.fingerprint,activityGeneration(initialState),activityCampaignCodec);
  const authority=createActivityCampaignAuthority({initialState,store,nextToken,sha256,measure,resumeReference:Boolean(resume),durabilityTask});
  const checkpoint=()=>authority.commitCut({transactionId:createId('transactionId',nextToken()),checkpointId:createId('checkpointId',nextToken())});
  if(resume)await authority.loadCampaign();else requireContract((await checkpoint()).status==='committed','Could not create durable campaign');
  await store.writeLocalLauncher?.(proofCase,{campaignId:initialState.campaign.campaignId,playerId:localPlayerId});
  const clientPort=createActivityClientPort({authority,localPlayerId,measure});
  let pendingSave=null,saveAgain=false,lastSaveError=null,lastClearCount=authority.withAuthority(a=>a.clearedGroupCount());
  const lifecycleKey=()=>authority.withAuthority(a=>a.withAuthorityState(s=>s.session.playerIds.map(id=>`${s.entitiesById[s.playersById[id].entityId].alive}/${s.playerRespawnsById?.[id]?.count??0}/${s.playersById[id].inventory?.revision??0}/${s.playersById[id].d8?.lastChange?.authorityOrder??0}`).join('|')+'/'+(s.encounterEconomy?.revision??0)));
  let lastLifecycle=lifecycleKey();
  // A manual save waits for the latest coalesced cut, not an older in-flight cut.
  function save(){if(pendingSave){saveAgain=true;return pendingSave;}pendingSave=(async()=>{let result;do{saveAgain=false;result=await checkpoint();lastSaveError=result.status==='committed'?null:result.status;}while(saveAgain&&result.status==='committed'&&authority.getStatus().phase==='ready');return result;})().catch(e=>{lastSaveError=e.message;return {status:'failed'};}).finally(()=>{pendingSave=null;});return pendingSave;}

  return Object.freeze({clientPort,authority,generationDiagnostics,save,saveStatus:()=>({pending:Boolean(pendingSave),error:lastSaveError}),step:()=>{if(authority.getStatus().phase==='ready'){authority.advanceOneTick();const cleared=authority.withAuthority(a=>a.clearedGroupCount()),life=lifecycleKey();if(cleared>lastClearCount||life!==lastLifecycle){lastClearCount=cleared;lastLifecycle=life;void save();}}},resources:()=>authority.withAuthority(a=>({...a.resources(),...clientPort.resources()}))});
}
