import {uprightAttackFrame} from './upright_attack_frame.js';
import {drawRiftDrifterV4} from './creature_presentation_rift_drifter_v4.js';
import {drawVoidWraithV4} from './creature_presentation_void_wraith_v4.js';
import {drawVoidSpectreV4} from './creature_presentation_void_spectre_v4.js';
import {drawVoidCrawlerV4,voidCrawlerPoseV4} from './creature_presentation_void_crawler_v4.js';
import {drawGildedScuttlerV4,drawGildedScuttlerAttackV4} from './creature_presentation_gilded_scuttler_v4.js';
import {drawMimicShieldV4,mimicShieldBashRadiusV4} from './creature_presentation_mimic_shield_v4.js';
import {drawCoinElementalV4} from './creature_presentation_coin_elemental_v4.js';
import {DUNGEON_MOBS_V2_MELEE_MOTION} from '../shared/content/dungeon_mobs_v2.js';
// Source: SamTheBus/SAQ-Dungeon commit 387c78bfaf9f492fe7b6ff4539b956c12c2a7cdc.
// mob_renderer.js ordinary vType branches. World injects clock/seed and attack
// phases; none of these ordinary species gains a source-name-implied spell,
// projectile, block/parry ability, phasing movement or additional damage area.
export const DUNGEON_MOB_FAMILIES_V2A=Object.freeze(['gilded_scuttler','mimic_shield','void_crawler','void_spectre','void_wraith','rift_drifter','coin_elemental']);
export const DUNGEON_MOB_V2A_IDLE_FACING_LEFT=Object.freeze(['gilded_scuttler','void_crawler']);
export const DUNGEON_MOB_NATIVE_SCALES_V2A=Object.freeze({gilded_scuttler:.74,mimic_shield:.76,void_crawler:.75,void_spectre:.78,void_wraith:.78,rift_drifter:.82,coin_elemental:.7});

function draw_void_crawler(c,m,presentationTime,seed){
  const action=m.familyAttack,wind=action?.phase==='windup'?action.progress:0,hit=action?.phase==='impact'?1-action.progress:0,settle=action?.phase==='recovery'?1-action.progress:0;

        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + 2;
        let time = presentationTime / 150;
        c.strokeStyle = "#000000";
        c.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) {
          let segX = cx + i * 5.5;
          let segY = cy + Math.sin(time - i * 0.7) * 3.5;
          c.beginPath();
          c.moveTo(segX, segY + 1);
          c.lineTo(segX - 3, segY + 9 + Math.sin(time * 3.5 + i) * 2.5);
          c.stroke();
        }
        for (let i = 6; i >= 0; i--) {
          let segX = cx + i * 5.5;
          let segY = cy + Math.sin(time - i * 0.7) * 3.5;
          let radius = 6.2 - i * 0.7;
          c.fillStyle =
            m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#ff007f" : "#1a022b";
          c.beginPath();
          c.arc(segX, segY, radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          if (m.flashTimer === 0) {
            c.strokeStyle = "#8e44ad";
            c.lineWidth = 1.0;
            c.beginPath();
            c.moveTo(segX - 1, segY - radius + 2);
            c.lineTo(segX + 1, segY - radius + 2);
            c.stroke();
          }
        }
        c.fillStyle =
          m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#ff007f" : "#11001c";
        let hX = cx - 5;
        let hY = cy + Math.sin(time) * 3.5;
        c.beginPath();
        c.arc(hX, hY, 6.5, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.strokeStyle = "#8e44ad";
          c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(hX - 2, hY - 4);
          c.quadraticCurveTo(
            hX - 9,
            hY - 9 + Math.sin(time * 3) * 2.5,
            hX - 14,
            hY - 6 + Math.sin(time * 3) * 2.5,
          );
          c.stroke();
          c.fillStyle = "#ff007f";
          c.beginPath();
          c.arc(hX - 3, hY - 2, 1.0, 0, Math.PI * 2);
          c.arc(hX - 1, hY - 1, 0.8, 0, Math.PI * 2);
          c.arc(hX - 3, hY + 1, 0.8, 0, Math.PI * 2);
          c.fill();
        }
}

