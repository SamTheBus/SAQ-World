import {WORLD_REF_STORE} from './world_page_refs_d9.js';
import { prepareTransaction, decideTransaction, requiredIdentityReservations, validateCommittedResult } from "./campaign_store.js";
import { parseCampaignEnvelope, serializeCampaignEnvelope, validateTransactionProposal } from "../shared/contracts/checkpoint.js";
import { validateId } from "../shared/contracts/identities.js";
import { canonicalStringify, requireContract } from "../shared/contracts/wire.js";
import {createWorldPagePublication,WORLD_PAGE_STORE,WORLD_ROOT_STORE} from './world_page_publication_d9.js';

export const WORLD_CAMPAIGN_DATABASE_NAME = "saq-world-campaigns-v1";
const CAMPAIGNS = "campaigns";
const TRANSACTIONS = "transactions";
const IDENTITY_RESERVATIONS = "identityReservations";
const LAUNCHERS = 'launchers';
const DATABASE_VERSION = 5;
const REQUIRED_STORES = [CAMPAIGNS, TRANSACTIONS, IDENTITY_RESERVATIONS, LAUNCHERS,WORLD_PAGE_STORE,WORLD_ROOT_STORE,WORLD_REF_STORE];

export function deleteLocalWorldCampaignDatabase({ indexedDB, databaseName=WORLD_CAMPAIGN_DATABASE_NAME } = {}) {
  requireContract(indexedDB && typeof indexedDB.deleteDatabase === "function", "Explicit IndexedDB deletion capability required");
  return new Promise((resolve, reject) => {
    let request, settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      if (error) reject(error); else resolve(true);
    };
    try { request = indexedDB.deleteDatabase(databaseName); }
    catch (error) { finish(error); return; }
    request.onsuccess = () => finish();
    request.onerror = () => finish(request.error || new Error("World campaign database deletion failed"));
    request.onblocked = () => finish(new Error("World campaign database deletion blocked"));
  });
}

