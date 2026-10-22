import { collidesWithTiles } from '../shared/rules/world_geometry.js';
import {hasWorldCombat} from '../shared/content/world_combat_v1.js';

const HOME_TOLERANCE = 1e-7;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function createOrdinaryEvade(state, manifest, {onHomeReset=()=>{}}={}) {
  // Borrow immutable generated coordinates; no second spawn, RNG or saved home copy.
  const homes = new Map((manifest.population?.groups ?? []).flatMap(g =>
    g.members.map(m => [m.entityId, {position:m.position, groupId:g.groupId}])));
  const returning = new Set(), returningGroups = new Set();
  let completedResets = 0, sleepResets = 0;
  const homeFor = actor => actor.residency.spaceInstanceId === state.overworldInstanceId ? homes.get(actor.entityId) : null;
  const legal = (actor, p) => !collidesWithTiles(state.spacesByInstanceId[state.overworldInstanceId].collision, p.x, p.y, actor.hullRadius) &&
    !manifest.safeRegions.some(r => p.x+actor.hullRadius>r.x && p.x-actor.hullRadius<r.x+r.width && p.y+actor.hullRadius>r.y && p.y-actor.hullRadius<r.y+r.height);
  function reset(actor, home, sleeping) {
    if (!actor.alive || !legal(actor, home.position)) return false;
    actor.position = {...home.position};
    // A World pack's retained damage survives returning to its spawn. Sleep
    // only parks its state; clearing and normal renewal remain separate.
    if(!hasWorldCombat(state))actor.hp = structuredClone(actor.maxHp);
    actor.attackTimer = 0;
    actor.movementIntent = {x:0,y:0};
    if (sleeping) actor.movedLastTick = false;
    completedResets++;
    if (sleeping) sleepResets++;
    returning.delete(actor.entityId);
    onHomeReset(actor);
    return true;
  }
  return Object.freeze({
    refreshHomes(){homes.clear();for(const g of manifest.population?.groups??[])for(const m of g.members)homes.set(m.entityId,{position:m.position,groupId:g.groupId});},
    beginTick() { returning.clear(); returningGroups.clear(); },
    returnIntent(actor) {
      const home = homeFor(actor);
      if (!home || !actor.alive) return {x:0,y:0};
      const d = distance(actor.position, home.position);
      if (d <= HOME_TOLERANCE) return {x:0,y:0};
      returning.add(actor.entityId); returningGroups.add(home.groupId);
      // Stop on the anchor rather than overshooting it on alternating ticks.
      const denominator = Math.max(d, actor.moveSpeed);
      return {x:(home.position.x-actor.position.x)/denominator, y:(home.position.y-actor.position.y)/denominator};
    },
    finishMovement(actor) {
      const home = homeFor(actor);
      if (home && returning.has(actor.entityId) && distance(actor.position, home.position) <= HOME_TOLERANCE) reset(actor, home, false);
    },
    beforeSleep(group, leaveRadius) {
      if (group.spaceInstanceId !== state.overworldInstanceId || group.siteId !== null || !manifest.population) return true;
      const live = group.entityIds.map(id => state.entitiesById[id]).filter(a => a.alive);
      const displaced = live.filter(a => homes.has(a.entityId) && distance(a.position, homes.get(a.entityId).position) > HOME_TOLERANCE);
      if (!displaced.length) return true;
      // Check both ends. A second player must not see an actor disappear OR appear.
      // Even a dead/disconnected party resident may still be a visual observer.
      const observers = Object.values(state.playersById).map(p => state.entitiesById[p.entityId]).filter(a => a.residency.spaceInstanceId === state.overworldInstanceId);
      if (observers.some(p => live.some(a => distance(p.position,a.position) <= leaveRadius) ||
        displaced.some(a => distance(p.position,homes.get(a.entityId).position) <= leaveRadius))) return false;
      if (!displaced.every(a => legal(a,homes.get(a.entityId).position))) return false;
      for (const actor of displaced) reset(actor,homes.get(actor.entityId),true);
      return true;
    },
    inspect() { return {returningActors:returning.size,returningGroups:returningGroups.size,completedResets,sleepResets}; },
  });
}