function draw_void_spectre(c,m,presentationTime,seed){
  const action=m.familyAttack,wind=action?.phase==='windup'?action.progress:0,hit=action?.phase==='impact'?1-action.progress:0,settle=action?.phase==='recovery'?1-action.progress:0;

        // Render a floating ethereal void phantom cloaked in cosmic energy
        let hover = Math.sin(presentationTime / 150) * 5;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;

        c.save();
        // Swirling Void Aura Backplate (Translucent glowing trail)
        let trailGrad = c.createLinearGradient(cx, cy - 14, cx, cy + 24);
        if (m.flashTimer > 0) {
          trailGrad.addColorStop(0, "#ffffff");
          trailGrad.addColorStop(1, "rgba(255,255,255,0)");
        } else {
          trailGrad.addColorStop(0, "rgba(142, 68, 173, 0.75)"); // Deep void purple
          trailGrad.addColorStop(0.5, "rgba(232, 67, 147, 0.4)"); // Hot magenta pink
          trailGrad.addColorStop(1, "rgba(0,0,0,0)");
        }

        c.fillStyle = trailGrad;
        c.beginPath();
        c.moveTo(cx - 14, cy - 5);
        c.quadraticCurveTo(cx - 18, cy + 10, cx - 5, cy + 24);
        c.lineTo(cx + 5, cy + 24);
        c.quadraticCurveTo(cx + 18, cy + 10, cx + 14, cy - 5);
        c.closePath();
        c.fill();

        // Main cloaked phantom torso (Wispy obsidian hood/robes)
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#0d011a"; // Pitch void black
        c.strokeStyle = "#000000";
        c.lineWidth = 1.8;
        c.beginPath();
        c.arc(cx, cy - 11, 8.5, Math.PI, 0); // Hood crown
        c.lineTo(cx + 8.5, cy + 4);
        c.quadraticCurveTo(cx + 5, cy + 12, cx, cy + 16); // Robe trail point
        c.quadraticCurveTo(cx - 5, cy + 12, cx - 8.5, cy + 4);
        c.closePath();
        c.fill();
        c.stroke();

        // Spooky glowing eyes inside the dark hood
        if (m.flashTimer === 0) {
          c.fillStyle = "#e84393"; // Intense magenta neon
          c.shadowBlur = 8;
          c.shadowColor = "#e84393";
          c.beginPath();
          // Slanted sinister phantom slits
          c.ellipse(cx - 3, cy - 10, 1.2, 3, Math.PI / 12, 0, Math.PI * 2);
          c.ellipse(cx + 3, cy - 10, 1.2, 3, -Math.PI / 12, 0, Math.PI * 2);
          c.fill();
          c.shadowBlur = 0; // Reset
        }

        // Idle side claws are replaced by the directional cross-rake during an attack.
        if (m.flashTimer === 0 && !action) {
          c.strokeStyle = "#8e44ad";
          c.lineWidth = 2.0;
          let clawSwing = Math.sin(presentationTime / 110) * 3;
          // Left Claw
          c.beginPath();
          c.moveTo(cx - 8, cy - 3);
          c.lineTo(cx - 16 + clawSwing, cy - 1);
          c.lineTo(cx - 19 + clawSwing, cy - 4);
          c.moveTo(cx - 8, cy - 3);
          c.lineTo(cx - 17 + clawSwing, cy + 3);
          c.stroke();
          // Right Claw
          c.beginPath();
          c.moveTo(cx + 8, cy - 3);
          c.lineTo(cx + 16 - clawSwing, cy - 1);
          c.lineTo(cx + 19 - clawSwing, cy - 4);
          c.moveTo(cx + 8, cy - 3);
          c.lineTo(cx + 17 - clawSwing, cy + 3);
          c.stroke();
        }
        c.restore();
}

