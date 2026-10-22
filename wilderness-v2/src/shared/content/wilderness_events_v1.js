// Wilderness V2 event planning contract. Does not spawn actors or award loot.
// Pure, deterministic, save-friendly event selection over reserved clearings.
export const EVENT_TYPES = Object.freeze(['roaming_pack','bandit_ambush','abandoned_camp','treasure_cache','elite_hunt']);
const byCategory = {
  pathside: ['bandit_ambush','abandoned_camp','roaming_pack'],
  backcountry: ['roaming_pack','abandoned_camp','treasure_cache','elite_hunt'],
  remote: ['elite_hunt','treasure_cache','roaming_pack','abandoned_camp']
};
function hash(value) {
  let h = 2166136261;
  for (const c of String(value)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function planWildernessEvents(slots, { worldSeed='alpha', epoch=0, completedIds=[], maxActive=12, excludedIds=[] }={}) {
  if (!Array.isArray(slots) || !Number.isSafeInteger(epoch) || epoch < 0 || !Number.isInteger(maxActive) || maxActive < 0) throw Error('Invalid wilderness event inputs');
  const completed = new Set(completedIds), excluded = new Set(excludedIds), seen = new Set();
  const candidates=[];
  for (const slot of slots) {
    const id=slot?.eventSlotId;
    if (!id || seen.has(id)) throw Error('Missing or duplicate event slot identity');
    seen.add(id);
    if (completed.has(id) || excluded.has(id)) continue;
    const types=byCategory[slot.category] || byCategory.backcountry;
    const n=hash(`${worldSeed}|${epoch}|${id}`);
    candidates.push({ eventId:`wilderness-event:${id}:${epoch}`, slotId:id, kind:types[n%types.length], biome:slot.biome, landmassId:slot.landmassId, position:{...slot.position}, score:hash(`${worldSeed}|${epoch}|rank|${id}`) });
  }
  candidates.sort((a,b)=>a.score-b.score || a.slotId.localeCompare(b.slotId));
  return candidates.slice(0,maxActive).map(({score,...entry})=>entry);
}
