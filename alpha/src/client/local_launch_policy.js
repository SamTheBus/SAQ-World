export const WORLD_LOCAL_LAUNCHER_KEY = "saq-world-local-launcher-v1";
export const WORLD_LOCAL_LAUNCHER_VERSION = 1;
export const WORLD_SEAMLESS_LAUNCHER_KEY = "saq-world-seamless-launcher-v1";
export const WORLD_PROCEDURAL_LAUNCHER_KEY = "saq-world-procedural-launcher-v1";

const identifier = /^(cmp|ply):[0-9a-f]{32}$/;

function launcherReference(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.keys(value).sort().join(",") !== "campaignId,controllerId,version" ||
      value.version !== WORLD_LOCAL_LAUNCHER_VERSION ||
      !identifier.test(value.campaignId) || !identifier.test(value.controllerId) ||
      !value.campaignId.startsWith("cmp:") || !value.controllerId.startsWith("ply:")) {
    throw new Error("Malformed World launcher record");
  }
  return Object.freeze({ campaignId: value.campaignId, playerId: value.controllerId });
}

export function createLocalLaunchPolicy({ launcherStore, url, launcherKey = WORLD_LOCAL_LAUNCHER_KEY }) {
  if (!url || typeof url.searchParams?.get !== "function") throw new TypeError("Explicit launch URL required");
  function explicitReference() {
    const campaignId = url.searchParams.get("campaign"), playerId = url.searchParams.get("controller");
    if (campaignId === null && playerId === null) return null;
    if (!campaignId || !playerId) throw new Error("Campaign and controller references must be supplied together");
    return launcherReference({ version: 1, campaignId, controllerId: playerId });
  }
  function rememberedReference() {
    if (!launcherStore) return null;
    let text;
    try { text = launcherStore.getItem(launcherKey); }
    catch (error) { throw new Error("World launcher storage unavailable", { cause: error }); }
    if (text === null) return null;
    if (typeof text !== "string" || text.length > 512) throw new Error("Malformed World launcher record");
    try { return launcherReference(JSON.parse(text)); }
    catch (error) {
      if (error.message === "Malformed World launcher record") throw error;
      throw new Error("Malformed World launcher record", { cause: error });
    }
  }
  function select() {
    const explicit = explicitReference();
    if (explicit) return Object.freeze({ source: "explicit", resume: explicit });
    const remembered = rememberedReference();
    return Object.freeze({ source: remembered ? "remembered" : "fresh", resume: remembered });
  }
  function remember({ campaignId, playerId }) {
    const record = launcherReference({ version: 1, campaignId, controllerId: playerId });
    if (!launcherStore) return false;
    try { launcherStore.setItem(launcherKey, JSON.stringify({
      version: WORLD_LOCAL_LAUNCHER_VERSION, campaignId: record.campaignId, controllerId: record.playerId })); }
    catch (error) { throw new Error("World launcher storage unavailable", { cause: error }); }
    return true;
  }
  function forget() {
    if (!launcherStore) return false;
    try { launcherStore.removeItem(launcherKey); }
    catch (error) { throw new Error("World launcher storage unavailable", { cause: error }); }
    return true;
  }
  function cleanUrl() {
    const clean = new URL(url.href);
    clean.searchParams.delete("campaign"); clean.searchParams.delete("controller");
    return clean;
  }
  return Object.freeze({ select, remember, forget, cleanUrl });
}

export function classifyLocalLaunchError(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (/Saved activity campaign missing/.test(message)) return Object.freeze({code:'campaign-not-found',title:'Saved campaign is not in this app',detail:'The resume reference exists, but its campaign is absent from this app’s database. Chrome and an installed Home Screen app can use separate storage. Try the app or browser where you created the campaign. Retry does not erase data or create a different world.'});
  if (/supplied together|Malformed World launcher/.test(message)) return Object.freeze({ code: "malformed-launch", title: "Launch reference is malformed", detail: "The campaign/controller launch reference is incomplete or invalid." });
  if (/Campaign not found/.test(message)) return Object.freeze({ code: "campaign-not-found", title: "Campaign not found", detail: "This launch reference is not present in this browser storage context." });
  if (/controller|Controller|player selection|member of this campaign/.test(message)) return Object.freeze({ code: "controller-mismatch", title: "Controller unavailable", detail: "The saved controller no longer belongs to this campaign." });
  if (/fingerprint|Unsupported|unsupported|schema|version/i.test(message)) return Object.freeze({ code: "incompatible-campaign", title: "Campaign is from an incompatible build", detail: "This prototype campaign cannot be opened by the current World content contract." });
  if (/storage|IndexedDB|database|blocked/i.test(message)) return Object.freeze({ code: "storage-unavailable", title: "World storage unavailable", detail: "The browser could not open the SAQ World campaign database." });
  if (/Malformed|canonical|Invalid|Unexpected|JSON|wire|corrupt/i.test(message)) return Object.freeze({ code: "malformed-campaign", title: "Campaign data is malformed", detail: "The saved campaign record failed validation." });
  return Object.freeze({ code: "startup-failed", title: "World could not start", detail: message });
}