function draw_void_wraith(c,m,presentationTime,seed){
  const action=m.familyAttack,wind=action?.phase==='windup'?action.progress:0,hit=action?.phase==='impact'?1-action.progress:0,settle=action?.phase==='recovery'?1-action.progress:0;

        let hover = Math.sin(presentationTime / 150) * 6;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 - 2 + hover;
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1b0a2a";
        c.strokeStyle = "#000000";
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(cx, cy - 16);
        c.quadraticCurveTo(cx - 12, cy - 6, cx - 10, cy + 14);
        c.lineTo(cx - 4, cy + 8);
        c.lineTo(cx, cy + 18);
        c.lineTo(cx + 4, cy + 8);
        c.lineTo(cx + 10, cy + 14);
        c.quadraticCurveTo(cx + 13, cy - 6, cx, cy - 16);
        c.closePath();
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          if(!action){
          c.strokeStyle = "#8e44ad";
          c.lineWidth = 2.0;
          let clawSwing = Math.sin(presentationTime / 100) * 3;
          c.beginPath();
          c.moveTo(cx - 8, cy + 2);
          c.lineTo(cx - 16 + clawSwing, cy + 4);
          c.lineTo(cx - 20 + clawSwing, cy + 1);
          c.moveTo(cx - 8, cy + 2);
          c.lineTo(cx - 17 + clawSwing, cy + 7);
          c.stroke();
          }
          c.fillStyle = "#e84393";
          c.shadowBlur = 6;
          c.shadowColor = "#e84393";
          c.beginPath();
          c.ellipse(cx - 3, cy - 5, 1.2, 3, Math.PI / 12, 0, Math.PI * 2);
          c.ellipse(cx + 1, cy - 5, 1.2, 3, -Math.PI / 12, 0, Math.PI * 2);
          c.fill();
          c.shadowBlur = 0;
        }
}

function draw_rift_drifter(c,m,presentationTime,seed){
  const action=m.familyAttack,wind=action?.phase==='windup'?action.progress:0,hit=action?.phase==='impact'?1-action.progress:0,settle=action?.phase==='recovery'?1-action.progress:0;

        let hover = Math.sin(presentationTime / 110) * 6;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;
        let coreGrad = c.createRadialGradient(cx, cy, 1, cx, cy, 12);
        coreGrad.addColorStop(0, "#ffffff");
        coreGrad.addColorStop(0.4, "#e84393");
        coreGrad.addColorStop(1, "rgba(142, 68, 173, 0)");
        c.fillStyle = coreGrad;
        c.beginPath();
        c.arc(cx, cy, 12, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#8e44ad";
        c.strokeStyle = "#000000";
        c.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
          const idleAngle=presentationTime/180+(i*TAU)/3,braceAngle=Math.PI+(i-1)*.6,hitAngle=(i===0?0:Math.PI+(i-1.5)*1.1)+(action?.limb.spin??0);
          const targetAngle=braceAngle+turn(hitAngle-braceAngle)*(action?.strikeBlend??0);
          let angle=idleAngle+turn(targetAngle-idleAngle)*(action?.artWeight??0);
          let sx = cx + Math.cos(angle) * (16-5*wind);
          let sy = cy + Math.sin(angle) * (8-2*wind);
          c.beginPath();
          c.moveTo(sx, sy - 4);
          c.lineTo(sx + 3, sy);
          c.lineTo(sx, sy + 4);
          c.lineTo(sx - 3, sy);
          c.closePath();
          c.fill();
          c.stroke();
        }
}

export const DUNGEON_MOB_PAINTERS_V2A=Object.freeze({gilded_scuttler:drawGildedScuttlerV4,mimic_shield:drawMimicShieldV4,void_crawler:drawVoidCrawlerV4,void_spectre:drawVoidSpectreV4,void_wraith:drawVoidWraithV4,rift_drifter:drawRiftDrifterV4,coin_elemental:drawCoinElementalV4});