// The embedding browser host supplies this capability. Importing the adapter
// neither opens a database nor consults any ambient browser capability.
export function createLocalIndexedDbCampaignStore({ indexedDB, sha256, expectedContentFingerprint,
  expectedGenerationBinding, databaseName=WORLD_CAMPAIGN_DATABASE_NAME, codec=null,now=null,observe=null } = {}) {
  return createStore({indexedDB,sha256,expectedContentFingerprint,expectedGenerationBinding,databaseName,now,observe},codec??{
    prepareTransaction,decideTransaction,requiredIdentityReservations,validateCommittedResult,
    parseCampaignEnvelope,serializeCampaignEnvelope,validateTransactionProposal});
}
function createStore({indexedDB,sha256,expectedContentFingerprint,expectedGenerationBinding,databaseName,now,observe},
  {prepareTransaction,decideTransaction,requiredIdentityReservations,validateCommittedResult,parseCampaignEnvelope,serializeCampaignEnvelope,validateTransactionProposal}) {
  requireContract(indexedDB && typeof indexedDB.open === "function", "Explicit IndexedDB factory required");
  requireContract(typeof sha256 === "function", "Explicit SHA-256 provider required");

  function openDatabase() {
    return new Promise((resolve, reject) => {
      let completed = false;
      let request;
      const fail = (error) => {
        if (completed) return;
        completed = true;
        reject(error || new Error("World campaign database unavailable"));
      };
      try { request = indexedDB.open(databaseName, DATABASE_VERSION); }
      catch (error) { fail(error); return; }
      request.onblocked = () => fail(new Error("World campaign database upgrade blocked"));
      request.onerror = () => fail(request.error);
      request.onupgradeneeded = () => {
        try {
          const database = request.result;
          if(!database.objectStoreNames.contains(WORLD_REF_STORE)){const refs=database.createObjectStore(WORLD_REF_STORE);refs.createIndex('count','count');}
          for(const name of [WORLD_PAGE_STORE,WORLD_ROOT_STORE])if(!database.objectStoreNames.contains(name))database.createObjectStore(name);
          if (!database.objectStoreNames.contains(LAUNCHERS)) database.createObjectStore(LAUNCHERS);
          if (!database.objectStoreNames.contains(CAMPAIGNS)) database.createObjectStore(CAMPAIGNS);
          if (!database.objectStoreNames.contains(TRANSACTIONS)) database.createObjectStore(TRANSACTIONS);
          const createdReservations = !database.objectStoreNames.contains(IDENTITY_RESERVATIONS);
          const identityReservations = createdReservations ? database.createObjectStore(IDENTITY_RESERVATIONS) :
            request.transaction.objectStore(IDENTITY_RESERVATIONS);
          // Version 1 already stored complete committed transaction results. A
          // version-2 upgrade rebuilds reservations from that durable history
          // in the same upgrade transaction. Duplicate historical ownership
          // makes the upgrade abort instead of silently choosing an owner.
          if (createdReservations && database.objectStoreNames.contains(TRANSACTIONS)) {
            const transactions = request.transaction.objectStore(TRANSACTIONS);
            const cursorRequest = transactions.openCursor();
            cursorRequest.onsuccess = () => {
              const cursor = cursorRequest.result;
              if (!cursor) return;
              try {
                const known = cursor.value;
                const result = known?.result;
                requireContract(typeof known?.proposalCanonical === "string", "Invalid version-1 transaction record");
                const proposal = JSON.parse(known.proposalCanonical);
                validateTransactionProposal(proposal);
                requireContract(canonicalStringify(proposal) === known.proposalCanonical &&
                  typeof result?.receipt?.proposalHash === "string" && /^[0-9a-f]{64}$/.test(result.receipt.proposalHash),
                "Invalid version-1 transaction evidence");
                const prepared = { proposal, proposalCanonical: known.proposalCanonical,
                  proposalHash: result.receipt.proposalHash };
                validateCommittedResult(prepared, result);
                const envelope = result.envelope;
                const reservations = requiredIdentityReservations(prepared);
                for (const reservation of reservations) {
                  identityReservations.add(reservation,
                    [envelope.campaignId, reservation.identityKind, reservation.identityId]);
                }
                cursor.continue();
              } catch { request.transaction.abort(); }
            };
            cursorRequest.onerror = () => request.transaction.abort();
          }
        } catch (error) {
          try { request.transaction.abort(); } catch { /* Open error is still rejected below. */ }
          fail(error);
        }
      };
      request.onsuccess = () => {
        const database = request.result;
          if(!database.objectStoreNames.contains(WORLD_REF_STORE)){const refs=database.createObjectStore(WORLD_REF_STORE);refs.createIndex('count','count');}
        if (completed) { database.close(); return; }
        if (!REQUIRED_STORES.every((name) => database.objectStoreNames.contains(name))) {
          database.close();
          fail(new Error("World campaign database schema mismatch"));
          return;
        }
        database.onversionchange = () => database.close();
        completed = true;
        resolve(database);
      };
    });
  }

  async function readRecord(storeName, key, validateResult) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      let transaction;
      let value;
      let read = false;
      let settled = false;
      const finish = (error) => {
        if (settled) return;
        settled = true;
        database.close();
        if (error) { reject(error); return; }
        try {
          requireContract(read, "Campaign read completed without a result");
          resolve(validateResult(value));
        } catch (validationError) { reject(validationError); }
      };
      try {
        transaction = database.transaction([storeName], "readonly");
        transaction.oncomplete = () => finish();
        transaction.onabort = () => finish(transaction.error || new Error("World campaign read aborted"));
        const request = transaction.objectStore(storeName).get(key);
        request.onsuccess = () => { value = request.result; read = true; };
        request.onerror = () => {
          try { transaction.abort(); }
          catch (error) { finish(error); }
        };
      } catch (error) {
        if (transaction) {
          try { transaction.abort(); }
          catch { finish(error); }
        } else finish(error);
      }
    });
  }

  async function commitTransaction(proposal) {
    // Hashing and asynchronous content verification must complete before the
    // database transaction starts, so no unrelated await can deactivate it.
    const prepared = await prepareTransaction(proposal, { sha256, expectedContentFingerprint, expectedGenerationBinding });
    let database;
    try { database = await openDatabase(); }
    catch { return Object.freeze({ status: "aborted", reason: "storage-unavailable" }); }
    return new Promise((resolve, reject) => {
      let transaction;
      let result;
      let domainError;
      let settled = false,transactionStarted=null;
      const finish = (value, error) => {
        if (settled) return;
        settled = true;
        database.close();
        if(transactionStarted!==null)observe?.('saveIndexedDb',now()-transactionStarted);
        if (error) reject(error);
        else resolve(value);
      };
      const unknown = () => finish(Object.freeze({ status: "unknown", reason: "storage-unavailable" }));
      const abort = () => {
        try { transaction.abort(); }
        catch { unknown(); }
      };
      try {
        transactionStarted=now?.()??null;
        transaction = database.transaction(REQUIRED_STORES, "readwrite", {durability:'strict'});
        transaction.oncomplete = () => result ? finish(result) : unknown();
        transaction.onabort = () => finish(Object.freeze({ status: "aborted", reason: "storage-abort" }), domainError);
        const campaigns = transaction.objectStore(CAMPAIGNS);
        const transactions = transaction.objectStore(TRANSACTIONS);
        const identityReservations = transaction.objectStore(IDENTITY_RESERVATIONS);
        const currentRequest = campaigns.get(prepared.proposal.campaignId);
        const receiptRequest = transactions.get([prepared.proposal.campaignId, prepared.proposal.transactionId]);
        const requiredReservations = requiredIdentityReservations(prepared);
        const reservationRequests = requiredReservations.map((reservation) => identityReservations.get(
          [prepared.proposal.campaignId, reservation.identityKind, reservation.identityId]));
        let currentReady = false;
        let receiptReady = false;
        let reservationsReady = 0;
        const decide = () => {
          if (!currentReady || !receiptReady || reservationsReady !== reservationRequests.length) return;
          let decision;
          let checkpointText;
          try {
            const current = currentRequest.result === undefined ? null : parseCampaignEnvelope(currentRequest.result);
            const known = receiptRequest.result === undefined ? null : receiptRequest.result;
            const existingReservations = reservationRequests.map((request) => request.result ?? null);
            decision = decideTransaction(prepared, current, known, existingReservations);
            if (decision.writeRecord !== null) checkpointText = serializeCampaignEnvelope(decision.writeRecord.result.envelope);
          } catch (error) { domainError = error; abort(); return; }
          result = decision.result;
          if (decision.writeRecord === null) return;
          try {
            const campaignWrite = campaigns.put(checkpointText, prepared.proposal.campaignId);
            const receiptWrite = transactions.put(decision.writeRecord,
              [prepared.proposal.campaignId, prepared.proposal.transactionId]);
            campaignWrite.onerror = abort;
            receiptWrite.onerror = abort;
            for (const reservation of decision.reservationRecords) {
              const reservationWrite = identityReservations.put(reservation,
                [prepared.proposal.campaignId, reservation.identityKind, reservation.identityId]);
              reservationWrite.onerror = abort;
            }
            // Individual put success is deliberately not a committed result.
          } catch { abort(); }
        };
        currentRequest.onsuccess = () => { currentReady = true; decide(); };
        receiptRequest.onsuccess = () => { receiptReady = true; decide(); };
        for (const reservationRequest of reservationRequests) {
          reservationRequest.onsuccess = () => { reservationsReady++; decide(); };
          reservationRequest.onerror = abort;
        }
        currentRequest.onerror = abort;
        receiptRequest.onerror = abort;
      } catch {
        if (transaction) abort();
        else finish(Object.freeze({ status: "aborted", reason: "storage-unavailable" }));
      }
    });
  }

  async function loadCampaign(campaignId) {
    validateId("campaignId", campaignId);
    return readRecord(CAMPAIGNS, campaignId, (value) => {
      if (value === undefined) return null;
      const envelope = parseCampaignEnvelope(value);
      requireContract(envelope.campaignId === campaignId, "Stored campaign identity mismatch");
      return value;
    });
  }

  async function lookupTransaction(campaignId, transactionId) {
    validateId("campaignId", campaignId);
    validateId("transactionId", transactionId);
    // The host verifies the full receipt and its checkpoint before installation.
    // Structured cloning gives the caller independent data, not a live DB view.
    return readRecord(TRANSACTIONS, [campaignId, transactionId], (value) => value === undefined ? null : value);
  }

  const readLocalLauncher=key=>readRecord(LAUNCHERS,key,value=>{
    if(value===undefined)return null;validateId('campaignId',value.campaignId);validateId('playerId',value.playerId);
    requireContract(Object.keys(value).sort().join(',')==='campaignId,playerId','Invalid durable launcher');return value;
  });
  async function writeLocalLauncher(key,reference){
    requireContract(['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'].includes(key),'Invalid launcher case');
    const database=await openDatabase();
    return new Promise((resolve,reject)=>{const tx=database.transaction([CAMPAIGNS,LAUNCHERS],'readwrite',{durability:'strict'});let failure=null;
      tx.oncomplete=()=>{database.close();resolve();};tx.onabort=()=>{database.close();reject(failure??tx.error??new Error('Launcher write aborted'));};
      if(reference===null){tx.objectStore(LAUNCHERS).delete(key);return;}
      const request=tx.objectStore(CAMPAIGNS).get(reference.campaignId);request.onsuccess=()=>{try{
        const state=parseCampaignEnvelope(request.result).cut.snapshot.state;
        requireContract(state.proofCase===key&&state.playersById[reference.playerId],'Launcher must reference a durable campaign/controller');
        tx.objectStore(LAUNCHERS).put({campaignId:reference.campaignId,playerId:reference.playerId},key);
      }catch(error){failure=error;tx.abort();}};
    });
  }
  return Object.freeze({ commitTransaction, loadCampaign, lookupTransaction,readLocalLauncher,writeLocalLauncher,
    worldPages:createWorldPagePublication({openDatabase,sha256}),
    loadLatestCheckpoint: loadCampaign, exportCampaign: loadCampaign });
}
