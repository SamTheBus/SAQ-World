// Source: SamTheBus/SAQ-Dungeon commit 387c78bfaf9f492fe7b6ff4539b956c12c2a7cdc.
// mob_renderer.js ordinary vType branches. World injects clock/seed and attack
// phases; none of these ordinary species gains a source-name-implied spell,
// projectile, block/parry ability, phasing movement or additional damage area.
export const DUNGEON_MOB_FAMILIES_V2A=Object.freeze(['gilded_scuttler','mimic_shield','void_crawler','void_spectre','void_wraith','rift_drifter','coin_elemental']);
export const DUNGEON_MOB_V2A_IDLE_FACING_LEFT=Object.freeze(['gilded_scuttler','void_crawler']);
export const DUNGEON_MOB_NATIVE_SCALES_V2A=Object.freeze({gilded_scuttler:.74,mimic_shield:.76,void_crawler:.75,void_spectre:.78,void_wraith:.78,rift_drifter:.82,coin_elemental:.7});

function draw_gilded_scuttler(c,m,presentationTime,seed){
  const action=m.familyAttack,wind=action?.phase==='windup'?action.progress:0,hit=action?.phase==='impact'?1-action.progress:0,settle=action?.phase==='recovery'?1-action.progress:0;

        let cx = m.x + m.w / 2;
        let cy = m.y + m.h - 15;
        let time = presentationTime;
        let legWalk = action?(wind?-3*wind:hit?-4*hit:-2*settle):Math.sin(time / 60) * 3;

        c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#b7950b";
        c.lineWidth = 2.4;
        for (let i = -1; i <= 1; i += 2) {
          let legX = cx + i * 12;
          c.beginPath();
          c.moveTo(legX, cy + 4);
          c.lineTo(legX + i * 6 + legWalk * i, cy + 12);
          c.stroke();

          c.beginPath();
          c.moveTo(legX - i * 4, cy + 4);
          c.lineTo(legX - i * 10 - legWalk * i, cy + 12);
          c.stroke();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#ffd700";
        c.beginPath();
        c.ellipse(cx - 10, cy - 2, 4, 3, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.beginPath();
        c.moveTo(cx - 12, cy - 2);
        c.quadraticCurveTo(cx - 18, cy - 8 + legWalk, cx - 22, cy - 4);
        c.quadraticCurveTo(cx - 16, cy, cx - 12, cy - 2);
        c.fill();
        c.stroke();

        let sAngle = Math.PI / 12 + (action?action.limb.spin:Math.sin(time / 150) * .05);
        c.save();
        c.translate(cx + 2, cy - 2);
        c.rotate(sAngle);

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#967507";
        c.beginPath();
        c.arc(0, 0, 13.5, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#ffd700";
        c.beginPath();
        c.arc(0, 0, 12, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.strokeStyle = "#b7950b";
          c.lineWidth = 1.2;
          c.beginPath();
          c.arc(0, 0, 10, 0, Math.PI * 2);
          c.stroke();

          c.strokeStyle = "#4d2e1a";
          c.lineWidth = 1.5;
          c.beginPath();
          c.moveTo(-4, -4);
          c.lineTo(4, 4);
          c.moveTo(4, -4);
          c.lineTo(-4, 4);
          c.moveTo(0, -5);
          c.lineTo(0, 5);
          c.stroke();

          c.fillStyle = "rgba(255, 255, 255, 0.8)";
          c.beginPath();
          c.arc(-5, -5, 2, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();

        if (m.flashTimer === 0) {
          c.fillStyle = "#ff0055";
          c.beginPath();
          c.arc(cx - 12, cy - 3, 1.2, 0, Math.PI * 2);
          c.fill();
        }
}

function draw_mimic_shield(c,m,presentationTime,seed){
  const action=m.familyAttack,wind=action?.phase==='windup'?action.progress:0,hit=action?.phase==='impact'?1-action.progress:0,settle=action?.phase==='recovery'?1-action.progress:0;

        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;
        let time = presentationTime;
        let breathe = Math.sin(time / 140) * 2;
        let eyeBlink = action?1:Math.sin(time / 800);

        c.save();
        c.translate(cx, cy);

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
        c.beginPath();
        c.moveTo(-16, -16);
        c.lineTo(16, -16);
        c.lineTo(18, 2);
        c.lineTo(0, 22);
        c.lineTo(-18, 2);
        c.closePath();
        c.fill();
        c.stroke();

        c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#7f8c8d";
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(-13, -13);
        c.lineTo(13, -13);
        c.lineTo(15, 1);
        c.lineTo(0, 18);
        c.lineTo(-15, 1);
        c.closePath();
        c.stroke();

        let mouthOpen = action?action.limb.open:Math.max(1,3.5+breathe);
        c.fillStyle = "#110202";
        c.beginPath();
        c.ellipse(0, 2, 8, mouthOpen, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.fillStyle = "#f1c40f";
        c.strokeStyle = "#000000";
        c.lineWidth = 1;
        let tOffsets = [-5, -2, 2, 5];
        tOffsets.forEach((dx) => {
          c.beginPath();
          c.moveTo(dx - 1.2, 2 - mouthOpen);
          c.lineTo(dx, 2 - mouthOpen + 3);
          c.lineTo(dx + 1.2, 2 - mouthOpen);
          c.closePath();
          c.fill();
          c.stroke();

          c.beginPath();
          c.moveTo(dx - 1.2, 2 + mouthOpen);
          c.lineTo(dx, 2 + mouthOpen - 3);
          c.lineTo(dx + 1.2, 2 + mouthOpen);
          c.closePath();
          c.fill();
          c.stroke();
        });

        if (m.flashTimer === 0) {
          c.fillStyle = "#ffffff";
          c.beginPath();
          c.ellipse(0, -7, 6, 4, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          if (eyeBlink > -0.85) {
            c.fillStyle = "#e74c3c";
            c.beginPath();
            c.arc(0, -7, 2.5, 0, Math.PI * 2);
            c.fill();

            c.fillStyle = "#000000";
            c.beginPath();
            c.ellipse(0, -7, 0.8, 2.2, 0, 0, Math.PI * 2);
            c.fill();
          } else {
            c.strokeStyle = "#000";
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(-6, -7);
            c.lineTo(6, -7);
            c.stroke();
          }
        }

        c.restore();
}

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
        let hover = action?0:Math.sin(presentationTime / 150) * 5;
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

        let hover = action?0:Math.sin(presentationTime / 150) * 6;
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

        let hover = action?0:Math.sin(presentationTime / 110) * 6;
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
          let angle = action?(action.phase==='windup'?Math.PI+(i-1)*.6:action.phase==='impact'?(i===0?0:Math.PI+(i-1.5)*1.1)+action.limb.spin:presentationTime/180+(i*TAU)/3):presentationTime/180+(i*TAU)/3;
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

function draw_coin_elemental(c,m,presentationTime,seed){
  const action=m.familyAttack,wind=action?.phase==='windup'?action.progress:0,hit=action?.phase==='impact'?1-action.progress:0,settle=action?.phase==='recovery'?1-action.progress:0;

        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + (action?0:Math.sin(presentationTime / 150)*3);

        // Precompute coordinates and depth state for the 6 orbiting gold coins
        let coinsList = [];
        for (let i = 0; i < 6; i++) {
          let angle = action?(action.phase==='impact'?action.limb.spin:action.phase==='windup'?presentationTime/900:presentationTime/600)+(i*TAU)/6:presentationTime/600+(i*TAU)/6;
          let dist = action?18-5*wind:18+Math.sin(presentationTime/150+i)*3;
          let ox = cx + Math.cos(angle) * dist * 1.3;
          let oy = cy + Math.sin(angle) * dist * 0.5;
          let isBehind = Math.sin(angle) < 0; // True if positioned behind core

          let rot = angle * 2 + (action?Math.PI/2:0);
          let cw = 6 * Math.abs(Math.sin(rot));
          let ch = 6;

          coinsList.push({ ox, oy, cw, ch, isBehind });
        }

        let drawCoinPiece = (cn) => {
          c.save();
          c.translate(cn.ox, cn.oy);
          c.rotate(Math.PI / 12);

          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#b7950b";
          c.beginPath();
          c.ellipse(0, 0, cn.cw + 1.2, cn.ch + 1.2, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            c.fillStyle = "#ffd700";
            c.beginPath();
            c.ellipse(0, 0, cn.cw, cn.ch, 0, 0, Math.PI * 2);
            c.fill();
            c.strokeStyle = "#b7950b";
            c.lineWidth = 0.8;
            c.beginPath();
            c.ellipse(0, 0, cn.cw * 0.8, cn.ch * 0.8, 0, 0, Math.PI * 2);
            c.stroke();
            c.fillStyle = "rgba(255,255,255,0.75)";
            c.beginPath();
            c.ellipse(
              -cn.cw * 0.3,
              -cn.ch * 0.3,
              cn.cw * 0.25,
              cn.ch * 0.2,
              Math.PI / 4,
              0,
              Math.PI * 2,
            );
            c.fill();
          }
          c.restore();
        };

        // 1. Draw BACK half of orbiting rings first (Math.PI to 2*Math.PI)
        c.save();
        c.translate(cx, cy);
        c.strokeStyle = "rgba(241, 196, 15, 0.35)";
        c.lineWidth = 1;

        c.save();
        c.rotate(Math.PI / 6);
        c.beginPath();
        c.ellipse(0, 0, 22, 7, 0, Math.PI, 0); // Upper arc (behind)
        c.stroke();
        c.restore();

        c.save();
        c.rotate(-Math.PI / 4);
        c.beginPath();
        c.ellipse(0, 0, 26, 8, 0, Math.PI, 0); // Upper arc (behind)
        c.stroke();
        c.restore();
        c.restore();

        // 2. Draw BACK coins
        coinsList.forEach((cn) => {
          if (cn.isBehind) drawCoinPiece(cn);
        });

        // 3. Draw central glowing nucleus core
        let coreGrad = c.createRadialGradient(cx, cy, 1, cx, cy, 10);
        coreGrad.addColorStop(0, "#ffffff");
        coreGrad.addColorStop(0.5, "#ffd700");
        coreGrad.addColorStop(1, "rgba(255, 215, 0, 0)");
        c.fillStyle = coreGrad;
        c.beginPath();
        c.arc(cx, cy, 12, 0, Math.PI * 2);
        c.fill();

        // 4. Draw FRONT half of orbiting rings (0 to Math.PI)
        c.save();
        c.translate(cx, cy);
        c.strokeStyle = "rgba(241, 196, 15, 0.35)";
        c.lineWidth = 1;

        c.save();
        c.rotate(Math.PI / 6);
        c.beginPath();
        c.ellipse(0, 0, 22, 7, 0, 0, Math.PI); // Lower arc (in front of body)
        c.stroke();
        c.restore();

        c.save();
        c.rotate(-Math.PI / 4);
        c.beginPath();
        c.ellipse(0, 0, 26, 8, 0, 0, Math.PI); // Lower arc (in front of body)
        c.stroke();
        c.restore();
        c.restore();

        // 5. Draw FRONT coins
        coinsList.forEach((cn) => {
          if (!cn.isBehind) drawCoinPiece(cn);
        });
}

export const DUNGEON_MOB_PAINTERS_V2A=Object.freeze({gilded_scuttler:draw_gilded_scuttler,mimic_shield:draw_mimic_shield,void_crawler:draw_void_crawler,void_spectre:draw_void_spectre,void_wraith:draw_void_wraith,rift_drifter:draw_rift_drifter,coin_elemental:draw_coin_elemental});

const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=v=>{const p=clamp(v,0,1);return p*p*(3-2*p);};
const turn=a=>Math.atan2(Math.sin(a),Math.cos(a));
const families=new Set(DUNGEON_MOB_FAMILIES_V2A);
const pivot={gilded_scuttler:-12,mimic_shield:-9,void_crawler:-8,void_spectre:-9,void_wraith:-11,rift_drifter:-10,coin_elemental:-8.5};

// Pure visual transforms. Actual collision/attack positions remain unchanged.
// A pivot correction keeps upright source art at body height as it turns;
// anchor is the uncorrected lunge used by the separate directional limbs.
export function dungeonMobMeleePoseV2A(actor,tick){
  const family=actor.enemyFamily,phase=actor.meleePhase,g=actor.meleeGeometry;
  if(!families.has(family)||!actor.alive||!g||!phase||phase.phase==='idle')return null;
  const dx=g.targetPosition?g.targetPosition.x-actor.position.x:actor.presentationFacingX??1,dy=g.targetPosition?g.targetPosition.y-actor.position.y:0,distance=Math.hypot(dx,dy);
  const direction=distance>.001?{x:dx/distance,y:dy/distance}:{x:1,y:0},angle=Math.atan2(direction.y,direction.x);
  const sourceRadius=g.sourceRadius,targetRadius=g.targetRadius,centerLimit=g.mode==='clearHullGap'?g.reach+sourceRadius+targetRadius:g.reach;
  const weaponReach=Math.max(sourceRadius,centerLimit-targetRadius),contactReach=clamp(distance-targetRadius,sourceRadius,weaponReach);
  const p=clamp((tick-phase.phaseStartedTick)/Math.max(1,phase.phaseEndsTick-phase.phaseStartedTick),0,1),windup=phase.phase==='windup',impact=phase.phase==='impact',w=windup?smooth(p):0,r=phase.phase==='recovery'?(1-p)**2:0;
  const body={x:0,y:0,rotation:0,scaleX:1,scaleY:1},limb={extension:0,sweep:0,open:0,orbit:0,spin:0};let travel=0,lift=0,frontExtent=0;
  switch(family){
    case 'gilded_scuttler': { // Brace the legs and roll the coin carapace into a quick pincer ram.
      frontExtent=16.5;const reach=Math.max(0,contactReach-frontExtent),aim=turn(angle+Math.PI);
      travel=windup?-3*w:impact?reach*(1-.13*p):reach*r;
      body.rotation=windup?aim-.16*w:impact?aim+.12*p:aim*r;
      body.scaleX=windup?1-.06*w:impact?1.06:1+.06*r;body.scaleY=windup?1-.15*w:impact?.95:1-.05*r;
      limb.extension=windup?11:frontExtent;limb.open=windup?1+3*w:impact?.4:1;limb.spin=windup?-.32*w:impact?1.1*(1-p):.55*r;break;
    }
    case 'mimic_shield': { // The eye fixes on its target; the toothy shield opens, braces and bashes shut.
      frontExtent=13.5;const reach=Math.max(0,contactReach-frontExtent);
      travel=windup?-4.5*w:impact?reach*(1-.08*p):reach*r;lift=windup?-w:impact?1.5*(1-p):r;
      body.rotation=(windup?-.2*w:impact?.14:.14*r)*(direction.x<0?-1:1);body.scaleX=windup?1-.12*w:impact?1.08:1+.08*r;
      body.scaleY=windup?1+.08*w:impact?.94:1-.06*r;limb.open=windup?2+6*w:impact?1.3:1.3+2.2*(1-r);limb.extension=frontExtent;break;
    }
    case 'void_crawler': { // Compress the long segmented body, lift the feeler, then snap forward low.
      frontExtent=16;const reach=Math.max(0,contactReach-frontExtent),aim=turn(angle+Math.PI);
      travel=windup?-4*w:impact?reach*(1-.1*p):reach*r;lift=windup?-1.5*w:impact?1.2:1.2*r;
      body.rotation=windup?aim+.18*w:impact?aim-.08*p:aim*r;body.scaleX=windup?1-.2*w:impact?1.1:1+.1*r;body.scaleY=windup?1+.14*w:impact?.9:1-.1*r;
      limb.extension=windup?12:frontExtent;limb.open=windup?2+3*w:impact?.7:1.2;break;
    }
    case 'void_spectre': { // Two independently articulated claws cross in front of the hood.
      frontExtent=30;const reach=Math.max(0,contactReach-frontExtent);
      travel=windup?-2*w:impact?reach:reach*r;lift=windup?-3*w:impact?-1:-r;
      body.rotation=angle*.08+(windup?-.12*w:impact?.08:.08*r);body.scaleX=windup?1-.1*w:impact?1.06:1+.06*r;body.scaleY=windup?1+.12*w:impact?.97:1-.03*r;
      limb.extension=windup?6-2*w:impact?contactReach-travel:frontExtent*r+6*(1-r);limb.sweep=impact?.8*p:.8*r;limb.open=windup?8+3*w:impact?2+4*p:3+4*(1-r);break;
    }
    case 'void_wraith': { // A single hooked claw draws back for a slower, heavier sweep.
      frontExtent=25;const reach=Math.max(0,contactReach-frontExtent);
      travel=windup?-3.5*w:impact?reach:reach*r;lift=windup?-4*w:impact?-.5:-.5*r;
      body.rotation=angle*.1+(windup?.18*w:impact?-.1:-.1*r);body.scaleX=windup?1-.15*w:impact?.96:1-.04*r;body.scaleY=windup?1+.16*w:impact?1.06:1+.06*r;
      limb.extension=windup?5-3*w:impact?contactReach-travel:frontExtent*r+5*(1-r);limb.sweep=windup?-.7*w:impact?1.05*p:1.05*r;limb.open=windup?1:impact?1-p:r;break;
    }
    case 'rift_drifter': { // Orbiting shards form a body-bound wedge; none becomes a projectile.
      frontExtent=15.6;const reach=Math.max(0,contactReach-frontExtent);
      travel=windup?-5*w:impact?reach*(1-.07*p):reach*r;lift=windup?-2*w:impact?0:-Math.sin(p*Math.PI)*2;
      body.rotation=angle;body.scaleX=windup?1-.14*w:impact?1.04:1+.04*r;body.scaleY=windup?1+.1*w:impact?.96:1-.04*r;
      limb.orbit=windup?w:impact?1:r;limb.spin=impact?.25*p:.25*r;limb.extension=frontExtent;break;
    }
    case 'coin_elemental': { // Tighten the six-coin orbit, then sweep its leading rim into contact.
      frontExtent=21.5;const reach=Math.max(0,contactReach-frontExtent);
      travel=windup?-2.5*w:impact?reach:reach*r;lift=windup?-3*w:impact?2*(1-p):1.5*r;
      body.rotation=angle;body.scaleX=windup?1-.1*w:impact?1.03:1+.03*r;body.scaleY=windup?1+.13*w:impact?.94:1-.06*r;
      limb.orbit=windup?w:impact?1:r;limb.spin=impact?.65*p:.65*r;limb.extension=frontExtent;break;
    }
  }
  const anchor={x:direction.x*travel,y:direction.y*travel+lift},py=pivot[family],sin=Math.sin(body.rotation),cos=Math.cos(body.rotation);
  body.x=anchor.x+py*body.scaleY*sin;body.y=anchor.y+py-py*body.scaleY*cos;
  return {family,phase:phase.phase,progress:p,direction,sourceRadius,targetRadius,centerLimit,weaponReach,contactReach,frontExtent,body,anchor,limb,disableFacingFlip:true};
}

export function drawDungeonMobMeleeLimbV2A(c,pose,flash=false){
  if(!pose||!families.has(pose.family))return false;
  const {family,anchor,limb}=pose;
  if(!['gilded_scuttler','void_crawler','void_spectre','void_wraith'].includes(family))return true;
  c.save();c.translate(anchor.x,anchor.y-8);c.rotate(Math.atan2(pose.direction.y,pose.direction.x));c.lineCap='round';c.lineJoin='round';
  if(family==='gilded_scuttler'){
    c.fillStyle=flash?'#fff':'#ffd700';c.strokeStyle=flash?'#fff':'#765b11';c.lineWidth=1;
    for(const side of [-1,1]){c.beginPath();c.moveTo(9,side*3);c.quadraticCurveTo(limb.extension-2,side*(limb.open+3),limb.extension,side*limb.open);c.lineTo(limb.extension-3,side);c.closePath();c.fill();c.stroke();}
  }else if(family==='void_crawler'){
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
  c.save();c.translate(contact.sourcePosition.x+u.x*near,contact.sourcePosition.y+u.y*near-8);c.rotate(Math.atan2(u.y,u.x));c.globalAlpha*=(1-t)**1.25;c.lineCap='round';c.lineJoin='round';
  switch(contact.family){
    case 'gilded_scuttler':c.strokeStyle='#e6c76b';c.lineWidth=1.6;c.beginPath();c.moveTo(-3,-4);c.lineTo(1,0);c.lineTo(-3,4);c.moveTo(3,-4);c.lineTo(5,-6);c.moveTo(3,4);c.lineTo(5,6);c.stroke();break;
    case 'mimic_shield':c.strokeStyle='#b8bec0';c.lineWidth=1.8;c.beginPath();c.moveTo(-4,-5);c.quadraticCurveTo(4,0,-4,5);c.stroke();c.fillStyle='#d5b354';for(const side of [-1,1]){c.beginPath();c.moveTo(0,side*4);c.lineTo(2,side);c.lineTo(4,side*4);c.closePath();c.fill();}break;
    case 'void_crawler':c.strokeStyle='#a86cb4';c.lineWidth=1.4;for(const side of [-1,1]){c.beginPath();c.moveTo(-3,side*4);c.lineTo(1,side);c.lineTo(4,side*3);c.stroke();}break;
    case 'void_spectre':c.strokeStyle='#b886c8';c.lineWidth=1.3;for(const side of [-1,1]){c.beginPath();c.moveTo(-4,side*5);c.quadraticCurveTo(2,side*2,5,-side*3);c.stroke();}break;
    case 'void_wraith':c.strokeStyle='#bd76ac';c.lineWidth=1.5;for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(-4,i*2-3);c.bezierCurveTo(5,i*2-4,6,i*2,2,i*2+3);c.stroke();}break;
    case 'rift_drifter':c.strokeStyle='#c98cbb';c.lineWidth=1.2;for(let i=0;i<3;i++){c.save();c.translate((i-1)*(3+2*t),(i%2?3:-2));c.rotate(i*.5);c.beginPath();c.moveTo(0,-2.5);c.lineTo(1.6,0);c.lineTo(0,2.5);c.lineTo(-1.6,0);c.closePath();c.stroke();c.restore();}break;
    case 'coin_elemental':c.strokeStyle='#e8c96c';c.lineWidth=1.4;c.beginPath();c.arc(-1,0,4,-1,1);c.moveTo(2,-5);c.lineTo(5,-7);c.moveTo(3,0);c.lineTo(7,0);c.moveTo(2,5);c.lineTo(5,7);c.stroke();break;
  }
  c.restore();return true;
}
