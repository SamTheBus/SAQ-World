import {closedRecord,requireContract as check,freezeWire} from './wire.js';
import {integerRoot} from './endless_formula.js';
import {integerWire,numericExtension,INTEGER_MAX_DIGITS} from './integer_domain.js';
import {progressionBigInt as big,progressionWire as wire,positiveProgression} from './progression_integer.js';
export const D9_HERO_VERSION='player-progression-d9-v1';
export function d9XpAtLevel(level){positiveProgression(level);const l=big(level);if(l.toString().length*2>INTEGER_MAX_DIGITS+2)numericExtension('Hero XP curve magnitude');return wire(25n*(l-1n)*(l+2n));}
export function d9LevelAtXp(totalXp){const xp=big(totalXp);integerWire(xp);const root=integerRoot(9n+4n*(xp/25n),2),l=(root-1n)/2n;return wire(l<1n?1n:l);}
export function d9ProgressionAtXp(totalXp){return freezeWire({version:D9_HERO_VERSION,totalXp:wire(big(totalXp)),level:d9LevelAtXp(totalXp)});}
export function validateD9Hero(p){closedRecord(p,['version','totalXp','level']);check(p.version===D9_HERO_VERSION,'Hero progression version');positiveProgression(p.level);check(big(p.level)===big(d9LevelAtXp(p.totalXp)),'Hero XP/level disagreement');return p;}
export function awardD9HeroXp(p,reward){validateD9Hero(p);return d9ProgressionAtXp(wire(big(p.totalXp)+big(reward)));}
export function d9HeroXpProgress(p){validateD9Hero(p);const l=big(p.level);return freezeWire({...p,capped:false,current:wire(big(p.totalXp)-big(d9XpAtLevel(p.level))),required:wire(50n*(l+1n))});}
export function d9LevelStats(level){positiveProgression(level);const n=big(level)-1n;return {maxHp:wire(100n+15n*n),attack:wire(15n+3n*n),defense:wire(2n*n)};}
export function d9Entitlements(highest){positiveProgression(highest);const n=big(highest)-1n;return {attributeEarned:wire(3n*n),utilityEarned:wire(n)};}
