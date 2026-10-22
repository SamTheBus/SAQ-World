import {D9_RUNTIME_POLICY as B} from '../content/world_runtime_policy_d9.js';
import {progressionBigInt} from './progression_integer.js';
import {validateWorldPosition} from './world_address.js';
import {closedRecord,requireContract as check,safeInteger} from './wire.js';
export const NAVIGATION_D9='world-navigation-d9-v1';
export const emptyNavigationD9=()=>({version:NAVIGATION_D9,revision:0,pending:[]});
export function revealRadiusD9(intelligence){const n=progressionBigInt(intelligence),extra=n>5n?(n-5n)/15n:0n;return 12+Number(extra>6n?6n:extra);}
export const navigationIdentityD9=r=>JSON.stringify([r.playerId,r.spaceInstanceId,r.chunkX,r.chunkY]);
export function validateNavigationD9(n){closedRecord(n,['version','revision','pending']);check(n.version===NAVIGATION_D9&&n.pending.length<=B.navigationPendingPages,'Navigation pending page admission');safeInteger(n.revision);const seen=new Set();for(const r of n.pending){closedRecord(r,['playerId','spaceInstanceId','chunkX','chunkY','tiles','region','markers']);validateWorldPosition({chunkX:r.chunkX,chunkY:r.chunkY,localX:0,localY:0});const key=navigationIdentityD9(r);check(!seen.has(key)&&typeof r.tiles==='string'&&r.tiles.length===832&&(['planned-world-runtime-foundation-v1','planned-world-shoreline-v2','planned-world-water-v3'].includes(r.region?.version)?/^[?wormpadstlOWLRTHV]+$/:/^[?wormp]+$/).test(r.tiles)&&r.markers.length<=32,'Invalid navigation knowledge');seen.add(key);}return n;}
