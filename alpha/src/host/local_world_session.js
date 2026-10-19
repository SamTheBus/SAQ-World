import { createClientFixture } from "../shared/contracts/client_fixture.js";
import { createId, validateId } from "../shared/contracts/identities.js";
import { createCampaignAuthority } from "./campaign_authority.js";
import { createWorldClientPort } from "./world_client_port.js";
import { requireContract } from "../shared/contracts/wire.js";
import { createRandomSeed, normalizeSeedInput } from "../shared/contracts/seed.js";
import { parseCampaignEnvelope } from "../shared/contracts/checkpoint.js";
import { verifyPersistedEnvelope } from "../storage/campaign_store.js";
import { manifestForState } from "../shared/contracts/overworld.js";

export async function createLocalWorldSession({ sha256, nextToken, storeFactory, scenario = "fixture", manualPrimary = false,
  resume = null, seedInput = null, entropy = null, now = () => 0 }) {
  let created,initialState,generationDiagnostics=null;
  const started=now();
  if(scenario==="procedural"&&resume){
    validateId("campaignId",resume.campaignId);validateId("playerId",resume.playerId);
    const text=await storeFactory(null).loadCampaign(resume.campaignId);requireContract(text!==null,"Campaign not found");
    const parsed=parseCampaignEnvelope(text),expectedContentFingerprint=parsed.snapshot.state.content.fingerprint;
    const checked=await verifyPersistedEnvelope(parsed,{sha256,expectedContentFingerprint});
    requireContract(manifestForState(checked.snapshot.state)?.sourceKind==="generated-campaign","No B1/X-B1 save migration to procedural campaigns");
    initialState=checked.snapshot.state;
  }else{
    const campaignSeed=scenario==="procedural"?(seedInput===null?await createRandomSeed({entropy}):await normalizeSeedInput(seedInput,{sha256})):null;
    created=await createClientFixture({ sha256, nextToken, scenario, manualPrimary, campaignSeed });initialState=created.initialState;
    if(created.generationDiagnostics)generationDiagnostics=Object.freeze({...created.generationDiagnostics,generationDurationMs:Math.max(0,now()-started)});
  }
  const localPlayerId = resume ? validateId("playerId", resume.playerId) : created.localPlayerId;
  if (resume) validateId("campaignId", resume.campaignId);
  const store = storeFactory(initialState.content.fingerprint);
  const authority = createCampaignAuthority({ initialState, store, sha256, nextToken, allowSafeTravel: true,
    expectedContentFingerprint: initialState.content.fingerprint });
  if (resume&&scenario!=="procedural") {
    await authority.loadCampaign(resume.campaignId);
    requireContract(authority.readState().playersById[localPlayerId], "Resume controller is not a member of this campaign");
  }
  if(resume&&scenario==="procedural")requireContract(initialState.playersById[localPlayerId],"Resume controller is not a member of this campaign");
  const result = resume ? await authority.loadFreshCampaign(resume.campaignId) :
    await authority.createCampaign({ transactionId: createId("transactionId", nextToken("transactionId")),
      checkpointId: createId("checkpointId", nextToken("checkpointId")) });
  if (result.status !== "committed") throw new Error("Cannot open local campaign: "+result.status+(result.reason?": "+result.reason:""));
  if (resume) authority.reconnectController(localPlayerId, authority.controllerWatermark(localPlayerId));
  const clientPort = createWorldClientPort({ authority, localPlayerId });
  return Object.freeze({ clientPort, generationDiagnostics, step: () => {
    if (["safe","encounter"].includes(authority.getPersistenceStatus().phase)) authority.advanceCommandTick();
  } });
}
