import {D9_PROFILE as P} from '../content/world_profile_d9.js';
import {progressionBigInt as big,progressionWire as wire,positiveProgression} from './progression_integer.js';
import {relativeWorldPosition,validateWorldPosition} from './world_address.js';
import {freezeWire,copyWire,requireContract as check} from './wire.js';
export const D9_EPISODE_VERSION='encounter-episode-d9-v1';
export function unfrozenEpisodeD9(anchorId,episode=0,{origin=false}={}){return {version:D9_EPISODE_VERSION,anchorId,episode:wire(big(episode)),origin,snapshot:null,placement:null,clearedTick:null,vacatedTick:null,renewalEligible:false};}
const pointDistance=(a,b)=>{const local=relativeWorldPosition(a,b,4);return local?Math.hypot(local.x-b.localX,local.y-b.localY):Infinity;};
export function prepareEpisodeSnapshotD9(episode,{tick,minimumLevel,participants,anchor,spaceInstanceId,rank,trigger}){
 check(['activation','combat','resource'].includes(trigger),'Invalid progression trigger');if(episode.snapshot)return episode.snapshot;
 positiveProgression(minimumLevel);validateWorldPosition(anchor);
 const eligible=participants.filter(p=>p.alive&&p.spaceInstanceId===spaceInstanceId&&pointDistance(p.position,anchor)<=P.prepareRadius).sort((a,b)=>a.playerId.localeCompare(b.playerId));
 check(eligible.length>0,'Episode activation has no eligible participant');let level=big(minimumLevel);for(const p of eligible){positiveProgression(p.heroLevel);if(big(p.heroLevel)>level)level=big(p.heroLevel);}
 return freezeWire({version:'episode-progression-d9-v1',snapshotId:episode.anchorId+'/episode/'+String(episode.episode),activatedTick:tick,trigger,minimumLevel:wire(big(minimumLevel)),effectiveLevel:wire(level),sourceDepth:wire(level),mappingVersion:P.progressionPolicy,rank,participants:eligible.map(p=>({playerId:p.playerId,heroLevel:wire(big(p.heroLevel))}))});
}
export function advanceVacancyD9(episode,{tick,occupied,obligationsResolved,townReturnEligible=false}){
 const next=copyWire(episode);if(next.clearedTick===null)return next;
 if(occupied){if(!next.renewalEligible)next.vacatedTick=null;return next;}
 if(next.vacatedTick===null)next.vacatedTick=tick;
 const policy=next.origin?townReturnEligible:tick-next.vacatedTick>=P.renewalVacancyTicks;
 if(policy&&obligationsResolved)next.renewalEligible=true;return next;
}
export function renewEpisodeD9(episode,{approaching,obligationsResolved,placement}){
 check(episode.renewalEligible&&approaching&&obligationsResolved&&placement,'Episode renewal unavailable');
 return {...unfrozenEpisodeD9(episode.anchorId,wire(big(episode.episode)+1n),{origin:episode.origin}),placement:copyWire(placement)};
}
export function chooseEpisodePlacementD9({candidates,participants,spaceInstanceId,isLegal}){
 check(candidates.length<=P.placementCandidates,'Placement work bound');for(const pair of candidates){
 check(pair.length===2,'D9 preserves two members');if(pair.every(p=>isLegal(p)&&participants.every(a=>a.spaceInstanceId!==spaceInstanceId||pointDistance(p,a.position)>=P.placementSafetyRadius)))return freezeWire(pair);
 }return null;
}
