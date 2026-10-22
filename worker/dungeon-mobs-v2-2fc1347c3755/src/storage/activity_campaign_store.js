import {validateD8Advance} from '../shared/contracts/participant_progression.js';
import {D6_ACTIVITY_FORMAT} from '../shared/contracts/subweapon_inventory.js';
import {encounterAdvanced,validateEncounterEconomyProgress} from '../shared/contracts/encounter_economy.js';
import { LEGACY_D4_ACTIVITY_FORMAT, D4_ACTIVITY_FORMAT, validateInventoryProgress } from '../shared/contracts/player_inventory.js';
import { validatePlayerRespawnProgress } from '../shared/contracts/player_respawn.js';
import { createCampaignStoreTransactions } from './campaign_store_core.js';
import { createActivityState, upgradeActivityState } from '../shared/contracts/activity_state.js';
import { D3_ACTIVITY_FORMAT } from '../shared/contracts/player_progression.js';
import { freezeWire, copyWire, canonicalStringify, closedRecord, requireContract, safeInteger, validateWire } from '../shared/contracts/wire.js';
import { validateId } from '../shared/contracts/identities.js';
import { validateHex, bytesToHex, hashBytes, utf8 } from '../shared/contracts/hashing.js';
import { verifyContentFingerprint } from '../shared/content/index.js';
import {siteResetTransitionsD13C,validateSiteRunEpisodeProgressD13B} from '../shared/contracts/site_run_episode_d13b.js';
import { manifestForState, validateOverworldDiscoveryProgress } from '../shared/contracts/overworld.js';
import { compileBoundOverworld, verifyBoundOverworldGeometry } from '../shared/content/overworld_fixture_catalog.js';
const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
export function activityGeneration(state){const m=manifestForState(state);return freezeWire({seed:state.campaign.seed,generatorVersion:m.generation.generatorVersion,manifestId:m.manifestId,manifestHash:m.manifestHash});}
export function validateActivityCut(cut){validateWire(cut);closedRecord(cut,['generation','snapshot']);closedRecord(cut.snapshot,['state']);const state=createActivityState(cut.snapshot.state);
  requireContract(same(cut.generation,activityGeneration(state)),'Immutable generated-world binding mismatch');return cut;}
export function validateActivityEnvelope(e){validateWire(e);closedRecord(e,['format','checkpointVersion','campaignId','saveRevision','checkpointId','kind','cutHash','cut']);requireContract(e.format==='saq-world-activity-cut'&&e.checkpointVersion===1,'Unsupported activity cut; no automatic migration');
  validateId('campaignId',e.campaignId);validateId('checkpointId',e.checkpointId);safeInteger(e.saveRevision);validateHex(e.cutHash,32);validateActivityCut(e.cut);
  for(const k of ['campaignId','saveRevision','checkpointId'])requireContract(e[k]===e.cut.snapshot.state.campaign[k],'Cut identity mismatch');
  requireContract(['campaignCreated','pluralCut'].includes(e.kind)&&(e.kind==='campaignCreated')===(e.saveRevision===0),'Invalid cut kind/revision');return e;}
export function validateActivityProposal(p){validateWire(p);closedRecord(p,['transactionVersion','transactionId','campaignId','expectedSaveRevision','kind','envelope']);requireContract(p.transactionVersion==='activity-cut-1','Unsupported transaction');validateId('transactionId',p.transactionId);validateActivityEnvelope(p.envelope);
  if(p.expectedSaveRevision!==null)safeInteger(p.expectedSaveRevision);requireContract(p.campaignId===p.envelope.campaignId&&p.kind===p.envelope.kind&&p.envelope.saveRevision===(p.expectedSaveRevision===null?0:p.expectedSaveRevision+1)&&(p.expectedSaveRevision===null)===(p.kind==='campaignCreated'),'Invalid activity CAS');return p;}
