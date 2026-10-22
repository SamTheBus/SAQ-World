import { SNAPSHOT_WIRE_VERSION } from "./versions.js";
import { closedRecord, exactVersion, freezeWire, requireContract, validateWire, canonicalStringify } from "./wire.js";
import { validateWorldState } from "./state.js";

export function validateSnapshot(snapshot) {
  validateWire(snapshot);
  closedRecord(snapshot, ["snapshotWireVersion", "state"]);
  exactVersion(snapshot.snapshotWireVersion, SNAPSHOT_WIRE_VERSION);
  validateWorldState(snapshot.state);
  return snapshot;
}

export function createSnapshot(state) {
  validateWorldState(state);
  return freezeWire({ snapshotWireVersion: SNAPSHOT_WIRE_VERSION, state });
}

export function serializeSnapshot(snapshot) {
  validateSnapshot(snapshot);
  return canonicalStringify(snapshot);
}

export function parseSnapshot(text) {
  requireContract(typeof text === "string" && text.length <= 1000000, "Snapshot text limit/type");
  const snapshot = JSON.parse(text);
  validateSnapshot(snapshot);
  requireContract(canonicalStringify(snapshot) === text, "Snapshot text must be canonical (no duplicate keys or alternate encodings)");
  return freezeWire(snapshot);
}
