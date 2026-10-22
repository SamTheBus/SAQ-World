import {progressionBigInt as big,progressionWire as wire,positiveProgression} from './progression_integer.js';
import {d9Entitlements} from './hero_progression_d9.js';
import {requireContract as check,copyWire} from './wire.js';
export const D9_PARTICIPANT_VERSION='participant-progression-d9-v1';
export const isD9Progression=s=>s?.version===D9_PARTICIPANT_VERSION;
export function migrateD9Participant(state){const n=copyWire(state);n.version=D9_PARTICIPANT_VERSION;n.highestHeroLevel=wire(big(state.highestHeroLevel));for(const k of ['str','dex','int'])n.allocated[k]=wire(big(state.allocated[k]));return n;}
export function validateD9Entitlements(state,heroLevel){positiveProgression(state.highestHeroLevel);check(big(state.highestHeroLevel)>=big(heroLevel),'Hero high-water regressed');const spent=Object.values(state.allocated).reduce((n,v)=>n+big(v),0n);check(spent<=big(d9Entitlements(state.highestHeroLevel).attributeEarned),'Overspent attributes');}
export function d9AttributeBalance(state){const earned=big(d9Entitlements(state.highestHeroLevel).attributeEarned),spent=Object.values(state.allocated).reduce((a,b)=>a+big(b),0n);check(spent<=earned,'Overspent attributes');return {attributeEarned:wire(earned),attributeUnspent:wire(earned-spent)};}
export function allocateD9Attributes(state,deltas){const n=copyWire(state),total=Object.values(deltas).reduce((a,b)=>a+big(b),0n);check(total>0n&&total<=big(d9AttributeBalance(state).attributeUnspent),'Invalid attribute allocation');for(const k of ['str','dex','int'])n.allocated[k]=wire(big(state.allocated[k])+big(deltas[k]));return n.allocated;}
