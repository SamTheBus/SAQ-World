import {certifyNumeric} from './d9_numeric_expression.js';
import {requireContract} from './wire.js';
import {THREAT_TIERS} from './threat_power.js';
import {combatAmount} from './combat_amount.js';
export function threatEndpointsD9(level,tier,{hp=1,damage=1,xp=1}={}){
 const rank=THREAT_TIERS.indexOf(tier);requireContract(rank>=0,'Invalid threat rank');
 return certifyNumeric(c=>{const power=c.mul(c.add(c.q(1),c.mul(c.q(7,20),c.log2Integer(level))),c.q([100,125,160,200][rank],100));
  return {maxHp:c.endpoint(c.mul(c.q(hp),c.root(power,2))),attackDamage:c.endpoint(c.mul(c.q(damage),power)),xp:c.endpoint(c.mul(c.q(xp),power)),power:combatAmount(c.endpoint(power,'round',12),1000000000000n)};
 });
}