const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=v=>{const p=clamp(v,0,1);return p*p*(3-2*p);};
const turn=a=>Math.atan2(Math.sin(a),Math.cos(a));
const families=new Set(DUNGEON_MOB_FAMILIES_V2A);
const pivot={gilded_scuttler:-12,mimic_shield:-12*.76,void_crawler:-8,void_spectre:-9,void_wraith:-11,rift_drifter:-10,coin_elemental:-12*.7};

const uprightTuning={
 gilded_scuttler:{front:16.5,recoil:3,lean:-.16,hitLean:.08,squeezeX:.94,squeezeY:.85,hitX:1.06,hitY:.95,rest:16.5,drawBack:13.5,openRest:.75,openBrace:3.3,openHit:0,spinBrace:-.08,spinHit:.1},
 mimic_shield:{front:13.5,recoil:3.5,lean:-.12,hitLean:.08,squeezeX:1,squeezeY:1,hitX:1,hitY:1,openRest:2.1,openBrace:2.8,openHit:1.1},
 void_crawler:{front:16,recoil:4,lift:-1.5,lean:-.14,hitLean:.08,squeezeX:.8,squeezeY:1.14,hitX:1.1,hitY:.9,rest:15,drawBack:12,openRest:1.2,openBrace:5,openHit:.7},
 void_spectre:{front:17.5,recoil:2,lift:-3,lean:-.12,hitLean:.08,squeezeX:.9,squeezeY:1.12,hitX:1.06,hitY:.97,rest:6,drawBack:4,openRest:3,openBrace:11,openHit:2,sweepHit:.5},
 void_wraith:{front:10.5,recoil:3.5,lift:-4,lean:.18,hitLean:-.1,squeezeX:.85,squeezeY:1.16,hitX:.96,hitY:1.06,rest:5,drawBack:2,openRest:0,openBrace:1,openHit:1,sweepBrace:-.7,sweepHit:.3},
 rift_drifter:{front:15.6,recoil:5,lift:-2,lean:-.08,hitLean:.1,squeezeX:.86,squeezeY:1.1,hitX:1.04,hitY:.96,orbitBrace:1,orbitHit:1,spinHit:.25},
 coin_elemental:{front:21.5,recoil:2.5,lift:-3,lean:-.1,hitLean:.1,squeezeX:1,squeezeY:1,hitX:1,hitY:1,rest:21.5,drawBack:12,orbitBrace:1,orbitHit:1,spinBrace:-.18,spinHit:.35}
};

