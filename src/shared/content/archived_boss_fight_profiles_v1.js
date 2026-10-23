// Mechanics recovered from the original six playable SAQ boss arenas.
// The archived source is authoritative for parameters and attack footprints.
// See SAQ-World-All-Boss-Work-2026-10-23(1).zip / SOURCE/RECOVERED-ARENA-SOURCE.
// Source hashes are preserved to identify the original versions.
export const ARCHIVED_FIGHT_PROFILE_VERSION='boss-archive-parity-v1';
export const ARCHIVED_FIGHT_PROFILES=Object.freeze({
 corrosive_abomination:Object.freeze({
  originalContentSha:'5fc523adb50b9149a4cbb36a79eeb6717d7704ff92f8935e69c17f339e992f1d',
  attack:Object.freeze({corrosive_slam:65,spore_storm:85,acid_spill:45}),
  hop:Object.freeze({speed:1.6,cycleTicks:30,movingTicks:15,stopRange:14}),
  acid:Object.freeze({radius:12,lifeTicks:480,cadenceTicks:45,maxHpPercent:1.5,minimumHp:1}),
  slag:Object.freeze({radius:9,lifeTicks:240,cadenceTicks:30,maxHpPercent:1}),
  contact:Object.freeze({radius:30.72,cadenceTicks:40,damageMultiplier:.5}),
  spore:Object.freeze({count:3,radius:12,speed:1,lifeTicks:360,initialRange:45,poisonTicks:240,poisonCadenceTicks:60}),
  shedding:Object.freeze({stepPercent:8,maxLive:6,maxSlag:2,slagEveryPhaseTwoChunks:3,flightTicks:18,coalescenceTicks:12})
 }),
 void_overseer:Object.freeze({
  originalContentSha:'01fae024dffd8d5dc9e186f0e9fccf96b98bd6b030fe9a356962bc06e6ee087a',
  attack:Object.freeze({eye_lance:75,singularity:360}),
  movement:Object.freeze({speed:1.6,cycleTicks:30,movingTicks:15}),
  singularity:Object.freeze({radius:90,pullNumerator:4500,pullSoftening:400,pullMax:4.8,stopRange:10}),
  contact:Object.freeze({radius:30.72,cadenceTicks:40,damageMultiplier:.5})
 }),
 chronos_arbitrator:Object.freeze({
  originalContentSha:'fc26a4070fa2fb59a31c5a5680166f83c7ea54c48fcf79940dd9a4d83fed80af',
  attack:Object.freeze({chronos_slam:75,time_field:60,chronos_rewind:240}),
  timeField:Object.freeze({radius:35,lifetimeTicks:420,movementMultiplier:.6,attackDelayMultiplier:1.67}),
  rewind:Object.freeze({phaseThresholdPercent:40,shieldPercent:15,healPercent:20,dazeTicks:210})
 }),
 nexus_overseer:Object.freeze({
  originalContentSha:'7bb6421365be1900a9c0c62cc91532bd8671fbd363c58c182e1fd15814fdfff7',
  attack:Object.freeze({prism_collapse:75,control_glitch:60,prism_slam:75}),
  cage:Object.freeze({radius:64,damageMultiplier:1.8}),
  glitch:Object.freeze({radius:180,durationTicks:180}),
  decoy:Object.freeze({max:2,hullRadius:12,range:220,speed:1.35,projectileSpeed:4.2,projectileRadius:6,projectileLifeTicks:180}),
 }),
 hooktail:Object.freeze({
  originalContentSha:'2b4afc45bdc731d1b7079dbc44611aabefd87c05cd2be06dc2450ebb46373a91',
  attack:Object.freeze({scarlet_fire:60,hooked_tail:75,arena_collapse:85}),
  fire:Object.freeze({range:110,halfAngle:.8,damageMultiplier:1.55}),
  collapse:Object.freeze({damageCadenceTicks:40,damageMaxHpPercent:8,minimumRemainingHp:1,phaseTwoThresholdPercent:50})
 }),
 cinderhart:Object.freeze({
  originalContentSha:'9a7d9db40f00fe79048274b975d3b63a8b5cee67d6e75a124c9f60206bbfb54a',
  attack:Object.freeze({warren_call:60,fire_charge:54}),
  rush:Object.freeze({durationTicks:24,maxDistance:220,radius:25,damageMultiplier:1.3}),
  bunny:Object.freeze({restTicks:18,flightTicks:28,phase2RestTicks:12,phase2FlightTicks:24,lifetimeTicks:900,
    minimumLeap:55,maximumLeap:75,landingFireLifeTicks:300}),
  fire:Object.freeze({radius:18,chargeLifeTicks:180,ignitionTicks:12,hitCadenceTicks:30,damage:24})
 })
});
export function archivedCombatProfile(kind){return ARCHIVED_FIGHT_PROFILES[kind]??null;}
