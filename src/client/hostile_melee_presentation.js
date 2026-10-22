import {drawGolemStoneBlockV4} from './creature_presentation_stone_golem_v4.js';
import {corrodedGolemMeleePoseV4} from './creature_presentation_corroded_golem_v4.js';
import {hellBatMeleePoseV4} from './creature_presentation_hell_bat_v4.js';
import {lavaSerpentMeleePoseV4} from './creature_presentation_lava_serpent_v4.js';
import {cursedBladeMeleePoseV4} from './creature_presentation_cursed_blade_v4.js';
import {animatedArmorMeleePoseV4} from './creature_presentation_animated_armor_v4.js';
import {gargoyleMeleePoseV4} from './creature_presentation_gargoyle_v4.js';
import {drawClockworkDroneCannon} from './clockwork_drone_ranged_presentation_v1.js';
import {dungeonMobMeleePoseV2A,drawDungeonMobMeleeLimbV2A,drawDungeonMobContactV2A} from './creature_presentation_dungeon_mobs_v2a.js';
import {dungeonMobMeleePoseV2B,drawDungeonMobMeleeLimbV2B,drawDungeonMobContactV2B} from './dungeon_mob_melee_presentation_v2b.js';
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const smooth = x => { const p=clamp(x,0,1); return p*p*(3-2*p); };
export const HOSTILE_STRIKE_FEEDBACK_MS = 190;

// Upright sprites turn by mirroring, never by rotating their heads below their
// feet. These keyframes share endpoints so windup/strike/recovery cannot jump.
const uprightDungeonMelee={
  sprout:{front:22.5,recoil:5,lift:0,lean:-.18,hitLean:.16,squeezeX:1.14,squeezeY:.8,hitX:1.08,hitY:.92},
  slime:{front:14,recoil:4,lift:-4,lean:0,hitLean:0,squeezeX:1.4,squeezeY:.6,hitX:1.4,hitY:.7},
  rust_nibbler:{front:17,recoil:2,lift:0,lean:-.08,hitLean:.08,squeezeX:.9,squeezeY:1.08,hitX:1.08,hitY:.92},
  slag_slime:{front:16,recoil:2.5,lift:2,lean:0,hitLean:.06,squeezeX:1.32,squeezeY:.62,hitX:1.2,hitY:.82},
  swamp_basilisk:{front:13,recoil:5,lift:-2,lean:-.1,hitLean:.08,squeezeX:.88,squeezeY:1.18,hitX:1.12,hitY:.9},
  marsh_ghost:{front:23,recoil:2,lift:-5,lean:-.12,hitLean:.18,squeezeX:.85,squeezeY:1.2,hitX:.92,hitY:1.08}
};
const mix=(a,b,t)=>a+(b-a)*t;
function uprightMeleeBody(tuning,phase,p,direction,contactReach){
  const reach=Math.max(0,contactReach-tuning.front),idle=[0,0,0,1,1];
  const brace=[-tuning.recoil,tuning.lift,tuning.lean,tuning.squeezeX,tuning.squeezeY];
  const hit=[reach,0,tuning.hitLean,tuning.hitX,tuning.hitY];
  const from=phase==='recovery'?hit:phase==='windup'&&p<.4?idle:brace;
  const to=phase==='recovery'?idle:phase==='windup'&&p<.4?brace:hit;
  const blend=phase==='windup'?smooth(p<.4?p/.4:(p-.4)/.6):phase==='recovery'?smooth(p):1;
  const [travel,lift,rotation,scaleX,scaleY]=from.map((v,i)=>mix(v,to[i],blend));
  return {x:direction.x*travel,y:direction.y*travel+lift,rotation:rotation*direction.x,scaleX,scaleY};
}