// Continuous body and limb keyframes share the idle horizontal orientation.
// The actual attack direction belongs to the lunge and articulated limbs.
export function dungeonMobMeleePoseV2A(actor,tick){
 const family=actor.enemyFamily,phase=actor.meleePhase,g=actor.meleeGeometry;
 if(!families.has(family)||!actor.alive||!g||!phase||phase.phase==='idle')return null;
 const dx=g.targetPosition?g.targetPosition.x-actor.position.x:actor.presentationFacingX??1,dy=g.targetPosition?g.targetPosition.y-actor.position.y:0,distance=Math.hypot(dx,dy);
 const direction=distance>.001?{x:dx/distance,y:dy/distance}:{x:1,y:0};
 const sourceRadius=g.sourceRadius,targetRadius=g.targetRadius,centerLimit=g.mode==='clearHullGap'?g.reach+sourceRadius+targetRadius:g.reach;
 const weaponReach=Math.max(sourceRadius,centerLimit-targetRadius),contactReach=clamp(distance-targetRadius,sourceRadius,weaponReach);
 const p=clamp((tick-phase.phaseStartedTick)/Math.max(1,phase.phaseEndsTick-phase.phaseStartedTick),0,1);
 const tuning=family==='mimic_shield'?{...uprightTuning[family],front:mimicShieldBashRadiusV4(direction,uprightTuning[family].hitLean*direction.x,actor.presentationFacingX===-1?-1:1,actor.elite?.scale??1)}:uprightTuning[family];
 const frame=uprightAttackFrame(tuning,phase.phase,p,direction,contactReach);
 const coinTiming=DUNGEON_MOBS_V2_MELEE_MOTION.coin_elemental,coinPhaseOffset=phase.phase==='impact'?coinTiming.windupTicks:phase.phase==='recovery'?coinTiming.windupTicks+coinTiming.impactTicks:0;
 const pose={family,phase:phase.phase,progress:p,direction,sourceRadius,targetRadius,centerLimit,weaponReach,contactReach,...frame,
  upright:true,bodyPivot:{x:0,y:pivot[family]*(actor.elite?.scale??1)},disableFacingFlip:false,
  ...(family==='gilded_scuttler'?{gildedScuttlerScale:actor.elite?.scale??1,idleFacingX:actor.presentationFacingX===-1?-1:1}:family==='mimic_shield'?{mimicShieldScale:actor.elite?.scale??1,idleFacingX:actor.presentationFacingX===-1?-1:1}:family==='coin_elemental'?{coinElementalScale:actor.elite?.scale??1,idleFacingX:actor.presentationFacingX===-1?-1:1,presentationTick:tick,coinElementalActionStartTick:phase.phaseStartedTick-coinPhaseOffset,coinElementalActionSequence:phase.actionSequence??0}:family==='void_spectre'?{voidSpectreScale:actor.elite?.scale??1,idleFacingX:actor.presentationFacingX===-1?-1:1}:family==='void_wraith'?{voidWraithScale:actor.elite?.scale??1,idleFacingX:actor.presentationFacingX===-1?-1:1}:family==='rift_drifter'?{riftDrifterScale:actor.elite?.scale??1,idleFacingX:actor.presentationFacingX===-1?-1:1}:{})};
 return family==='void_crawler'?voidCrawlerPoseV4(actor,pose,tick):pose;
}

export function drawDungeonMobMeleeLimbV2A(c,pose,flash=false){
  if(!pose||!families.has(pose.family))return false;
  if(drawGildedScuttlerAttackV4(c,pose,flash))return true;
  if(pose.family==='void_crawler')return true; // The attached head and jaws perform the bite.
  if(pose.family==='void_spectre')return true; // The connected sleeves and actual claws perform the rake.
  if(pose.family==='void_wraith')return true; // One real claw commits while the other hand guards.
  if(pose.family==='rift_drifter')return true; // One of its three orbiting fragments makes contact.
  if(pose.family==='coin_elemental')return true; // One of the six real orbit coins makes contact.
  const {family,anchor,limb}=pose;
  if(!['gilded_scuttler','void_crawler','void_spectre','void_wraith','coin_elemental'].includes(family))return true;
  c.save();c.translate(anchor.x,anchor.y-8);c.rotate(Math.atan2(pose.direction.y,pose.direction.x));c.lineCap='round';c.lineJoin='round';
  if(family==='void_crawler'){
    c.strokeStyle=flash?'#fff':'#a57ab9';c.lineWidth=1.5;for(const side of [-1,1]){c.beginPath();c.moveTo(9,side*(limb.open+1));c.quadraticCurveTo(limb.extension-1,side*limb.open,limb.extension,side*.5);c.stroke();}
  }else if(family==='void_spectre'){
    for(const side of [-1,1]){const end=limb.extension,spread=limb.open;c.strokeStyle=flash?'#fff':'#63417f';c.lineWidth=2.8;c.beginPath();c.moveTo(1,side*6);c.quadraticCurveTo(end*.45,side*(spread+6),end-5,side*spread);c.stroke();
      c.strokeStyle=flash?'#fff':'#b484c4';c.lineWidth=1.2;for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(end-7,side*spread+i*2);c.quadraticCurveTo(end-2,side*(spread*.2)+i*1.5,end,side*.5+i);c.stroke();}}
  }else{
    c.rotate(limb.sweep);c.strokeStyle=flash?'#fff':'#54336f';c.lineWidth=3;c.beginPath();c.moveTo(1,5);c.quadraticCurveTo(limb.extension*.5,10,limb.extension-6,0);c.stroke();
    c.strokeStyle=flash?'#fff':'#b271ae';c.lineWidth=1.4;for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(limb.extension-7,i*2+1);c.quadraticCurveTo(limb.extension+1,i*2-4,limb.extension,i*2-2);c.stroke();}
  }
  c.restore();return true;
}

