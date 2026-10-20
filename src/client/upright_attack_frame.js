// Presentation keyframes only. Facing uses the same horizontal mirror as idle;
// the body leans around its center while attached attacking parts aim freely.
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const p=clamp(x);return p*p*(3-2*p);};
const mix=(a,b,t)=>a+(b-a)*t;
export function uprightAttackFrame(tuning,phase,p,direction,contactReach){
 const front=tuning.front,reach=Math.max(0,contactReach-front);
 const idle={travel:0,lift:0,rotation:0,scaleX:1,scaleY:1,extension:tuning.rest??front,sweep:0,open:tuning.openRest??0,orbit:0,spin:0};
 const brace={...idle,travel:-tuning.recoil,lift:tuning.lift??0,rotation:tuning.lean??0,scaleX:tuning.squeezeX??1,scaleY:tuning.squeezeY??1,
  extension:tuning.drawBack??front,open:tuning.openBrace??1,sweep:tuning.sweepBrace??0,orbit:tuning.orbitBrace??0,spin:tuning.spinBrace??0};
 const hit={...idle,travel:reach,lift:tuning.hitLift??0,rotation:tuning.hitLean??0,scaleX:tuning.hitX??1,scaleY:tuning.hitY??1,
  extension:front,open:tuning.openHit??0,sweep:tuning.sweepHit??0,orbit:tuning.orbitHit??0,spin:tuning.spinHit??0};
 const first=phase==='windup'&&p<.4,from=phase==='recovery'?hit:first?idle:brace,to=phase==='recovery'?idle:first?brace:hit;
 const t=phase==='windup'?smooth(first?p/.4:(p-.4)/.6):phase==='recovery'?smooth(p):1;
 const f=Object.fromEntries(Object.keys(idle).map(k=>[k,mix(from[k],to[k],t)]));
 const anchor={x:direction.x*f.travel,y:direction.y*f.travel+f.lift};
 const artWeight=phase==='windup'?smooth(p/.4):phase==='recovery'?1-smooth(p):1;
 const strikeBlend=phase==='windup'?smooth((p-.4)/.6):phase==='recovery'?1-smooth(p):1;
 return {artWeight,strikeBlend,body:{...anchor,rotation:f.rotation*direction.x,scaleX:f.scaleX,scaleY:f.scaleY},anchor,
  limb:{extension:f.extension,sweep:f.sweep,open:f.open,orbit:f.orbit,spin:f.spin},frontExtent:front};
}