// These are disposable poses, not movement, attack shapes or timing rules.
// The near face is bounded by the same combat radii as the authoritative hit.
export function hostileMeleePose(actor, tick) {
  const imported=corrodedGolemMeleePoseV4(actor,tick)??dungeonMobMeleePoseV2A(actor,tick)??dungeonMobMeleePoseV2B(actor,tick)??gargoyleMeleePoseV4(actor,tick)??animatedArmorMeleePoseV4(actor,tick)??cursedBladeMeleePoseV4(actor,tick)??lavaSerpentMeleePoseV4(actor,tick)??hellBatMeleePoseV4(actor,tick);if(imported)return imported;
  const phase=actor.meleePhase,g=actor.meleeGeometry;
  if(!actor.alive||!g||!phase||phase.phase==='idle')return null;
  const dx=g.targetPosition?g.targetPosition.x-actor.position.x:actor.presentationFacingX??1;
  const dy=g.targetPosition?g.targetPosition.y-actor.position.y:0,distance=Math.hypot(dx,dy);
  const direction=distance>.001?{x:dx/distance,y:dy/distance}:{x:1,y:0};
  const sourceRadius=g.sourceRadius,targetRadius=g.targetRadius;
  const centerLimit=g.mode==='clearHullGap'?g.reach+sourceRadius+targetRadius:g.reach;
  const weaponReach=Math.max(sourceRadius,centerLimit-targetRadius);
  const contactReach=clamp(distance-targetRadius,sourceRadius,weaponReach);
  const p=clamp((tick-phase.phaseStartedTick)/Math.max(1,phase.phaseEndsTick-phase.phaseStartedTick),0,1);
  const windup=phase.phase==='windup',impact=phase.phase==='impact',w=windup?smooth(p):0,r=phase.phase==='recovery'?(1-p)**2:0;
  const family=actor.enemyFamily,body={x:0,y:0,rotation:0,scaleX:1,scaleY:1},limb={extension:0,sweep:0,open:0};
  if(uprightDungeonMelee[family]){
    if(family==='rust_nibbler'){limb.extension=17;limb.open=windup?2+4*w:impact?.7:1+2*(1-r);}
    return {family,phase:phase.phase,progress:p,direction,sourceRadius,targetRadius,centerLimit,weaponReach,contactReach,
    upright:true,bodyPivot:{x:0,y:-10},body:uprightMeleeBody(uprightDungeonMelee[family],phase.phase,p,direction,contactReach),limb};
  }
  let travel=0,lift=0;
  switch(family){
    case 'golem': { // Torso braces while one independent floating gauntlet makes a heavy punch.
      const reach=Math.min(7,Math.max(0,contactReach-28));
      travel=windup?-2*w:impact?reach:reach*r;lift=windup?2*w:impact?2*(1-p):r;
      body.rotation=(windup?-.12*w:impact?.09:.09*r)*(direction.x<0?-1:1);body.scaleY=1+(windup?.04*w:impact?-.035:-.035*r);
      limb.extension=windup?8-15*w:impact?contactReach-travel:(contactReach-reach)*r+8*(1-r);
      limb.sweep=windup?-.18*w:impact?.07*p:.07*r;limb.open=windup?w:impact?1:r;break;
    }
  }
  body.x=direction.x*travel;body.y=direction.y*travel+lift;
  return {family,phase:phase.phase,progress:p,direction,sourceRadius,targetRadius,centerLimit,weaponReach,contactReach,body,limb};
}