export function validateActivityProgress(a,b){validateActivityEnvelope(a);validateActivityEnvelope(b);const x=upgradeActivityState(a.cut.snapshot.state),y=upgradeActivityState(b.cut.snapshot.state);
  const formats=['saq-world-activity-1',D3_ACTIVITY_FORMAT,LEGACY_D4_ACTIVITY_FORMAT,D4_ACTIVITY_FORMAT,D6_ACTIVITY_FORMAT];requireContract(formats.indexOf(b.cut.snapshot.state.format)>=formats.indexOf(a.cut.snapshot.state.format),'Progression format regressed');
  requireContract(a.campaignId===b.campaignId&&b.saveRevision>a.saveRevision&&same(a.cut.generation,b.cut.generation),'Generated world/revision changed');
  for(const k of ['content','session','spacesByInstanceId','overworldInstanceId','proofCase'])requireContract(same(x[k],y[k]),'Immutable campaign registry changed');
  requireContract(same(Object.keys(x.playersById).sort(),Object.keys(y.playersById).sort()),'Participant inventory changed');
  const resets=siteResetTransitionsD13C(x,y),addedEntities=resets.flatMap(row=>row.newEntityIds),addedGroups=resets.flatMap(row=>row.newGroupIds),retiredEntities=new Set(resets.flatMap(row=>row.retiredEntityIds)),retiredGroups=new Set(resets.flatMap(row=>row.retiredGroupIds));
  for(const [id,p] of Object.entries(x.playersById)){const {progression:before,inventory:oldInventory,d8:oldD8,...identity}=p,{progression:after,inventory:newInventory,d8:newD8,...nextIdentity}=y.playersById[id],comparableD8=copyWire(oldD8);for(const entityId of retiredEntities)delete comparableD8.causalXp[entityId];requireContract(same(identity,nextIdentity)&&after.totalXp>=before.totalXp,'Participant identity/progression regressed');validateD8Advance(comparableD8,newD8,before.level,after.level,x.lastAppliedAuthorityOrder);}
  requireContract(same(x.campaign.charactersById,y.campaign.charactersById)&&same([...Object.keys(x.entitiesById).filter(id=>!retiredEntities.has(id)),...addedEntities].sort(),Object.keys(y.entitiesById).sort())&&same([...Object.keys(x.groupsById).filter(id=>!retiredGroups.has(id)),...addedGroups].sort(),Object.keys(y.groupsById).sort()),'Canonical identity inventory changed');
  requireContract(y.tick>=x.tick&&y.identitySequence>=x.identitySequence&&y.lastAppliedAuthorityOrder>=x.lastAppliedAuthorityOrder&&y.eventEmission.lastEventSequence>=x.eventEmission.lastEventSequence,'Cut chronology regressed');
  for(const [id,r] of Object.entries(x.campaign.sitesById??{})){const next=y.campaign.sitesById?.[id];requireContract(next?.spaceInstanceId===r.spaceInstanceId&&(r.conqueredTick===null||next.conqueredTick===r.conqueredTick),'Conquest history regressed');}
  validateOverworldDiscoveryProgress(x.campaign.overworld,y.campaign.overworld,manifestForState(y));
  validateEncounterEconomyProgress(x,y);validateSiteRunEpisodeProgressD13B(x,y);
  for(const [id,g] of Object.entries(x.groupsById)){if(retiredGroups.has(id)){requireContract(!y.groupsById[id],'Retired group remained canonical');continue;}const h=y.groupsById[id],renewed=encounterAdvanced(x,y,id);requireContract(same({...g,cleared:false,lastRequiredTick:null,threatSnapshot:null,threatReady:false},{...h,cleared:false,lastRequiredTick:null,threatSnapshot:null,threatReady:false})&&(!g.cleared||h.cleared||renewed),'Group identity/clear regressed');requireContract(g.lastRequiredTick===null||h.lastRequiredTick!==null&&h.lastRequiredTick>=g.lastRequiredTick,'Group relevance history regressed');
    // Historical D2 transactions contain no frozen progression snapshot. Compare
    // those under their original contract; enforce snapshots when the successor is D3.
    if([D3_ACTIVITY_FORMAT,LEGACY_D4_ACTIVITY_FORMAT,D4_ACTIVITY_FORMAT,D6_ACTIVITY_FORMAT].includes(b.cut.snapshot.state.format)&&g.threatSnapshot){requireContract(h.threatSnapshot&&h.threatSnapshot.activatedTick>=g.threatSnapshot.activatedTick,'Threat history regressed');
      if(g.siteId!==null)requireContract(same(g.threatSnapshot,h.threatSnapshot),'Site encounter rescaled');
      for(const entityId of g.entityIds)if(!renewed&&!x.entitiesById[entityId].alive)requireContract(g.threatSnapshot.levelsByEntityId[entityId]===h.threatSnapshot.levelsByEntityId[entityId],'Defeated threat changed');}}
  for(const [id,actor] of Object.entries(x.entitiesById)){if(retiredEntities.has(id)){requireContract(actor.team==='hostile'&&!y.entitiesById[id],'Invalid actor retirement');continue;}const next=y.entitiesById[id],renewed=Object.values(x.groupsById).some(g=>g.entityIds.includes(id)&&!retiredGroups.has(g.groupId)&&encounterAdvanced(x,y,g.groupId));requireContract(next.residency.residencyRevision>=actor.residency.residencyRevision&&(actor.team==='party'||!next.alive||actor.alive||renewed),'Actor resurrected/context regressed');if(next.residency.residencyRevision===actor.residency.residencyRevision)requireContract(next.residency.spaceInstanceId===actor.residency.spaceInstanceId,'Residence changed without revision');}
  validatePlayerRespawnProgress(x,y);
  validateInventoryProgress(x,y);
  for(const id of x.session.playerIds)requireContract(y.appliedClientSequences[id]>=x.appliedClientSequences[id],'Applied cursor regressed');return b;}
