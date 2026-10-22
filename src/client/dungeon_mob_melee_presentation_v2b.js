import {DUNGEON_MOBS_V2_MELEE_MOTION} from '../shared/content/dungeon_mobs_v2.js';
import {drawClockworkAttackV3} from './creature_presentation_clockwork_v3.js';
import {drawArthropodAttackV3} from './creature_presentation_arthropods_v3.js';
import {uprightAttackFrame} from './upright_attack_frame.js';
// Contact-melee presentation for the seven ordinary brass/neon Dungeon mobs.
// All poses are disposable; authoritative positions, timing and hit tests stay
// in World. Local +X is the animal/construct's attacking face.
const families=new Set(['clockwork_scarab','star_weaver','temporal_watcher','clockwork_drone','neon_spider','wireframe_orb','cyber_wraith']);
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const smooth=v=>{const x=clamp(v,0,1);return x*x*(3-2*x);};
// These heights match the admitted painter scale/drawOffset rows. Rotate about
// the source art's body center, then keep detached melee limbs on that same
// physical lunge; the feet-origin compensation is never a limb anchor.
const bodyHeights=Object.freeze({clockwork_scarab:-10.8,star_weaver:-9.36,temporal_watcher:-10.8,clockwork_drone:-9.6,neon_spider:-10.8,wireframe_orb:-10.8,cyber_wraith:-17.84});
export const DUNGEON_MOB_CONTACT_MS_V2B=190;

const uprightTuning={
 clockwork_scarab:{front:18,recoil:3,lean:-.1,hitLean:.08,squeezeX:.9,squeezeY:1.08,hitX:1.06,hitY:.94,rest:17,drawBack:14,openRest:.3,openBrace:1,openHit:0},
 star_weaver:{front:18,recoil:4,lift:-2,lean:-.1,hitLean:.08,squeezeX:.94,hitX:1.05,rest:13.2,drawBack:10.8,openRest:.1,openBrace:1,openHit:0},
 temporal_watcher:{front:22,recoil:3,lift:-1,lean:-.08,hitLean:.1,squeezeX:.96,squeezeY:1.06,hitX:1.04,hitY:.96,openBrace:1,openHit:1},
 clockwork_drone:{front:23,recoil:3,lift:2,lean:-.12,hitLean:.08,squeezeX:.96,hitX:1.04,rest:14,drawBack:12,openBrace:1,openHit:1},
 neon_spider:{front:16,recoil:3,lean:-.08,hitLean:.06,squeezeX:.9,squeezeY:1.08,hitX:1.08,hitY:.94,rest:16,drawBack:13,openBrace:1,openHit:0},
 wireframe_orb:{front:14,recoil:3.5,lean:-.2,hitLean:.18,squeezeX:.82,squeezeY:1.18,hitX:1.12,hitY:.9,openBrace:1,openHit:1,sweepBrace:-.2,sweepHit:.4},
 cyber_wraith:{front:17,recoil:4,lift:-5,lean:.15,hitLean:-.08,squeezeX:.88,squeezeY:1.15,hitX:1.06,hitY:.95,rest:10,drawBack:7,openBrace:1,openHit:1,sweepBrace:-.45,sweepHit:.5}
};
export function dungeonMobMeleePoseV2B(actor,tick){
 const phase=actor.meleePhase,g=actor.meleeGeometry,family=actor.enemyFamily;
 if(!families.has(family)||!actor.alive||!g||!phase||phase.phase==='idle')return null;
 const dx=g.targetPosition?g.targetPosition.x-actor.position.x:actor.presentationFacingX??1,dy=g.targetPosition?g.targetPosition.y-actor.position.y:0,distance=Math.hypot(dx,dy);
 const direction=distance>.001?{x:dx/distance,y:dy/distance}:{x:1,y:0},sourceRadius=g.sourceRadius,targetRadius=g.targetRadius;
 const centerLimit=g.mode==='clearHullGap'?g.reach+sourceRadius+targetRadius:g.reach,weaponReach=Math.max(sourceRadius,centerLimit-targetRadius),contactReach=clamp(distance-targetRadius,sourceRadius,weaponReach);
 const p=clamp((tick-phase.phaseStartedTick)/Math.max(1,phase.phaseEndsTick-phase.phaseStartedTick),0,1);
 const frame=uprightAttackFrame(uprightTuning[family],phase.phase,p,direction,contactReach);
 const timing=DUNGEON_MOBS_V2_MELEE_MOTION.wireframe_orb,orbPhaseOffset=phase.phase==='impact'?timing.windupTicks:phase.phase==='recovery'?timing.windupTicks+timing.impactTicks:0;
 return {family,phase:phase.phase,progress:p,direction,sourceRadius,targetRadius,centerLimit,weaponReach,contactReach,...frame,lunge:frame.anchor,presentationTick:tick,...(family==='star_weaver'?{idleFacingX:actor.presentationFacingX===-1?-1:1,starWeaverScale:actor.elite?.scale??1}:{}),
  ...(family==='neon_spider'?{idleFacingX:actor.presentationFacingX===-1?-1:1,neonSpiderScale:actor.elite?.scale??1}:{}),
  ...(family==='wireframe_orb'?{idleFacingX:actor.presentationFacingX===-1?-1:1,wireframeOrbScale:actor.elite?.scale??1,wireframeOrbActionStartTick:phase.phaseStartedTick-orbPhaseOffset}:{}),
  ...(family==='cyber_wraith'?{idleFacingX:actor.presentationFacingX===-1?-1:1,cyberWraithScale:actor.elite?.scale??1}:{}),
  bodyPivot:{x:0,y:bodyHeights[family]*(actor.elite?.scale??1)},upright:true,disableFacingFlip:false};
}

