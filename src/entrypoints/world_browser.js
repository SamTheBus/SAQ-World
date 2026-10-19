import { createLocalAuthorityHost } from "../host/local_authority_host.js";
import { mountWorldBrowserClient } from "../client/world_browser_client.js";
export { createLocalIndexedDbCampaignStore } from "../storage/local_indexeddb_campaign_store.js";

// Composition boundary. Importing it alone never starts an application.
export function mountWorldBoundary(statusElement) {
  const authority = createLocalAuthorityHost();
  return mountWorldBrowserClient({
    view: authority.clientView,
    statusElement,
  });
}
