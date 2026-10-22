import {certifyNumeric} from './d9_numeric_expression.js';
import {progressionBigInt as big,positiveProgression} from './progression_integer.js';
import {rewardProfileD9} from '../content/economy_rewards.js';
import {rewardProgressionD9} from '../content/reward_progression_d9.js';
const admitted=new Map();
// Cold episode admission proves the shared exponential term with arithmetic
// headroom for every current noun/rarity/affix/attunement contribution. This is
// an output-capacity guard; it never substitutes a lower effective level.
export function admitContentNumericD9(level,rank){positiveProgression(level);const key=big(level).toString()+'/'+rank;if(admitted.has(key))return;
 rewardProfileD9(rewardProgressionD9(level,'numeric-admission'),rank);
 certifyNumeric(c=>c.endpoint(c.mul(c.dungeonScale(big(level)/4n+1n).E,c.q(10000)),'ceil'));
 if(admitted.size>=128)admitted.delete(admitted.keys().next().value);admitted.set(key,true);
}