const transition=(a,b)=>{requireContract(b.saveRevision===a.saveRevision+1&&a.checkpointId!==b.checkpointId,'Invalid successor');return validateActivityProgress(a,b);};
const digest=async(cut,sha256,measure=(_name,fn)=>fn())=>bytesToHex(await hashBytes(utf8(measure('saveSerialize',()=>canonicalStringify(cut))),sha256));
export const parseActivityEnvelope=text=>freezeWire(validateActivityEnvelope(JSON.parse(text)));
export const serializeActivityEnvelope=e=>canonicalStringify(validateActivityEnvelope(e));
export async function createActivityEnvelope(cut,kind,{sha256,measure}){cut=freezeWire(validateActivityCut(cut));const c=cut.snapshot.state.campaign;return freezeWire(validateActivityEnvelope({format:'saq-world-activity-cut',checkpointVersion:1,campaignId:c.campaignId,saveRevision:c.saveRevision,checkpointId:c.checkpointId,kind,cutHash:await digest(cut,sha256,measure),cut}));}
export async function verifyActivityEnvelope(e,{sha256,expectedContentFingerprint,expectedGenerationBinding,measure}){e=freezeWire(validateActivityEnvelope(e));expectedGenerationBinding=freezeWire(expectedGenerationBinding);requireContract(same(e.cut.generation,expectedGenerationBinding)&&e.cut.snapshot.state.content.fingerprint===expectedContentFingerprint,'Unsupported immutable campaign identity');
  await verifyContentFingerprint(e.cut.snapshot.state.content,{sha256});requireContract(e.cutHash===await digest(e.cut,sha256,measure),'Cut digest mismatch');
  const s=e.cut.snapshot.state;await verifyBoundOverworldGeometry({...s,space:{collision:s.spacesByInstanceId[s.overworldInstanceId].collision}},{sha256});const compiled=compileBoundOverworld(s);requireContract(same(compiled.collision,s.spacesByInstanceId[s.overworldInstanceId].collision),'Stored collision differs from authoritative manifest');return freezeWire(e);}
export const activityCutAtRevision=(cut,saveRevision,checkpointId)=>{const next=copyWire(cut);Object.assign(next.snapshot.state.campaign,{saveRevision,checkpointId});return freezeWire(validateActivityCut(next));};
export const activityCampaignTransactions=createCampaignStoreTransactions({validateTransactionProposal:validateActivityProposal,validateCampaignEnvelope:validateActivityEnvelope,validateCheckpointTransition:transition,serializeCampaignEnvelope:serializeActivityEnvelope,verifyPersistedEnvelope:verifyActivityEnvelope,
  reservationIdentities:p=>[{identityKind:'checkpointId',identityId:p.envelope.checkpointId}]});
export const activityCampaignCodec=Object.freeze({...activityCampaignTransactions,parseCampaignEnvelope:parseActivityEnvelope,serializeCampaignEnvelope:serializeActivityEnvelope,validateTransactionProposal:validateActivityProposal});