// Real fists, claws, mandibles and weapons replace their idle carried parts.
// They are drawn at body height. No warning is painted on the ground.
export function drawHostileMeleeLimb(c,pose,flash=false){
  if(pose?.ranged){drawClockworkDroneCannon(c,pose,flash);return;}
  if(drawDungeonMobMeleeLimbV2A(c,pose,flash)||drawDungeonMobMeleeLimbV2B(c,pose,flash))return;
  if(!pose)return;
  if(pose.family==='gargoyle'||pose.family==='animated_armor'||pose.family==='corroded_golem')return; // These painters own their complete attached attacking parts.
  const {family,body,limb}=pose;
  if(!['golem','rust_nibbler'].includes(family))return;
  c.save();c.translate(body.x,body.y-8);c.rotate(Math.atan2(pose.direction.y,pose.direction.x));
  c.lineJoin='round';c.lineCap='round';c.strokeStyle='#20272c';c.lineWidth=1.5;
  if(family==='golem'){
    // One gauntlet stays braced; the punching fist is a separate stone mass.
    c.save();c.translate(-3,8);c.rotate(-.25);drawGolemStoneBlockV4(c,-4,-4,8,9,2,flash,1.26);c.restore();
    const x=limb.extension-5.5;c.save();c.translate(x,0);c.rotate(limb.sweep);drawGolemStoneBlockV4(c,-5.5,-6,11,12,2.5,flash,1.26);
    c.fillStyle=flash?'#fff':'#718096';c.fillRect(1,-5,3,9);c.strokeStyle=flash?'#fff':'#38bdf8';c.lineWidth=1;c.beginPath();c.moveTo(-2,-3);c.lineTo(1,0);c.lineTo(-2,3);c.stroke();c.restore();
  }else if(family==='rust_nibbler'){
    const tip=limb.extension,open=limb.open;c.fillStyle=flash?'#fff':'#f27926';c.strokeStyle='#11151a';c.lineWidth=1.8;
    for(const side of [-1,1]){c.beginPath();c.moveTo(9,side*3);c.quadraticCurveTo(tip-1,side*(open+3),tip,side*open);c.lineTo(tip-3,side*.5);c.lineTo(10,side);c.closePath();c.fill();c.stroke();}
  }
  c.restore();
}

export function hostileContactPose(contact,age){
  if(age<0||age>=HOSTILE_STRIKE_FEEDBACK_MS)return null;
  const source=contact.sourcePosition,target=contact.targetPosition;
  if(!source||!target)return null;
  const dx=target.x-source.x,dy=target.y-source.y,distance=Math.hypot(dx,dy),direction=distance>.001?{x:dx/distance,y:dy/distance}:{x:1,y:0};
  const max=contact.mode==='clearHullGap'?contact.reach+contact.sourceRadius:Math.max(0,contact.reach-contact.targetRadius);
  const near=Math.min(max,Math.max(0,distance-contact.targetRadius));
  const contactPosition={x:source.x+direction.x*near,y:source.y+direction.y*near};
  return {family:contact.family??null,progress:age/HOSTILE_STRIKE_FEEDBACK_MS,direction,contactPosition,radius:11};
}

