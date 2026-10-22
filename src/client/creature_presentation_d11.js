import {drawStoneGolemV4} from './creature_presentation_stone_golem_v4.js';
import {drawCursedBladeV4} from './creature_presentation_cursed_blade_v4.js';
import {drawAnimatedArmorV4} from './creature_presentation_animated_armor_v4.js';
import {drawGargoyleV4} from './creature_presentation_gargoyle_v4.js';
import {watcherLookDirection} from './temporal_watcher_eye_v1.js';
import {DUNGEON_MOB_PAINTERS_V2A,DUNGEON_MOB_V2A_IDLE_FACING_LEFT} from './creature_presentation_dungeon_mobs_v2a.js';
import {DUNGEON_MOB_PAINTERS_V2B} from './creature_presentation_dungeon_mobs_v2b.js';
import {DUNGEON_MOB_PAINTERS_V1,hostileRangedPose} from './creature_presentation_dungeon_mobs_v1.js';
import {hostileMeleePose,drawHostileMeleeLimb} from './hostile_melee_presentation.js';
import {drawFilteredCreatureSurface} from './filtered_creature_surface.js';
import {creaturePresentationForRenderV3 as creaturePresentationD11_1} from './creature_presentation_profiles_v3.js';
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

function draw_slime(c,m,presentationTime){
        const pose=attackPose(m),blend=m.familyAttack?(pose.phase==='windup'?pose.p*pose.p*(3-2*pose.p):pose.phase==='recovery'?1-pose.p*pose.p*(3-2*pose.p):1):0;let squish = Math.sin(presentationTime / 100) * 2.0*(1-blend)+(m.familyAttack?0:pose.windup*3-pose.impact*3.5);
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

function draw_rust_nibbler(c,m,presentationTime,seed){
  const time=presentationTime,pose=attackPose(m),active=Boolean(m.movedLastTick||pose.active),cx=m.x+m.w/2+(m.familyAttack?0:pose.impact*4-pose.windup*2),cy=m.y+m.h-9;
  const flash=m.flashTimer>0,outline='#11151a',dark=flash?'#fff':'#804122',rust=flash?'#fff':'#f27926';
  // The beetle is drawn at .68 scale. A 2.65px contour gives the same
  // world-space weight as the approved slime and mushroom's 1.8px contour.
  c.save();c.lineJoin='round';c.lineCap='round';c.strokeStyle=outline;c.lineWidth=2.65;
  // Keep all six articulated legs, with one readable dark silhouette each.
  for(let side=-1;side<=1;side+=2)for(let j=0;j<3;j++){
    const phase=time/75+j*1.4+side,step=active?Math.sin(phase)*3:Math.sin(phase)*.45;
    const rootX=cx+side*(5+j*2.5),rootY=cy+1+j*.7,jointX=rootX+side*(6+j),jointY=cy+5+j*1.2;
    c.strokeStyle=outline;c.lineWidth=2.8;c.beginPath();c.moveTo(rootX,rootY);c.lineTo(jointX+step*side,jointY);c.lineTo(jointX+side*6+step*side,cy+10);c.stroke();
  }
  // Broad orange shell, a curved underside shadow and one restrained glint.
  // Their shape follows the carapace; small panel stripes are unnecessary.
  c.fillStyle=rust;c.beginPath();c.ellipse(cx,cy,14,8.5,0,0,Math.PI*2);c.fill();
  if(!flash){
    c.save();c.beginPath();c.ellipse(cx,cy,14,8.5,0,0,Math.PI*2);c.clip();
    c.fillStyle='#c74c21';c.beginPath();c.moveTo(cx-15,cy+1);c.quadraticCurveTo(cx-1,cy+8,cx+15,cy);c.lineTo(cx+15,cy+10);c.lineTo(cx-15,cy+10);c.closePath();c.fill();c.restore();
    c.fillStyle='rgba(255,255,255,.5)';c.beginPath();c.ellipse(cx-4.5,cy-3.3,4.2,1.65,-.2,0,Math.PI*2);c.fill();
  }
  c.strokeStyle=outline;c.lineWidth=2.65;c.beginPath();c.ellipse(cx,cy,14,8.5,0,0,Math.PI*2);c.stroke();
  // One shell seam, a solid head and clear eyes keep the beetle's identity.
  if(!flash){c.lineWidth=1.4;c.beginPath();c.moveTo(cx-10,cy);c.quadraticCurveTo(cx-1,cy-2,cx+8,cy);c.stroke();}
  c.fillStyle=dark;c.lineWidth=2.65;c.beginPath();c.ellipse(cx+12,cy,6,5.5,0,0,Math.PI*2);c.fill();c.stroke();
  if(!m.familyAttack){c.fillStyle=outline;c.beginPath();c.moveTo(cx+16,cy+1);c.lineTo(cx+21+pose.impact*4,cy+(pose.windup?-1:pose.impact?6:2));c.lineTo(cx+16,cy+4);c.closePath();c.fill();}
  if(!flash){c.fillStyle='#ffedb3';c.beginPath();c.arc(cx+13.5,cy-2,1.6,0,Math.PI*2);c.arc(cx+13,cy+1.5,1,0,Math.PI*2);c.fill();}
  const twitch=Math.sin(time/85+(seed%7))*(active?3:1.2);c.strokeStyle=outline;c.lineWidth=2.4;
  for(let side=-1;side<=1;side+=2){c.beginPath();c.moveTo(cx+13,cy-3);c.quadraticCurveTo(cx+19,cy-10+side*twitch,cx+24,cy-7+side*twitch);c.stroke();}
  c.restore();
}

export function animatedArmorPoseD11_2(m,presentationTime,seed){const pose=attackPose(m),walk=m.motionBlend??0,cycle=m.stepPhase??0,death=m.deathProgress??0,step=Math.sin(cycle)*3.2*walk,leftLift=Math.max(0,Math.sin(cycle))*2.8*walk*(1-death),rightLift=Math.max(0,-Math.sin(cycle))*2.8*walk*(1-death),weight=Math.sin(cycle)*1.1*walk-pose.windup*1.6+pose.impact*3;return {pose,walk,cycle,death,step,leftLift,rightLift,weight,helmetFollow:-weight*.35+Math.sin(presentationTime/260+(seed%9))*.35*(1-walk)};}

export const CREATURE_PAINTERS_D11=Object.freeze({sprout:draw_sprout,golem:drawStoneGolemV4,slime:draw_slime,gargoyle:drawGargoyleV4,rust_nibbler:draw_rust_nibbler,animated_armor:drawAnimatedArmorV4,cursed_blade:drawCursedBladeV4,...DUNGEON_MOB_PAINTERS_V1,...DUNGEON_MOB_PAINTERS_V2A,...DUNGEON_MOB_PAINTERS_V2B});

export function drawCreatureD11(c,actor,presentationTick,flash=false,_equipmentArt=null,lookTarget=undefined){
  if(!actor.alive&&(actor.enemyFamily!=='animated_armor'||actor.deathAge===null||actor.deathAge>36))return;
  const presentationTime=presentationTick*(1000/60),seed=actor.visualSeed>>>0,profile=creaturePresentationD11_1(actor.enemyFamily)??creaturePresentationD11_1('sprout'),frame=profile.painterFrame;
  const melee=actor.meleePhase,phaseSpan=Math.max(1,(melee?.phaseEndsTick??presentationTick)-(melee?.phaseStartedTick??presentationTick)),phaseProgress=!melee||melee.phase==='idle'?0:Math.max(0,Math.min(1,(presentationTick-melee.phaseStartedTick)/phaseSpan)),started=actor.motion?.startedTick,lastMoved=actor.motion?.lastMovedTick,stopAge=lastMoved===null||lastMoved===undefined?99:presentationTick-lastMoved,startAge=started===null||started===undefined?99:presentationTick-started,motionBlend=stopAge<=1?Math.min(1,startAge/6):Math.max(0,1-(stopAge-1)/6),stepPhase=(started??presentationTick)*-.66+presentationTick*.66+(seed%17)*.13;
  const m={x:frame.x,y:frame.y,w:frame.width,h:frame.height,flashTimer:flash?1:0,movedLastTick:Boolean(actor.movedLastTick),motionBlend,stepPhase,meleeAction:Boolean(actor.meleeAction),meleePhase:melee,phaseProgress,deathProgress:actor.alive?0:Math.max(0,Math.min(1,(actor.deathAge??0)/24)),presentationTick,paletteKey:profile.paletteKey};
  c.save();c.translate(actor.position.x,actor.position.y);drawVitalityWeaverPulseD12_4(c,actor,presentationTick);drawVitalityWeaverSigilD12_4(c,actor,presentationTick);drawVitalityWeaverAuraD12_4(c,actor,presentationTick);drawSwiftCommanderPulseD12_4D(c,actor,presentationTick);drawSwiftCommanderSigilD12_4D(c,actor,presentationTick);drawSwiftCommanderAuraD12_4D(c,actor,presentationTick);drawSwiftHasteD12_4D(c,actor,presentationTick);drawGlacialWardenPulseD12_4E(c,actor,presentationTick);drawGlacialWardenSigilD12_4E(c,actor,presentationTick);drawGlacialWardenAuraD12_4E(c,actor,presentationTick);drawToxicDecayRearD12_4F(c,actor,presentationTick);drawIronCitadelRearD12_4G(c,actor,presentationTick);drawIronGuardRearD12_4G(c,actor,presentationTick);drawBloodBerserkerRearD12_4H_A(c,actor,presentationTick);drawNullifierRearD12_4I(c,actor,presentationTick);drawWebWeaverRearD12_4J(c,actor,presentationTick);drawSlagShaperRearD12_4K(c,actor,presentationTick);
  const shadow=profile.contactShadow;c.fillStyle=`rgba(10,14,15,${shadow.alpha})`;c.beginPath();c.ellipse(shadow.x,shadow.y,shadow.rx,shadow.ry,0,0,Math.PI*2);c.fill();
  const attackArt=hostileMeleePose(actor,presentationTick)??hostileRangedPose(actor,presentationTick);m.familyAttack=attackArt;m.rangedPose=attackArt?.ranged?attackArt:null;if(actor.enemyFamily==='temporal_watcher'){m.lookDirection=watcherLookDirection(actor,lookTarget===undefined?actor.meleeGeometry?.targetPosition:lookTarget,attackArt);m.drawFacingX=actor.presentationFacingX===-1?-1:1;}c.save();if(attackArt){c.translate(attackArt.body.x,attackArt.body.y);const pivot=attackArt.upright?attackArt.bodyPivot:null;if(pivot)c.translate(pivot.x,pivot.y);c.rotate(attackArt.body.rotation);c.scale(attackArt.body.scaleX,attackArt.body.scaleY);if(pivot)c.translate(-pivot.x,-pivot.y);}const eliteScale=actor.elite?.scale??1;c.scale(eliteScale,eliteScale);c.scale((!attackArt?.upright&&(attackArt&&['sprout','slime','rust_nibbler','cursed_blade','lava_serpent','swamp_basilisk','hell_bat','slag_slime','marsh_ghost'].includes(attackArt.family)||(attackArt?.ranged&&!attackArt?.preserveFacingFlip)||attackArt?.disableFacingFlip))?1:['thorn_wyrm','wyrmling','lava_serpent','swamp_basilisk',...DUNGEON_MOB_V2A_IDLE_FACING_LEFT].includes(actor.enemyFamily)?(actor.presentationFacingX===-1?1:-1):actor.presentationFacingX===-1?-1:1,1);c.translate(profile.drawOffset.x,profile.drawOffset.y);c.scale(profile.visualScale,profile.visualScale);c.strokeStyle='#000';c.lineWidth=1.8;c.lineJoin='round';if(actor.elite?.affixId==='vitality_weaver'){c.filter='sepia(.16) saturate(1.28) hue-rotate(58deg) brightness(1.03)';c.shadowColor='#43cf85';c.shadowBlur=2;}else if(actor.elite?.affixId==='swift_commander'){c.filter='saturate(1.18) hue-rotate(12deg) brightness(1.04)';c.shadowColor='#00d2ff';c.shadowBlur=2;}else if(actor.elite?.affixId==='glacial_warden'){c.filter='saturate(.9) hue-rotate(142deg) brightness(1.18) contrast(1.04)';c.shadowColor='#79d7ff';c.shadowBlur=2;}else if(actor.elite?.affixId==='toxic_decay'){c.filter='sepia(.2) saturate(1.45) hue-rotate(64deg) brightness(1.02)';c.shadowColor='#70408f';c.shadowBlur=2;}else if(actor.elite?.affixId==='iron_citadel'){c.filter='saturate(.72) hue-rotate(172deg) brightness(1.04) contrast(1.08)';c.shadowColor='#7196b5';c.shadowBlur=2;}else if(actor.elite?.affixId==='blood_berserker'){c.filter='sepia(.22) saturate(1.48) hue-rotate(304deg) brightness(.98) contrast(1.08)';c.shadowColor='#d34550';c.shadowBlur=2;}else if(actor.elite?.affixId==='nullifier'){c.filter='sepia(.12) saturate(1.35) hue-rotate(225deg) brightness(1.02) contrast(1.06)';c.shadowColor='#9b5de5';c.shadowBlur=2;}else if(actor.elite?.affixId==='web_weaver'){c.filter='saturate(.78) hue-rotate(152deg) brightness(1.12) contrast(1.06)';c.shadowColor='#88e8f6';c.shadowBlur=2;}else if(actor.elite?.affixId==='slag_shaper'){c.filter='sepia(.34) saturate(1.55) hue-rotate(332deg) brightness(.98) contrast(1.12)';c.shadowColor='#f97316';c.shadowBlur=2;}
  const paintBody=target=>(CREATURE_PAINTERS_D11[actor.enemyFamily]??draw_sprout)(target,m,presentationTime,seed);
  const boundedFilter=actor.elite?.affixId==='swift_commander'&&actor.enemyFamily==='animated_armor'||actor.enemyFamily==='golem'&&['slag_shaper','iron_citadel'].includes(actor.elite?.affixId);
  if(boundedFilter)drawFilteredCreatureSurface(c,frame,paintBody);else paintBody(c);c.restore();drawHostileMeleeLimb(c,attackArt,flash);drawToxicDecayFrontD12_4F(c,actor,presentationTick);drawIronCitadelFrontD12_4G(c,actor,presentationTick);drawIronGuardFrontD12_4G(c,actor,presentationTick);drawBloodBerserkerFrontD12_4H_A(c,actor,presentationTick);drawNullifierFrontD12_4I(c,actor,presentationTick);drawWebWeaverFrontD12_4J(c,actor,presentationTick);drawSlagShaperFrontD12_4K(c,actor,presentationTick);
  const ratio=actor.hp.m/actor.maxHp.m*10**(actor.hp.e-actor.maxHp.e);
  const barWidth=Math.max(18,Math.min(34,profile.visualBounds.width*.68)),barHeight=profile.visualScale<.72?3:4,barX=-barWidth/2,barY=profile.labels.healthBarY;
  if(actor.alive){if(actor.levelLabel&&!actor.elite){const labelSize=profile.visualScale<.72?7:8;c.font=`bold ${labelSize}px system-ui`;c.textAlign='center';c.strokeStyle='#11121a';c.lineWidth=1.6;c.strokeText(actor.levelLabel,0,profile.labels.levelLabelY);c.fillStyle='#e5d3a8';c.fillText(actor.levelLabel,0,profile.labels.levelLabelY);}if(!drawVitalityWeaverBadgeD12_4(c,actor,profile,ratio)&&!drawSwiftCommanderBadgeD12_4D(c,actor,profile,ratio)&&!drawGlacialWardenBadgeD12_4E(c,actor,profile,ratio)&&!drawToxicDecayBadgeD12_4F(c,actor,profile,ratio)&&!drawIronCitadelBadgeD12_4G(c,actor,profile,ratio)&&!drawBloodBerserkerBadgeD12_4H_A(c,actor,profile,ratio)&&!drawNullifierBadgeD12_4I(c,actor,profile,ratio)&&!drawWebWeaverBadgeD12_4J(c,actor,profile,ratio)&&!drawSlagShaperBadgeD12_4K(c,actor,profile,ratio)){c.fillStyle='#16232a';c.fillRect(barX,barY,barWidth,barHeight);c.fillStyle='#b4e484';c.fillRect(barX,barY,barWidth*ratio,barHeight);}drawEliteAffixIdentitySlot(c,actor,profile);drawActorStatusRow(c,actor,profile);}c.restore();
}
