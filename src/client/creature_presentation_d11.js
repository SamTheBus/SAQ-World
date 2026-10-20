import {DUNGEON_MOB_PAINTERS_V2A,DUNGEON_MOB_V2A_IDLE_FACING_LEFT} from './creature_presentation_dungeon_mobs_v2a.js';
import {DUNGEON_MOB_PAINTERS_V2B} from './creature_presentation_dungeon_mobs_v2b.js';
import {DUNGEON_MOB_PAINTERS_V1,hostileRangedPose} from './creature_presentation_dungeon_mobs_v1.js';
import {hostileMeleePose,drawHostileMeleeLimb} from './hostile_melee_presentation.js';
import {drawFilteredCreatureSurface} from './filtered_creature_surface.js';
import {creaturePresentationD11_1} from '../shared/content/creature_presentation_d11_1.js';
import {drawBloodBerserkerBadgeD12_4H_A,drawBloodBerserkerFrontD12_4H_A,drawBloodBerserkerRearD12_4H_A,drawGlacialWardenAuraD12_4E,drawGlacialWardenBadgeD12_4E,drawGlacialWardenPulseD12_4E,drawGlacialWardenSigilD12_4E,drawIronCitadelBadgeD12_4G,drawIronCitadelFrontD12_4G,drawIronCitadelRearD12_4G,drawIronGuardFrontD12_4G,drawIronGuardRearD12_4G,drawNullifierBadgeD12_4I,drawNullifierFrontD12_4I,drawNullifierRearD12_4I,drawSlagShaperBadgeD12_4K,drawSlagShaperFrontD12_4K,drawSlagShaperRearD12_4K,drawSwiftCommanderAuraD12_4D,drawSwiftCommanderBadgeD12_4D,drawSwiftCommanderPulseD12_4D,drawSwiftCommanderSigilD12_4D,drawSwiftHasteD12_4D,drawToxicDecayBadgeD12_4F,drawToxicDecayFrontD12_4F,drawToxicDecayRearD12_4F,drawVitalityWeaverAuraD12_4,drawVitalityWeaverBadgeD12_4,drawVitalityWeaverPulseD12_4,drawVitalityWeaverSigilD12_4,drawWebWeaverBadgeD12_4J,drawWebWeaverFrontD12_4J,drawWebWeaverRearD12_4J} from './elite_presentation_d12_4.js';
import {drawActorStatusRow,drawEliteAffixIdentitySlot} from './actor_status_presentation.js';

// Narrow H4A mob_renderer.js family blocks; presentation clock is injected.
// No Dungeon imports, globals, live-state ownership or authoritative randomness.
function draw_sprout(c,m,presentationTime){
        const pose=attackPose(m);let squish = Math.sin(presentationTime / 110) * 1.5+pose.windup*3-pose.impact*3;
        let wScale = (m.w / 2 + squish) * 0.65;
        let hScale = (m.h / 2 - squish) * 0.65;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h - 4;
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#fdf6e2";
        c.beginPath();
        c.ellipse(
          cx,
          cy - hScale * 0.4,
          wScale * 0.65,
          hScale * 0.45,
          0,
          0,
          Math.PI * 2,
        );
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "#1e272e";
          let eyeOffsetX = wScale * 0.22;
          let eyeY = cy - hScale * 0.45;
          let eyeSize = Math.max(1, hScale * 0.12);
          c.beginPath();
          c.arc(cx - eyeOffsetX, eyeY, eyeSize, 0, Math.PI * 2);
          c.arc(cx + eyeOffsetX, eyeY, eyeSize, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = "rgba(231, 76, 60, 0.45)";
          c.beginPath();
          c.ellipse(cx - eyeOffsetX - 2, eyeY + 2, 2, 1, 0, 0, Math.PI * 2);
          c.ellipse(cx + eyeOffsetX + 2, eyeY + 2, 2, 1, 0, 0, Math.PI * 2);
          c.fill();
        }
        let capY = cy - hScale * 1.05;
        c.fillStyle =
          m.flashTimer > 0 ? "#ffffff" : "#ff6b1a";
        c.beginPath();
        c.ellipse(cx, capY, wScale * 1.25, hScale * 0.85, 0, Math.PI, 0);
        c.lineTo(cx + wScale * 1.25, capY + hScale * 0.1);
        c.quadraticCurveTo(
          cx,
          capY + hScale * 0.4,
          cx - wScale * 1.25,
          capY + hScale * 0.1,
        );
        c.closePath();
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "rgba(255, 255, 255, 0.5)";
          c.beginPath();
          c.ellipse(
            cx - wScale * 0.5,
            capY - hScale * 0.35,
            wScale * 0.3,
            hScale * 0.15,
            -Math.PI / 6,
            0,
            Math.PI * 2,
          );
          c.fill();
        }
      }