export function drawDungeonMobContactV2A(c,contact,age){
  if(!families.has(contact?.family))return false;
  if(age<0||age>=190||!contact.sourcePosition||!contact.targetPosition)return true;
  const dx=contact.targetPosition.x-contact.sourcePosition.x,dy=contact.targetPosition.y-contact.sourcePosition.y,d=Math.hypot(dx,dy),u=d>.001?{x:dx/d,y:dy/d}:{x:1,y:0};
  const max=contact.mode==='clearHullGap'?contact.reach+contact.sourceRadius:Math.max(0,contact.reach-contact.targetRadius),near=Math.min(max,Math.max(0,d-contact.targetRadius)),t=age/190;
  c.save();c.translate(contact.sourcePosition.x+u.x*near,contact.sourcePosition.y+u.y*near-(contact.family==='gilded_scuttler'?12:contact.family==='mimic_shield'?12*.76:contact.family==='coin_elemental'?12*.7:8));c.rotate(Math.atan2(u.y,u.x));c.globalAlpha*=(1-t)**1.25;c.lineCap='round';c.lineJoin='round';
  switch(contact.family){
    case 'gilded_scuttler':c.strokeStyle='#e6c76b';c.lineWidth=1.6;c.beginPath();c.moveTo(-3,-4);c.lineTo(1,0);c.lineTo(-3,4);c.moveTo(3,-4);c.lineTo(5,-6);c.moveTo(3,4);c.lineTo(5,6);c.stroke();break;
    case 'mimic_shield':c.strokeStyle='#d5bc83';c.lineWidth=1.6;c.beginPath();c.moveTo(-2,-5);c.lineTo(0,-1);c.lineTo(-1,2);c.lineTo(2,5);c.moveTo(3,-4);c.lineTo(6,-6);c.moveTo(4,0);c.lineTo(7,0);c.moveTo(3,4);c.lineTo(6,6);c.stroke();break;
    case 'void_crawler':c.strokeStyle='#a86cb4';c.lineWidth=1.4;for(const side of [-1,1]){c.beginPath();c.moveTo(-3,side*4);c.lineTo(1,side);c.lineTo(4,side*3);c.stroke();}break;
    case 'void_spectre':c.strokeStyle='#b886c8';c.lineWidth=1.3;for(const side of [-1,1]){c.beginPath();c.moveTo(-4,side*5);c.quadraticCurveTo(2,side*2,5,-side*3);c.stroke();}break;
    case 'void_wraith':c.strokeStyle='#bd76ac';c.lineWidth=1.5;for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(-4,i*2-3);c.bezierCurveTo(5,i*2-4,6,i*2,2,i*2+3);c.stroke();}break;
    case 'rift_drifter':c.strokeStyle='#c98cbb';c.lineWidth=1.2;for(let i=0;i<3;i++){c.save();c.translate((i-1)*(3+2*t),(i%2?3:-2));c.rotate(i*.5);c.beginPath();c.moveTo(0,-2.5);c.lineTo(1.6,0);c.lineTo(0,2.5);c.lineTo(-1.6,0);c.closePath();c.stroke();c.restore();}break;
    case 'coin_elemental':c.strokeStyle='#e8c96c';c.lineWidth=1.4;c.beginPath();c.arc(-1,0,4,-1,1);c.moveTo(2,-5);c.lineTo(5,-7);c.moveTo(3,0);c.lineTo(7,0);c.moveTo(2,5);c.lineTo(5,7);c.stroke();break;
  }
  c.restore();return true;
}
