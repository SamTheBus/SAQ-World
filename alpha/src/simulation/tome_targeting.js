import {clearHullGap,subweaponLineClear} from './subweapon_rules.js';
// Dungeon combat_targeting.js: nearest reachable hostile, independent of sword aim.
// Broadphase remains the caller's bounded same-space query; hull gap is narrowphase.
export function selectTomeTarget(source,candidates,collision,eligible){
 return candidates.filter(t=>t.kind==='actor'&&t.alive&&t.team==='hostile'&&t.residency.spaceInstanceId===source.residency.spaceInstanceId&&eligible(source,t)&&clearHullGap(source,t)<=128&&subweaponLineClear(collision,source,t))
 .sort((a,b)=>Math.hypot(a.position.x-source.position.x,a.position.y-source.position.y)-Math.hypot(b.position.x-source.position.x,b.position.y-source.position.y)||a.entityId.localeCompare(b.entityId))[0]??null;
}
