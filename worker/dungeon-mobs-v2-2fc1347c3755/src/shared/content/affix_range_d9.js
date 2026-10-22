import {certifyNumeric} from '../contracts/d9_numeric_expression.js';
import {progressionBigInt as big,progressionWire as wire,positiveProgression} from '../contracts/progression_integer.js';
import {decimalWire} from './gear_numbers_d9.js';
import {safeInteger,freezeWire} from '../contracts/wire.js';
export function affixRollRangeD9(g,key){positiveProgression(g.itemPower);const tier=safeInteger(g.rarityTier,0,5),p=g.itemPower,overall=g.definition.slot==='overall';
 return certifyNumeric(c=>{const P=c.q((100+15*tier)*(overall?18:10),1000),R=c.q((100+7*tier)*(overall?18:10),1000),I=c.q,mul=c.mul;
 const cap=(a,b)=>({lo:a.lo<b.lo?a.lo:b.lo,hi:a.hi<b.hi?a.hi:b.hi}),ceil=x=>wire(c.endpoint(x,'ceil')),round4=x=>decimalWire(c.endpoint(x,'round',4),4);
 let minimum,maximum;
 if(['atk','def','maxHp'].includes(key)){const scale=mul(c.dungeonScale(p).E,R),lo=key==='maxHp'?12:4;minimum=ceil(mul(I(lo,100),scale));maximum=ceil(mul(I(lo*2,100),scale));}
 else if(key==='moveSpeed'){minimum=ceil(mul(I(p),P));maximum=ceil(mul(I(2),mul(I(p),P)));}
 else if(key==='bonusAreaRadius'){minimum=round4(mul(I(4,100),P));maximum=round4(mul(I(10,100),P));}
 else if(key==='activeSpd'){const scale=mul(c.frac(I(p),3,10),I(100+8*tier,100));minimum=round4(mul(I(1,100),scale));maximum=round4(mul(I(3,100),scale));}
 else if(['critChance','critDamage','block','parry'].includes(key)){const scale=mul(c.root(I(p),2),P),lo=key==='critChance'?I(15,1000):key==='critDamage'?I(3,100):I(5,1000),hi=key==='critChance'?I(4,100):key==='critDamage'?I(6,100):I(15,1000),limit=key==='critChance'?I(2,10):I(15,100);minimum=round4(key==='critDamage'?mul(lo,scale):cap(mul(lo,scale),limit));maximum=round4(key==='critDamage'?mul(hi,scale):cap(mul(hi,scale),limit));}
 else {const scale=mul(c.add(I(3),c.frac(I(p),3,4)),I(100+25*tier,100)),lo=big(c.endpoint(mul(I(4,10),scale),'ceil')),hi=big(c.endpoint(mul(I(8,10),scale),'ceil')),limit=big(c.endpoint(c.add(I(2),mul(I(p),I(3,4))))),f=big(c.endpoint(mul(I(p),I(45,100)))),fallback=f<1n?1n:f,values=[];if(lo<=limit){values.push(lo,hi<limit?hi:limit);}if(hi>limit)values.push(fallback);minimum=wire(values.reduce((a,b)=>a<b?a:b));maximum=wire(values.reduce((a,b)=>a>b?a:b));}
 return freezeWire({minimum,maximum});
 });
}
