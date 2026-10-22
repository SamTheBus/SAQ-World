import { freezeWire, requireContract } from './wire.js';
export const THREAT_TIERS=Object.freeze(['C','B','A','S']);
export const THREAT_CONTRACT_VERSION='world-threat-power-v1';
// Immutable D1/D2 catalog/manifest recipe basis only. D3 live encounter snapshots
// explicitly pass the highest eligible participant LEVEL; never this placeholder.
export const BASELINE_PROGRESSION_POWER=1;
export function resolveThreatPower(progressionPower,tier){
  requireContract(Number.isFinite(progressionPower)&&progressionPower>=1&&progressionPower<=1000000,'Invalid progression power');
  const rank=THREAT_TIERS.indexOf(tier);requireContract(rank>=0,'Invalid threat tier');
  const power=(1+0.35*Math.log2(progressionPower))*[1,1.25,1.6,2][rank];
  return freezeWire({contractVersion:THREAT_CONTRACT_VERSION,tier,power,hpMultiplier:Math.sqrt(power),damageMultiplier:power,
    compositionBand:tier,participantPolicy:'explicit-progression-input-selected-by-caller'});
}