// A local contact flourish survives a missed impact frame. Nothing joins the
// enemy to the victim: all marks stay within eleven pixels of the near face.
export function drawHostileContact(c,contact,age){
  if(drawDungeonMobContactV2A(c,contact,age)||drawDungeonMobContactV2B(c,contact,age))return;
  const pose=hostileContactPose(contact,age);if(!pose)return;
  const {family,progress:t,direction,contactPosition:p}=pose,s=1-t;
  c.save();c.translate(p.x,p.y-(family==='gargoyle'?12*.82:family==='animated_armor'?16*.76:family==='cursed_blade'?12.5*.78+1:family==='lava_serpent'?10*.78:8));c.rotate(Math.atan2(direction.y,direction.x));c.globalAlpha*=(1-t)**1.25;c.lineCap='round';
  switch(family){
    case 'sprout':c.strokeStyle='#e8d6ab';c.lineWidth=1.8;c.beginPath();c.arc(-1,0,4+2*t,-1.1,1.1);c.moveTo(2,-4);c.lineTo(4,-6);c.moveTo(2,4);c.lineTo(4,6);c.stroke();break;
    case 'slime':c.fillStyle='#83d872';for(let i=0;i<5;i++){const a=(i-2)*.5,r=3+5*t;c.beginPath();c.ellipse(Math.cos(a)*r,Math.sin(a)*r,1.2*s+.4,1.8*s+.4,a,0,Math.PI*2);c.fill();}break;
    case 'golem':c.fillStyle='#85929d';for(let i=0;i<4;i++){c.save();c.translate((i%2?1:-1)*(3+3*t),((i>>1)?1:-1)*(2+4*t));c.rotate(i*.7+t);c.fillRect(-1.5,-1.5,3,3);c.restore();}c.strokeStyle='#c7c3a9';c.lineWidth=1.7;c.beginPath();c.moveTo(-2,-5);c.lineTo(1,-1);c.lineTo(-1,1);c.lineTo(3,5);c.stroke();break;
    case 'gargoyle':c.strokeStyle='#c4cdd0';c.lineWidth=1.6;c.beginPath();c.moveTo(-4,-4);c.lineTo(4,4);c.moveTo(1,-4);c.lineTo(4,-6);c.moveTo(-1,4);c.lineTo(-4,6);c.stroke();break;
    case 'rust_nibbler':c.strokeStyle='#d59159';c.lineWidth=1.6;for(const side of [-1,1]){c.beginPath();c.moveTo(-3,side*(5+2*t));c.lineTo(1,side*2);c.lineTo(4,side*(4+2*t));c.stroke();}break;
    case 'animated_armor':c.strokeStyle='#d4e2dd';c.lineWidth=1.8;c.beginPath();c.moveTo(-5,-7);c.quadraticCurveTo(1,0,5,7);c.stroke();c.strokeStyle='#b99c6d';c.lineWidth=1;c.beginPath();c.moveTo(1,-3);c.lineTo(5,-5);c.moveTo(2,2);c.lineTo(6,3);c.stroke();break;
    case 'cursed_blade':c.strokeStyle='#b5a0cc';c.lineWidth=2;c.beginPath();c.moveTo(-5,0);c.lineTo(5,0);c.stroke();c.lineWidth=1;c.beginPath();c.moveTo(2,-4);c.lineTo(5,0);c.lineTo(2,4);c.stroke();break;
    case 'lava_serpent':c.fillStyle='#e68837';for(let i=0;i<3;i++){c.save();c.translate(2+3*t,(i-1)*(3+2*t));c.rotate(i*.8);c.fillRect(-1,-2,2,4);c.restore();}break;
    case 'hell_bat':c.strokeStyle='#c76d69';c.lineWidth=1.5;c.beginPath();c.moveTo(-4,-5);c.quadraticCurveTo(3,-2,4,4);c.moveTo(-1,-6);c.quadraticCurveTo(6,0,3,6);c.stroke();break;
    case 'slag_slime':c.fillStyle='#f77b25';c.beginPath();c.ellipse(1,0,3+2*t,2*(1-t)+1,.3,0,Math.PI*2);c.fill();c.fillStyle='#503d3e';c.save();c.translate(4,4*t);c.rotate(t);c.fillRect(-1.5,-1,3,2);c.restore();break;
    case 'swamp_basilisk':c.strokeStyle='#b8d4a7';c.lineWidth=1.6;for(const side of [-1,1]){c.beginPath();c.moveTo(-2,side*5);c.lineTo(2,side*1.5);c.lineTo(4,side*4);c.stroke();}break;
    case 'marsh_ghost':c.strokeStyle='#8ecabd';c.lineWidth=1.5;for(const side of [-1,1]){c.beginPath();c.moveTo(-5,side*4);c.bezierCurveTo(0,side*7,5,side*2,2,0);c.stroke();}break;
    case 'corroded_golem':c.fillStyle='#66867b';for(const side of [-1,1]){c.save();c.translate(1+3*t,side*(3+2*t));c.rotate(side*.4+t);c.fillRect(-2,-2,4,4);c.restore();}c.strokeStyle='#7bc28d';c.lineWidth=1;c.beginPath();c.moveTo(-2,-3);c.lineTo(1,0);c.lineTo(-1,3);c.stroke();break;
    default:c.fillStyle='#f3c6ad';c.beginPath();c.arc(0,0,2.5*s+.7,0,Math.PI*2);c.fill();
  }
  c.restore();
}