export function drawDungeonMobMeleeLimbV2B(c,pose,flash=false){
 if(drawClockworkAttackV3(c,pose,flash)||drawArthropodAttackV3(c,pose,flash))return true;
 if(!pose||!families.has(pose.family))return false;
 if(pose.family==='wireframe_orb')return true; // The actual cage vertex performs this contact strike.
 if(pose.family==='cyber_wraith')return true; // The attached energy claw performs this contact strike.
 const {family,limb,lunge,bodyPivot}=pose;c.save();c.translate(lunge.x+bodyPivot.x,lunge.y+bodyPivot.y);c.rotate(Math.atan2(pose.direction.y,pose.direction.x));c.lineJoin='round';c.lineCap='round';c.strokeStyle=flash?'#fff':'#30393c';c.lineWidth=1.4;
 const tip=limb.extension;
 c.strokeStyle=flash?'#fff':'#7ce7f8';c.lineWidth=1.5;for(const side of [-1,1]){c.beginPath();c.moveTo(3,side*3);c.quadraticCurveTo(tip*.6,side*(6+limb.open*2),tip,side*2);c.lineTo(tip-2,side*.3);c.stroke();}

 c.restore();return true;
}

export function drawDungeonMobContactV2B(c,contact,age){
 if(!families.has(contact?.family))return false;
 if(age<0||age>=DUNGEON_MOB_CONTACT_MS_V2B)return true;
 const source=contact.sourcePosition,target=contact.targetPosition;if(!source||!target)return true;
 const dx=target.x-source.x,dy=target.y-source.y,d=Math.hypot(dx,dy),direction=d>.001?{x:dx/d,y:dy/d}:{x:1,y:0};
 const reach=contact.mode==='clearHullGap'?contact.reach+contact.sourceRadius:Math.max(0,contact.reach-contact.targetRadius),near=Math.min(reach,Math.max(0,d-contact.targetRadius)),p=age/DUNGEON_MOB_CONTACT_MS_V2B,s=1-p;
 c.save();c.translate(source.x+direction.x*near,source.y+direction.y*near+bodyHeights[contact.family]);c.rotate(Math.atan2(direction.y,direction.x));c.globalAlpha*=s**1.25;c.lineCap='round';c.lineJoin='round';
 switch(contact.family){
  case 'clockwork_scarab':c.strokeStyle='#dbb46c';c.lineWidth=1.5;for(const side of [-1,1]){c.beginPath();c.moveTo(-3,side*(5+p));c.lineTo(1,side*1.5);c.lineTo(3,side*(3+p));c.stroke();}break;
  case 'star_weaver':c.strokeStyle='#c3e7ff';c.lineWidth=1.2;for(const side of [-1,1]){c.beginPath();c.moveTo(-4,side*4);c.lineTo(1,side*(1+p));c.lineTo(4,side*3);c.stroke();}c.fillStyle='#fff';c.beginPath();c.arc(0,0,1.4*s+.5,0,Math.PI*2);c.fill();break;
  case 'temporal_watcher':c.strokeStyle='#f2cc73';c.lineWidth=1.5;c.beginPath();c.arc(0,0,3+2*p,-1.2,1.2);c.stroke();for(const side of [-1,1]){c.beginPath();c.moveTo(1,side*4);c.lineTo(3,side*(5+2*p));c.stroke();}break;
  case 'clockwork_drone':c.fillStyle='#c9ae62';for(let i=0;i<3;i++){c.save();c.translate((i-1)*(3+p),i%2?3:-3);c.rotate(i*.8+p);c.fillRect(-1,-1,2,2);c.restore();}break;
  case 'neon_spider':c.strokeStyle='#ff74bc';c.lineWidth=1.4;for(const side of [-1,1]){c.beginPath();c.moveTo(-4,side*(4+p));c.lineTo(1,side);c.lineTo(4,side*(2+p));c.stroke();}break;
  case 'wireframe_orb':c.strokeStyle='#91ccfa';c.lineWidth=1.3;for(const side of [-1,1]){c.beginPath();c.moveTo(-3,side*4);c.lineTo(side*2,side*2);c.lineTo(4,side*5);c.stroke();}break;
  case 'cyber_wraith':c.strokeStyle='#76e5f6';c.lineWidth=1.4;for(const side of [-1,1]){c.beginPath();c.moveTo(-4,side*3);c.lineTo(1,side);c.lineTo(4,side*(4+p));c.stroke();}c.strokeStyle='#ed6faf';c.lineWidth=1;c.beginPath();c.moveTo(-2,-1);c.lineTo(2,1);c.stroke();break;
 }
 c.restore();return true;
}

export const hostileDungeonMeleePoseV2B=dungeonMobMeleePoseV2B;
export const drawDungeonMobLimbV2B=drawDungeonMobMeleeLimbV2B;
