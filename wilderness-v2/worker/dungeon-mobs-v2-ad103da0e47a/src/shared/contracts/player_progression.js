import { closedRecord, freezeWire, requireContract, safeInteger } from './wire.js';
import {D9_HERO_VERSION,validateD9Hero,awardD9HeroXp,d9HeroXpProgress,d9ProgressionAtXp} from './hero_progression_d9.js';
import {isD9Progression} from './participant_progression_d9.js';

export const PLAYER_PROGRESSION_VERSION = 'player-progression-d3-v1';
export const D3_ACTIVITY_FORMAT = 'saq-world-activity-d3-1';
export const MAX_PLAYER_LEVEL = 50;
// Cost from L to L+1: 100 + 50*(L-1). Total to reach L: 25*(L-1)*(L+2).
export const xpAtLevel = level => {
  safeInteger(level, 1, MAX_PLAYER_LEVEL);
  return 25 * (level - 1) * (level + 2);
};
export const MAX_PLAYER_XP = xpAtLevel(MAX_PLAYER_LEVEL);
export function levelAtXp(totalXp) {
  safeInteger(totalXp, 0, MAX_PLAYER_XP);
  let level = 1;
  while (level < MAX_PLAYER_LEVEL && totalXp >= xpAtLevel(level + 1)) level++;
  return level;
}
export const progressionAtXp = (totalXp,participantProgression=null) => isD9Progression(participantProgression)?d9ProgressionAtXp(totalXp):freezeWire({version:PLAYER_PROGRESSION_VERSION,totalXp,level:levelAtXp(totalXp)});
export function validatePlayerProgression(value) {
  if(value?.version===D9_HERO_VERSION)return validateD9Hero(value);
  closedRecord(value, ['version','totalXp','level']);
  requireContract(value.version === PLAYER_PROGRESSION_VERSION, 'Unsupported player progression');
  safeInteger(value.level, 1, MAX_PLAYER_LEVEL);
  requireContract(value.level === levelAtXp(value.totalXp), 'Level/XP disagreement');
  return value;
}
export function awardPlayerXp(progression, reward) {
  if(progression?.version===D9_HERO_VERSION)return awardD9HeroXp(progression,reward);
  validatePlayerProgression(progression);
  safeInteger(reward, 0, Number.MAX_SAFE_INTEGER);
  // Subtract available capacity before addition; even MAX_SAFE_INTEGER cannot overflow.
  return progressionAtXp(progression.totalXp + Math.min(reward, MAX_PLAYER_XP - progression.totalXp));
}
export function playerXpProgress(progression) {
  if(progression?.version===D9_HERO_VERSION)return d9HeroXpProgress(progression);
  validatePlayerProgression(progression);
  const capped = progression.level === MAX_PLAYER_LEVEL;
  return freezeWire({level:progression.level,totalXp:progression.totalXp,capped,
    current:capped?0:progression.totalXp-xpAtLevel(progression.level),
    required:capped?0:xpAtLevel(progression.level+1)-xpAtLevel(progression.level)});
}