function draw_golem(c,m,presentationTime){
        // --- MOUNTAIN PEAK OVERHAUL: ANCIENT STONE GOLEM ---
        let time = presentationTime;
        const pose=attackPose(m);let hover = pose.active?-pose.windup*3+pose.impact*4:Math.sin(time / 200) * 3.5;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;

        let bodyColor = m.flashTimer > 0 ? "#ffffff" : "#4a5568"; // Dark basalt
        let mossColor = m.flashTimer > 0 ? "#ffffff" : "#2d5a27"; // Overgrown moss
        let coreColor = "#38bdf8"; // Azure energy

        // 1. Draw Large Levitating Boulders (Back Shoulders)
        c.fillStyle = bodyColor;
        for (let i = -1; i <= 1; i += 2) {
          c.save();
          c.translate(cx + i * 11, cy - 10);
          c.rotate(i * 0.2 + Math.sin(time / 400 + i) * 0.1);
          c.beginPath();
          c.roundRect(-5, -5, 10, 12, [2]);
          c.fill();
          c.stroke();
          // Chiseled highlights
          if (m.flashTimer === 0) {
            c.strokeStyle = "rgba(255,255,255,0.15)";
            c.lineWidth = 1;
            c.strokeRect(-3, -3, 2.5, 2.5);
          }
          c.restore();
        }

        // 2. Main Basalt Core Torso
        c.fillStyle = bodyColor;
        c.beginPath();
        c.moveTo(cx - 12, cy - 7);
        c.lineTo(cx + 12, cy - 7);
        c.lineTo(cx + 15, cy + 5);
        c.lineTo(cx, cy + 16);
        c.lineTo(cx - 15, cy + 5);
        c.closePath();
        c.fill();
        c.stroke();

        // 3. Mossy Overgrowth Patches
        if (m.flashTimer === 0) {
          c.fillStyle = mossColor;
          c.beginPath();
          c.ellipse(cx - 5, cy - 3, 4, 2.5, Math.PI / 4, 0, Math.PI * 2);
          c.ellipse(cx + 7, cy + 3, 3.5, 2, -Math.PI / 6, 0, Math.PI * 2);
          c.fill();
        }

        // 4. Floating Granite Head
        let headY = cy - 20;
        c.fillStyle = "#718096";
        c.beginPath();
        c.roundRect(cx - 8, headY - 7, 16, 14, [4]);
        c.fill();
        c.stroke();

        // 5. Pulsing Runic Core Eye
        if (m.flashTimer === 0) {
          let pulse = 0.8 + Math.sin(time / 150) * 0.2;
          c.save();
          c.shadowBlur = 10 * pulse;
          c.shadowColor = coreColor;
          c.fillStyle = coreColor;
          c.beginPath();
          c.arc(cx, headY, 3.2 * pulse, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = "#ffffff";
          c.beginPath();
          c.arc(cx, headY, 1.0, 0, Math.PI * 2);
          c.fill();
          c.restore();
        }

        // 6. Heavy Floating Gauntlets
        if(!m.familyAttack)for (let i = -1; i <= 1; i += 2) {
          let handX = cx + i * (18+pose.windup*2+pose.impact*6);
          let handY = cy + 3 + Math.sin(time / 250 + i) * 2-pose.windup*4+pose.impact*3;
          c.save();
          c.translate(handX, handY);
          c.rotate(i * 0.15);
          c.fillStyle = bodyColor;
          c.beginPath();
          c.roundRect(-6, -7, 12, 16, [3]);
          c.fill();
          c.stroke();
          // Runic Markings on Fists
          if (m.flashTimer === 0) {
            c.strokeStyle = coreColor;
            c.lineWidth = 1.2;
            c.globalAlpha = 0.6 + Math.sin(time / 150) * 0.4;
            c.beginPath();
            c.moveTo(-2.5, -1.5);
            c.lineTo(2.5, -1.5);
            c.moveTo(0, -3.5);
            c.lineTo(0, 1.5);
            c.stroke();
          }
          c.restore();
        }
      }

function draw_slime(c,m,presentationTime){
        const pose=attackPose(m);let squish = m.familyAttack?0:Math.sin(presentationTime / 100) * 2.0+pose.windup*3-pose.impact*3.5;
        let wScale = (m.w / 2) * 0.7 + squish;
        let hScale = (m.h / 2) * 0.7 - squish;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h - 6 + squish / 2;

        let slimeGrad = c.createRadialGradient(
          cx - 3,
          cy - 5,
          2,
          cx,
          cy,
          m.w * 0.75,
        );
        if (m.flashTimer > 0) {
          slimeGrad.addColorStop(0, "#ffffff");
          slimeGrad.addColorStop(1, "#ffffff");

        } else {
          slimeGrad.addColorStop(0, "#a3fd83");
          slimeGrad.addColorStop(1, "#2ecc71");
        }

        c.fillStyle = slimeGrad;
        c.beginPath();
        c.ellipse(cx, cy, wScale * 1.15, hScale * 0.95, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.fillStyle = "rgba(255, 255, 255, 0.6)";
          c.beginPath();
          c.ellipse(
            cx - wScale * 0.4,
            cy - hScale * 0.4,
            wScale * 0.25,
            hScale * 0.2,
            Math.PI / 4,
            0,
            Math.PI * 2,
          );
          c.fill();

          c.save();
          c.strokeStyle = "#4d2e1a";
          c.lineWidth = 2.5;
          c.beginPath();
          let stemTopY = cy - hScale * 0.95;
          c.moveTo(cx, stemTopY);
          c.quadraticCurveTo(cx - 2, stemTopY - 8, cx + 4, stemTopY - 12);
          c.stroke();

          c.fillStyle = "#2ecc71";
          c.beginPath();
          c.ellipse(
            cx + 4,
            stemTopY - 12,
            5,
            2.5,
            -Math.PI / 6,
            0,
            Math.PI * 2,
          );
          c.fill();
          c.strokeStyle = "#000000";
          c.lineWidth = 1.2;
          c.stroke();
          c.restore();

          c.fillStyle = "#1e272e";
          let eyeOffsetX = wScale * 0.3;
          let eyeOffsetY = hScale * 0.1;
          let eyeRadius = Math.max(1, hScale * 0.12);
          c.beginPath();
          c.arc(cx - eyeOffsetX, cy - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
          c.arc(cx + eyeOffsetX, cy - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
          c.fill();

          c.fillStyle = "#ffffff";
          c.beginPath();
          c.arc(
            cx - eyeOffsetX - eyeRadius * 0.2,
            cy - eyeOffsetY - eyeRadius * 0.2,
            eyeRadius * 0.3,
            0,
            Math.PI * 2,
          );
          c.arc(
            cx + eyeOffsetX - eyeRadius * 0.2,
            cy - eyeOffsetY - eyeRadius * 0.2,
            eyeRadius * 0.3,
            0,
            Math.PI * 2,
          );
          c.fill();

          c.strokeStyle = "#1e272e";
          c.lineWidth = 2;
          c.beginPath();
          c.arc(cx, cy + hScale * 0.05, wScale * 0.12, 0, Math.PI);
          c.stroke();

          c.fillStyle = "rgba(231, 76, 60, 0.4)";
          c.beginPath();
          c.ellipse(
            cx - eyeOffsetX - 2,
            cy - eyeOffsetY + 3,
            2.5,
            1.2,
            0,
            0,
            Math.PI * 2,
          );
          c.ellipse(
            cx + eyeOffsetX + 2,
            cy - eyeOffsetY + 3,
            2.5,
            1.2,
            0,
            0,
            Math.PI * 2,
          );
          c.fill();
        }
      }

const attackPose=m=>{const phase=m.meleePhase?.phase??(m.meleeAction?'impact':'idle'),p=m.phaseProgress??0;return {phase,p,windup:phase==='windup'?p:0,impact:phase==='impact'?1-p*.28:0,recovery:phase==='recovery'?1-p:0,active:phase!=='idle'};};

function draw_gargoyle(c,m,presentationTime,seed){
  const time=presentationTime,pose=attackPose(m),action=pose.active,walk=m.motionBlend??0,cx=m.x+m.w/2+Math.sin(m.stepPhase??0)*walk*1.2;
  const base=m.y+m.h-1,cy=base-11+(action?0:Math.sin(time/210+(seed%11))*.7)-Math.abs(Math.sin(m.stepPhase??0))*walk;
  const flash=m.flashTimer>0,outline='#20282b',stone=flash?'#fff':'#697579',stoneLight=flash?'#fff':'#899397',stoneDark=flash?'#fff':'#414d51',moss=flash?'#fff':'#496a43',core='#e3a84a';
  c.save();c.strokeStyle=outline;c.lineWidth=2;c.lineJoin='round';c.lineCap='round';
  // Compact, upward-swept bat wings sit behind the masonry body.
  for(let side=-1;side<=1;side+=2){
    const flex=m.familyAttack?(pose.phase==='windup'?-4*pose.windup:pose.phase==='impact'?7*(1-pose.p*.3):5*pose.recovery):(action?2.5+pose.impact*2:Math.sin(time/180+side)*1.2+Math.sin((m.stepPhase??0)+side)*walk*2);
    c.fillStyle=stoneDark;c.beginPath();
    c.moveTo(cx+side*5,cy-6);
    c.lineTo(cx+side*(action?20:17),cy-17-flex);
    c.lineTo(cx+side*18,cy-5);
    c.lineTo(cx+side*13,cy+3);
    c.lineTo(cx+side*7,cy+1);c.closePath();c.fill();c.stroke();
    if(!flash){c.strokeStyle='#788286';c.lineWidth=1;c.beginPath();c.moveTo(cx+side*7,cy-6);c.lineTo(cx+side*15,cy-12-flex*.4);c.moveTo(cx+side*8,cy-2);c.lineTo(cx+side*14,cy);c.stroke();c.strokeStyle=outline;c.lineWidth=2;}
  }
  // Blocky torso with two stone planes and squat clawed feet.
  c.fillStyle=stone;c.beginPath();c.moveTo(cx-9,cy-7);c.lineTo(cx+9,cy-7);c.lineTo(cx+11,cy+7);c.lineTo(cx+5,cy+12);c.lineTo(cx-6,cy+12);c.lineTo(cx-11,cy+6);c.closePath();c.fill();c.stroke();
  if(!flash){c.fillStyle=stoneLight;c.beginPath();c.moveTo(cx-8,cy-6);c.lineTo(cx-1,cy-5);c.lineTo(cx-2,cy+8);c.lineTo(cx-6,cy+10);c.closePath();c.fill();c.fillStyle=stoneDark;c.beginPath();c.moveTo(cx+2,cy-5);c.lineTo(cx+8,cy-5);c.lineTo(cx+9,cy+6);c.lineTo(cx+4,cy+10);c.closePath();c.fill();}
  c.fillStyle=stoneDark;c.beginPath();c.moveTo(cx-7,cy+10);c.lineTo(cx-13,cy+14);c.lineTo(cx-4,cy+14);c.closePath();c.moveTo(cx+7,cy+10);c.lineTo(cx+13,cy+14);c.lineTo(cx+4,cy+14);c.closePath();c.fill();c.stroke();
  // Masonry head, brow, muzzle and readable horns.
  const headY=cy-13;c.fillStyle=stone;c.beginPath();c.roundRect(cx-8,headY-7,16,14,[4]);c.fill();c.stroke();
  c.fillStyle=stoneLight;c.beginPath();c.moveTo(cx-7,headY-5);c.lineTo(cx,headY-7);c.lineTo(cx,headY+4);c.lineTo(cx-6,headY+3);c.closePath();c.fill();
  c.fillStyle=stoneDark;c.beginPath();c.moveTo(cx-6,headY-5);c.quadraticCurveTo(cx-12,headY-13,cx-15,headY-11);c.lineTo(cx-7,headY-1);c.closePath();c.moveTo(cx+6,headY-5);c.quadraticCurveTo(cx+12,headY-13,cx+15,headY-11);c.lineTo(cx+7,headY-1);c.closePath();c.fill();c.stroke();
  c.strokeStyle=outline;c.lineWidth=2;c.beginPath();c.moveTo(cx-6,headY-1);c.lineTo(cx-1,headY-2);c.moveTo(cx+1,headY-2);c.lineTo(cx+6,headY-1);c.stroke();
  c.fillStyle=stoneDark;c.beginPath();c.roundRect(cx-5,headY+2,10,5,[2]);c.fill();c.stroke();
  if(!flash){c.fillStyle='#fff4c8';c.shadowBlur=5;c.shadowColor=core;c.beginPath();c.arc(cx-3,headY,1.4,0,Math.PI*2);c.arc(cx+3,headY,1.4,0,Math.PI*2);c.fill();c.shadowBlur=0;
    const pulse=.85+Math.sin(time/180)*.15;c.save();c.shadowBlur=7*pulse;c.shadowColor=core;c.fillStyle=core;c.beginPath();c.moveTo(cx,cy-5);c.lineTo(cx-3,cy-1);c.lineTo(cx,cy+3);c.lineTo(cx+3,cy-1);c.closePath();c.fill();c.restore();
    c.fillStyle=moss;c.beginPath();c.ellipse(cx-7,cy+2,4,2.5,-.35,0,Math.PI*2);c.ellipse(cx+6,cy+8,3,2,.4,0,Math.PI*2);c.fill();}
  // Keep the carried greatsword tucked back during the new claw/pounce gesture.
  {const swordAngle=m.familyAttack?-.92:-.72-pose.windup*.55+pose.impact*1.45+pose.recovery*.45;c.save();c.translate(cx-11+(m.familyAttack?0:pose.impact*5),cy+7-(m.familyAttack?0:pose.windup*2));c.rotate(swordAngle);c.fillStyle=flash?'#fff':'#8d999c';c.beginPath();c.moveTo(-2,-19);c.lineTo(0,-23);c.lineTo(2,-19);c.lineTo(2,4);c.lineTo(-2,4);c.closePath();c.fill();c.stroke();c.fillStyle=stoneDark;c.fillRect(-6,1,12,3);c.strokeRect(-6,1,12,3);c.fillStyle='#5b4532';c.fillRect(-2,4,4,8);c.strokeRect(-2,4,4,8);if(!flash){c.strokeStyle=core;c.lineWidth=.8;c.beginPath();c.moveTo(0,-17);c.lineTo(0,-7);c.stroke();}c.restore();}
  c.restore();
}

function draw_rust_nibbler(c,m,presentationTime,seed){
  const time=presentationTime,pose=attackPose(m),active=Boolean(m.movedLastTick||pose.active),cx=m.x+m.w/2+(pose.impact*4-pose.windup*2),cy=m.y+m.h-9;
  const flash=m.flashTimer>0,outline='#2b211a',dark=flash?'#fff':'#563b2b',rust=flash?'#fff':'#b65327',mid=flash?'#fff':'#d07635',light=flash?'#fff':'#e3a05b',eye='#f0cf67';
  c.save();c.lineJoin='round';c.lineCap='round';c.strokeStyle=outline;c.lineWidth=2;
  // Six two-segment legs retain their joints at small gameplay scale.
  for(let side=-1;side<=1;side+=2)for(let j=0;j<3;j++){
    const phase=time/75+j*1.4+side,step=active?Math.sin(phase)*3:Math.sin(phase)*.45;
    const rootX=cx+side*(5+j*2.5),rootY=cy+1+j*.7,jointX=rootX+side*(6+j),jointY=cy+5+j*1.2;
    c.strokeStyle=dark;c.lineWidth=2.4;c.beginPath();c.moveTo(rootX,rootY);c.lineTo(jointX+step*side,jointY);c.lineTo(jointX+side*6+step*side,cy+10);c.stroke();
  }
  // Layered carapace planes replace the capsule read.
  c.fillStyle=rust;c.beginPath();c.ellipse(cx,cy,14,8.5,0,0,Math.PI*2);c.fill();c.strokeStyle=outline;c.lineWidth=2;c.stroke();
  if(!flash){c.fillStyle=light;c.beginPath();c.ellipse(cx-5,cy-2,5.5,5.7,-.1,Math.PI*.55,Math.PI*1.48);c.fill();c.fillStyle=mid;c.beginPath();c.ellipse(cx+2,cy-1,6.5,6.8,.08,Math.PI*1.05,Math.PI*1.9);c.fill();
    c.strokeStyle='#74371f';c.lineWidth=1.2;c.beginPath();c.moveTo(cx-5,cy-6);c.lineTo(cx-6,cy+6);c.moveTo(cx+1,cy-8);c.lineTo(cx+1,cy+8);c.moveTo(cx+7,cy-6);c.lineTo(cx+7,cy+5);c.stroke();
    c.fillStyle='rgba(255,220,150,.35)';c.beginPath();c.ellipse(cx-5,cy-4,4,1.3,-.2,0,Math.PI*2);c.fill();}
  // Dark scavenger head, biting maw and clustered sulfur eyes.
  c.fillStyle=dark;c.beginPath();c.ellipse(cx+12,cy,6,5.5,0,0,Math.PI*2);c.fill();c.strokeStyle=outline;c.lineWidth=2;c.stroke();
  if(!m.familyAttack){c.fillStyle=outline;c.beginPath();c.moveTo(cx+16,cy+1);c.lineTo(cx+21+pose.impact*4,cy+(pose.windup?-1:pose.impact?6:2));c.lineTo(cx+16,cy+4);c.closePath();c.fill();}
  if(!flash){c.fillStyle=eye;c.shadowBlur=3;c.shadowColor=eye;c.beginPath();c.arc(cx+13.5,cy-2,1.7,0,Math.PI*2);c.arc(cx+10.5,cy-2.5,.8,0,Math.PI*2);c.arc(cx+13,cy+1.5,.75,0,Math.PI*2);c.fill();c.shadowBlur=0;}
  const twitch=Math.sin(time/85+(seed%7))*(active?3:1.2);c.strokeStyle=rust;c.lineWidth=1.5;
  for(let side=-1;side<=1;side+=2){c.beginPath();c.moveTo(cx+13,cy-3);c.quadraticCurveTo(cx+19,cy-10+side*twitch,cx+24,cy-7+side*twitch);c.stroke();}
  c.restore();
}

export function animatedArmorPoseD11_2(m,presentationTime,seed){const pose=attackPose(m),walk=m.motionBlend??0,cycle=m.stepPhase??0,death=m.deathProgress??0,step=Math.sin(cycle)*3.2*walk,leftLift=Math.max(0,Math.sin(cycle))*2.8*walk*(1-death),rightLift=Math.max(0,-Math.sin(cycle))*2.8*walk*(1-death),weight=Math.sin(cycle)*1.1*walk-pose.windup*1.6+pose.impact*3;return {pose,walk,cycle,death,step,leftLift,rightLift,weight,helmetFollow:-weight*.35+Math.sin(presentationTime/260+(seed%9))*.35*(1-walk)};}

function draw_animated_armor(c,m,presentationTime,seed){
  const time=presentationTime,art=animatedArmorPoseD11_2(m,time,seed),{pose,walk,cycle,death,step,leftLift,rightLift,weight}=art,cx=m.x+m.w/2,base=m.y+m.h-1,torsoX=cx+weight+death*8,torsoY=base-15-Math.abs(Math.sin(cycle))*.6*walk+death*13,flash=m.flashTimer>0,separate=(flash?2.2:0)+death*2,outline='#1c2528',iron=flash?'#fff':'#59686b',ironLight=flash?'#fff':'#91a0a2',ironDark=flash?'#fff':'#344247',rust=flash?'#fff':'#76543b',spirit='#91c5ad';
  c.save();c.lineJoin='round';c.lineCap='round';c.strokeStyle=outline;c.lineWidth=2.2;
  // Greaves and feet move independently. The planted foot remains on the
  // ground while the opposite foot advances and lifts.
  const leg=(side,x,lift)=>{c.save();c.translate(x+side*separate+side*death*4,base-lift);c.rotate(side*step*.018+side*death*.7);c.fillStyle=ironDark;c.beginPath();c.moveTo(-4,-13);c.lineTo(4,-13);c.lineTo(3,-3);c.lineTo(5,0);c.lineTo(-5,0);c.lineTo(-3,-3);c.closePath();c.fill();c.stroke();if(!flash){c.fillStyle=iron;c.beginPath();c.moveTo(-3,-11);c.lineTo(0,-12);c.lineTo(0,-2);c.lineTo(-3,-2);c.closePath();c.fill();}c.restore();};
  leg(-1,cx-6-step,leftLift);leg(1,cx+6+step,rightLift);
  if(!flash){c.save();c.strokeStyle='rgba(145,197,173,.48)';c.lineWidth=2;c.shadowBlur=5;c.shadowColor=spirit;c.beginPath();c.moveTo(cx-6-step,base-leftLift-13);c.quadraticCurveTo(torsoX-5,torsoY+8,torsoX-8,torsoY-3);c.moveTo(cx+6+step,base-rightLift-13);c.quadraticCurveTo(torsoX+5,torsoY+8,torsoX+8,torsoY-3);c.stroke();c.restore();}
  // Breastplate carries the weight shift while the head and shoulders lag.
  c.save();c.translate(torsoX,torsoY);c.rotate(-weight*.012+death*.85);c.fillStyle=iron;c.beginPath();c.moveTo(-11,-10);c.lineTo(11,-10);c.lineTo(9,8);c.lineTo(0,13);c.lineTo(-9,8);c.closePath();c.fill();c.stroke();if(!flash){c.fillStyle=ironLight;c.beginPath();c.moveTo(-9,-8);c.lineTo(-1,-9);c.lineTo(-2,8);c.lineTo(-7,6);c.closePath();c.fill();c.fillStyle=ironDark;c.beginPath();c.moveTo(2,-8);c.lineTo(9,-8);c.lineTo(7,6);c.lineTo(2,9);c.closePath();c.fill();c.strokeStyle=rust;c.lineWidth=1;c.beginPath();c.moveTo(-7,-2);c.lineTo(-4,0);c.moveTo(5,4);c.lineTo(8,2);c.stroke();}c.restore();
  const shoulderCounter=-step*.25-pose.windup*3+pose.impact*4,shoulderY=torsoY-6;
  // Shield-side arm: pauldron, vambrace and gauntlet are distinct pieces.
  c.fillStyle=ironDark;c.beginPath();c.ellipse(torsoX-14-separate,shoulderY+shoulderCounter*.08,7,5,-.25,0,Math.PI*2);c.fill();c.stroke();c.save();c.translate(torsoX-15-separate,shoulderY+4);c.rotate(.12+step*.025);c.fillStyle=iron;c.beginPath();c.roundRect(-4,-2,7,11,[3]);c.fill();c.stroke();c.fillStyle=ironDark;c.beginPath();c.roundRect(-4,8,7,5,[2]);c.fill();c.stroke();c.restore();
  // Weapon arm counter-rotates during walking, pulls back, commits and recovers.
  if(!m.familyAttack){const armAngle=.2-step*.035-pose.windup*.78+pose.impact*1.45+pose.recovery*.5+death*.8;c.fillStyle=ironDark;c.beginPath();c.ellipse(torsoX+14+separate,shoulderY-shoulderCounter*.08+death*5,7,5,.25,0,Math.PI*2);c.fill();c.stroke();c.save();c.translate(torsoX+14+separate,shoulderY+3+death*5);c.rotate(armAngle);c.fillStyle=iron;c.beginPath();c.roundRect(-3,-2,7,12,[3]);c.fill();c.stroke();c.fillStyle=ironDark;c.beginPath();c.roundRect(-3,8,7,5,[2]);c.fill();c.stroke();c.translate(1,12);c.rotate(.1+pose.impact*.25);c.fillStyle=rust;c.fillRect(-6,-2,12,3);c.strokeRect(-6,-2,12,3);c.fillStyle=ironDark;c.fillRect(-2,0,4,7);c.strokeRect(-2,0,4,7);if(!flash){c.shadowBlur=5;c.shadowColor=spirit;}c.fillStyle=flash?'#fff':'#809194';c.strokeStyle=outline;c.beginPath();c.moveTo(-2,0);c.lineTo(0,26);c.lineTo(3,20);c.lineTo(2,0);c.closePath();c.fill();c.stroke();c.restore();}
  // The empty sallet follows the torso with restrained delayed movement.
  const follow=art.helmetFollow;c.save();c.translate(torsoX+follow+separate*.2-death*15,torsoY-16-separate+death*19);c.rotate(-weight*.008+pose.impact*.08-death*.95);c.fillStyle=iron;c.beginPath();c.moveTo(-8,-2);c.quadraticCurveTo(0,-10,8,-2);c.lineTo(7,6);c.lineTo(4,9);c.lineTo(-6,8);c.lineTo(-8,4);c.closePath();c.fill();c.stroke();if(!flash){c.fillStyle=ironLight;c.beginPath();c.moveTo(-6,-2);c.quadraticCurveTo(-2,-7,0,-6);c.lineTo(-1,5);c.lineTo(-5,5);c.closePath();c.fill();c.fillStyle='#172226';c.beginPath();c.moveTo(-6,2);c.lineTo(6,1);c.lineTo(5,5);c.lineTo(-5,5);c.closePath();c.fill();c.fillStyle=spirit;c.globalAlpha=.78*(1-death);c.fillRect(1,2.2,3,1.4);c.globalAlpha=1;}c.restore();
  c.restore();
}

function draw_cursed_blade(c,m,presentationTime,seed){
  const time=presentationTime,pose=attackPose(m),action=pose.active,walk=m.motionBlend??0,cx=m.x+m.w/2+(m.familyAttack?0:pose.impact*4-pose.windup*2)+Math.sin(m.stepPhase??0)*walk*1.5,cy=m.y+m.h/2+(m.familyAttack?0:Math.sin(time/130+(seed%13)) * 2.7)-Math.abs(Math.sin(m.stepPhase??0))*walk;
  // Keep the weapon upright enough to read while its wisps orbit continuously.
  const angle=m.familyAttack?0:-.42-pose.windup*.65+pose.impact*1.5+pose.recovery*.45+Math.sin(time/420+(seed%17))*.1,flash=m.flashTimer>0;
  c.save();
  if(!flash)for(let i=0;i<3;i++){const phase=time/330+(seed%97)*.031+i*Math.PI*2/3,radius=10+i*1.8;c.fillStyle=`rgba(135,111,161,${.34-i*.055})`;c.beginPath();c.arc(cx+Math.cos(phase)*radius,cy+Math.sin(phase)*radius*.72,2-i*.2,0,Math.PI*2);c.fill();}
  c.translate(cx+(action?2:0),cy);c.rotate(angle);c.strokeStyle='#17191d';c.lineWidth=2;c.lineJoin='round';
  if(!flash){c.save();c.shadowBlur=10;c.shadowColor='#8a72a4';c.strokeStyle='rgba(138,114,164,.48)';c.lineWidth=4;c.beginPath();c.moveTo(-4,-22);c.lineTo(4,-22);c.lineTo(5,12);c.lineTo(-5,12);c.closePath();c.stroke();c.restore();}
  // Forged blade with separate dark fuller, bright bevel and chipped edge.
  c.fillStyle=flash?'#fff':'#555d61';c.beginPath();c.moveTo(-4,-15);c.lineTo(0,-23);c.lineTo(5,-14);c.lineTo(4,12);c.lineTo(-4,12);c.closePath();c.fill();c.stroke();
  if(!flash){c.fillStyle='#899295';c.beginPath();c.moveTo(0,-19);c.lineTo(3,-13);c.lineTo(2.5,10);c.lineTo(0,8);c.closePath();c.fill();c.fillStyle='#292f35';c.beginPath();c.moveTo(-2,-13);c.lineTo(0,-18);c.lineTo(0,8);c.lineTo(-2,10);c.closePath();c.fill();c.strokeStyle='#aa97bd';c.lineWidth=1.3;c.beginPath();c.moveTo(-1,-7);c.lineTo(2,-3);c.lineTo(-1,3);c.lineTo(1,6);c.stroke();}
  c.fillStyle=flash?'#fff':'#8b744d';c.beginPath();c.moveTo(-9,12);c.lineTo(-6,10);c.lineTo(0,12);c.lineTo(6,10);c.lineTo(9,12);c.lineTo(7,16);c.lineTo(-7,16);c.closePath();c.fill();c.stroke();
  c.fillStyle=flash?'#fff':'#513b31';c.fillRect(-2.5,16,5,10);c.strokeRect(-2.5,16,5,10);if(!flash){c.strokeStyle='#9b7753';c.lineWidth=1;c.beginPath();for(let y=18;y<26;y+=3){c.moveTo(-2.5,y);c.lineTo(2.5,y+2);}c.stroke();}
  c.fillStyle=flash?'#fff':'#80699b';c.beginPath();c.arc(0,28,3,0,Math.PI*2);c.fill();c.stroke();
  c.restore();
}

export const CREATURE_PAINTERS_D11=Object.freeze({sprout:draw_sprout,golem:draw_golem,slime:draw_slime,gargoyle:draw_gargoyle,rust_nibbler:draw_rust_nibbler,animated_armor:draw_animated_armor,cursed_blade:draw_cursed_blade,...DUNGEON_MOB_PAINTERS_V1,...DUNGEON_MOB_PAINTERS_V2A,...DUNGEON_MOB_PAINTERS_V2B});

export function drawCreatureD11(c,actor,presentationTick,flash=false){
  if(!actor.alive&&(actor.enemyFamily!=='animated_armor'||actor.deathAge===null||actor.deathAge>36))return;
  const presentationTime=presentationTick*(1000/60),seed=actor.visualSeed>>>0,profile=creaturePresentationD11_1(actor.enemyFamily)??creaturePresentationD11_1('sprout'),frame=profile.painterFrame;
  const melee=actor.meleePhase,phaseSpan=Math.max(1,(melee?.phaseEndsTick??presentationTick)-(melee?.phaseStartedTick??presentationTick)),phaseProgress=!melee||melee.phase==='idle'?0:Math.max(0,Math.min(1,(presentationTick-melee.phaseStartedTick)/phaseSpan)),started=actor.motion?.startedTick,lastMoved=actor.motion?.lastMovedTick,stopAge=lastMoved===null||lastMoved===undefined?99:presentationTick-lastMoved,startAge=started===null||started===undefined?99:presentationTick-started,motionBlend=stopAge<=1?Math.min(1,startAge/6):Math.max(0,1-(stopAge-1)/6),stepPhase=(started??presentationTick)*-.66+presentationTick*.66+(seed%17)*.13;
  const m={x:frame.x,y:frame.y,w:frame.width,h:frame.height,flashTimer:flash?1:0,movedLastTick:Boolean(actor.movedLastTick),motionBlend,stepPhase,meleeAction:Boolean(actor.meleeAction),meleePhase:melee,phaseProgress,deathProgress:actor.alive?0:Math.max(0,Math.min(1,(actor.deathAge??0)/24)),presentationTick,paletteKey:profile.paletteKey};
  c.save();c.translate(actor.position.x,actor.position.y);drawVitalityWeaverPulseD12_4(c,actor,presentationTick);drawVitalityWeaverSigilD12_4(c,actor,presentationTick);drawVitalityWeaverAuraD12_4(c,actor,presentationTick);drawSwiftCommanderPulseD12_4D(c,actor,presentationTick);drawSwiftCommanderSigilD12_4D(c,actor,presentationTick);drawSwiftCommanderAuraD12_4D(c,actor,presentationTick);drawSwiftHasteD12_4D(c,actor,presentationTick);drawGlacialWardenPulseD12_4E(c,actor,presentationTick);drawGlacialWardenSigilD12_4E(c,actor,presentationTick);drawGlacialWardenAuraD12_4E(c,actor,presentationTick);drawToxicDecayRearD12_4F(c,actor,presentationTick);drawIronCitadelRearD12_4G(c,actor,presentationTick);drawIronGuardRearD12_4G(c,actor,presentationTick);drawBloodBerserkerRearD12_4H_A(c,actor,presentationTick);drawNullifierRearD12_4I(c,actor,presentationTick);drawWebWeaverRearD12_4J(c,actor,presentationTick);drawSlagShaperRearD12_4K(c,actor,presentationTick);
  const shadow=profile.contactShadow;c.fillStyle=`rgba(10,14,15,${shadow.alpha})`;c.beginPath();c.ellipse(shadow.x,shadow.y,shadow.rx,shadow.ry,0,0,Math.PI*2);c.fill();
  const attackArt=hostileMeleePose(actor,presentationTick)??hostileRangedPose(actor,presentationTick);m.familyAttack=attackArt;m.rangedPose=attackArt?.ranged?attackArt:null;c.save();if(attackArt){c.translate(attackArt.body.x,attackArt.body.y);const pivot=attackArt.upright?attackArt.bodyPivot:null;if(pivot)c.translate(pivot.x,pivot.y);c.rotate(attackArt.body.rotation);c.scale(attackArt.body.scaleX,attackArt.body.scaleY);if(pivot)c.translate(-pivot.x,-pivot.y);}const eliteScale=actor.elite?.scale??1;c.scale(eliteScale,eliteScale);c.scale((!attackArt?.upright&&(attackArt&&['sprout','slime','rust_nibbler','cursed_blade','lava_serpent','swamp_basilisk','hell_bat','slag_slime','marsh_ghost'].includes(attackArt.family)||attackArt?.ranged||attackArt?.disableFacingFlip))?1:['thorn_wyrm','wyrmling','lava_serpent','swamp_basilisk',...DUNGEON_MOB_V2A_IDLE_FACING_LEFT].includes(actor.enemyFamily)?(actor.presentationFacingX===-1?1:-1):actor.presentationFacingX===-1?-1:1,1);c.translate(profile.drawOffset.x,profile.drawOffset.y);c.scale(profile.visualScale,profile.visualScale);c.strokeStyle='#000';c.lineWidth=1.8;c.lineJoin='round';if(actor.elite?.affixId==='vitality_weaver'){c.filter='sepia(.16) saturate(1.28) hue-rotate(58deg) brightness(1.03)';c.shadowColor='#43cf85';c.shadowBlur=2;}else if(actor.elite?.affixId==='swift_commander'){c.filter='saturate(1.18) hue-rotate(12deg) brightness(1.04)';c.shadowColor='#00d2ff';c.shadowBlur=2;}else if(actor.elite?.affixId==='glacial_warden'){c.filter='saturate(.9) hue-rotate(142deg) brightness(1.18) contrast(1.04)';c.shadowColor='#79d7ff';c.shadowBlur=2;}else if(actor.elite?.affixId==='toxic_decay'){c.filter='sepia(.2) saturate(1.45) hue-rotate(64deg) brightness(1.02)';c.shadowColor='#70408f';c.shadowBlur=2;}else if(actor.elite?.affixId==='iron_citadel'){c.filter='saturate(.72) hue-rotate(172deg) brightness(1.04) contrast(1.08)';c.shadowColor='#7196b5';c.shadowBlur=2;}else if(actor.elite?.affixId==='blood_berserker'){c.filter='sepia(.22) saturate(1.48) hue-rotate(304deg) brightness(.98) contrast(1.08)';c.shadowColor='#d34550';c.shadowBlur=2;}else if(actor.elite?.affixId==='nullifier'){c.filter='sepia(.12) saturate(1.35) hue-rotate(225deg) brightness(1.02) contrast(1.06)';c.shadowColor='#9b5de5';c.shadowBlur=2;}else if(actor.elite?.affixId==='web_weaver'){c.filter='saturate(.78) hue-rotate(152deg) brightness(1.12) contrast(1.06)';c.shadowColor='#88e8f6';c.shadowBlur=2;}else if(actor.elite?.affixId==='slag_shaper'){c.filter='sepia(.34) saturate(1.55) hue-rotate(332deg) brightness(.98) contrast(1.12)';c.shadowColor='#f97316';c.shadowBlur=2;}
  const paintBody=target=>(CREATURE_PAINTERS_D11[actor.enemyFamily]??draw_sprout)(target,m,presentationTime,seed);
  const boundedFilter=actor.elite?.affixId==='swift_commander'&&actor.enemyFamily==='animated_armor'||actor.enemyFamily==='golem'&&['slag_shaper','iron_citadel'].includes(actor.elite?.affixId);
  if(boundedFilter)drawFilteredCreatureSurface(c,frame,paintBody);else paintBody(c);c.restore();drawHostileMeleeLimb(c,attackArt,flash);drawToxicDecayFrontD12_4F(c,actor,presentationTick);drawIronCitadelFrontD12_4G(c,actor,presentationTick);drawIronGuardFrontD12_4G(c,actor,presentationTick);drawBloodBerserkerFrontD12_4H_A(c,actor,presentationTick);drawNullifierFrontD12_4I(c,actor,presentationTick);drawWebWeaverFrontD12_4J(c,actor,presentationTick);drawSlagShaperFrontD12_4K(c,actor,presentationTick);
  const ratio=actor.hp.m/actor.maxHp.m*10**(actor.hp.e-actor.maxHp.e);
  const barWidth=Math.max(18,Math.min(34,profile.visualBounds.width*.68)),barHeight=profile.visualScale<.72?3:4,barX=-barWidth/2,barY=profile.labels.healthBarY;
  if(actor.alive){if(actor.levelLabel&&!actor.elite){const labelSize=profile.visualScale<.72?7:8;c.font=`bold ${labelSize}px system-ui`;c.textAlign='center';c.strokeStyle='#11121a';c.lineWidth=1.6;c.strokeText(actor.levelLabel,0,profile.labels.levelLabelY);c.fillStyle='#e5d3a8';c.fillText(actor.levelLabel,0,profile.labels.levelLabelY);}if(!drawVitalityWeaverBadgeD12_4(c,actor,profile,ratio)&&!drawSwiftCommanderBadgeD12_4D(c,actor,profile,ratio)&&!drawGlacialWardenBadgeD12_4E(c,actor,profile,ratio)&&!drawToxicDecayBadgeD12_4F(c,actor,profile,ratio)&&!drawIronCitadelBadgeD12_4G(c,actor,profile,ratio)&&!drawBloodBerserkerBadgeD12_4H_A(c,actor,profile,ratio)&&!drawNullifierBadgeD12_4I(c,actor,profile,ratio)&&!drawWebWeaverBadgeD12_4J(c,actor,profile,ratio)&&!drawSlagShaperBadgeD12_4K(c,actor,profile,ratio)){c.fillStyle='#16232a';c.fillRect(barX,barY,barWidth,barHeight);c.fillStyle='#b4e484';c.fillRect(barX,barY,barWidth*ratio,barHeight);}drawEliteAffixIdentitySlot(c,actor,profile);drawActorStatusRow(c,actor,profile);}c.restore();
}
