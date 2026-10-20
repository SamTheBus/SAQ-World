// Adapted from SamTheBus/SAQ-Dungeon commit 387c78bfaf9f492fe7b6ff4539b956c12c2a7cdc.
// mob_renderer.js ordinary vType branches; World supplies the clock, phases and
// deterministic visual seed. No Dungeon globals, gameplay mutation or RNG.

function draw_thorn_wyrm(c,m,presentationTime,seed){

        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + 2;
        let time = presentationTime / 130;
        c.strokeStyle = "#000000";
        c.lineWidth = 1.5;
        for (let i = 0; i < 5; i++) {
          let segX = cx + i * 5.5;
          let segY = cy + Math.sin(time - i * 0.8) * 3;
          c.beginPath();
          c.moveTo(segX, segY + 2);
          c.lineTo(segX - 2, segY + 7 + Math.sin(time * 2 + i) * 2);
          c.stroke();
        }
        for (let i = 4; i >= 0; i--) {
          let segX = cx + i * 5.5;
          let segY = cy + Math.sin(time - i * 0.8) * 3;
          let radius = 6.2 - i * 0.7;
          c.fillStyle =
            m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#e67e22" : "#27ae60";
          c.beginPath();
          c.arc(segX, segY, radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          if (m.flashTimer === 0) {
            c.fillStyle = m.isRare ? "#f1c40f" : "#1e8449";
            c.beginPath();
            c.moveTo(segX + 1, segY - radius);
            c.quadraticCurveTo(
              segX + 3,
              segY - radius - 4,
              segX,
              segY - radius - 5,
            );
            c.quadraticCurveTo(
              segX - 2,
              segY - radius - 2,
              segX - 1,
              segY - radius,
            );
            c.closePath();
            c.fill();
            c.stroke();
          }
        }
        c.fillStyle =
          m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#f39c12" : "#2ecc71";
        let hX = cx - 5;
        let hY = cy + Math.sin(time) * 3;
        c.beginPath();
        c.arc(hX, hY, 6.8, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = m.isRare ? "#ffea75" : "#2ecc71";
          c.beginPath();
          c.moveTo(hX - 2, hY - 5);
          c.quadraticCurveTo(hX - 7, hY - 10, hX - 9, hY - 9);
          c.quadraticCurveTo(hX - 5, hY - 4, hX - 1, hY - 4);
          c.closePath();
          c.fill();
          c.stroke();
          c.fillStyle = "#ffffff";
          c.beginPath();
          c.arc(hX - 2.5, hY - 1, 1.5, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          c.fillStyle = "#1e272e";
          c.beginPath();
          c.arc(hX - 3, hY - 1, 0.8, 0, Math.PI * 2);
          c.fill();
        }
  drawDungeonMobAnatomy(c,m,presentationTime,seed,'thorn_wyrm');
}

function draw_wyrmling(c,m,presentationTime,seed){

        // --- MOUNTAIN PEAK OVERHAUL: CRYSTAL FROST WYRM ---
        let time = presentationTime;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + Math.sin(time / 150) * 4;

        let bodyColor = m.flashTimer > 0 ? "#ffffff" : "#2b6cb0"; // Deep sapphire
        let crystalColor = m.isRare ? "#a855f7" : "#81ecec"; // Cyan/Purple ice

        // 1. Render Segmented Serpentine Body
        for (let i = 4; i >= 0; i--) {
          let segX = cx + i * 7.5;
          let segY = cy + Math.sin(time / 200 - i * 0.8) * 6;
          let radius = 8 - i * 1.2;

          // Back Ice Shards (rendered behind segment)
          if (m.flashTimer === 0) {
            c.fillStyle = crystalColor;
            c.globalAlpha = 0.6;
            c.beginPath();
            c.moveTo(segX - 2, segY - radius);
            c.lineTo(segX, segY - radius - 6 + i);
            c.lineTo(segX + 2, segY - radius);
            c.closePath();
            c.fill();
            c.globalAlpha = 1.0;
          }

          // Main Segment Body
          let segGrad = c.createRadialGradient(
            segX - 2,
            segY - 2,
            1,
            segX,
            segY,
            radius,
          );
          if (m.flashTimer > 0) {
            segGrad.addColorStop(0, "#ffffff");
            segGrad.addColorStop(1, "#ffffff");
          } else {
            segGrad.addColorStop(0, crystalColor);
            segGrad.addColorStop(1, bodyColor);
          }
          c.fillStyle = segGrad;
          c.beginPath();
          c.arc(segX, segY, radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
        }

        // 2. Slender Draconic Head
        let headY = cy - 14;
        c.fillStyle = bodyColor;
        c.beginPath();
        c.ellipse(cx, headY, 8, 7, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // 3. Crystalline Horns
        for (let i = -1; i <= 1; i += 2) {
          c.fillStyle = crystalColor;
          c.beginPath();
          c.moveTo(cx + i * 3, headY - 4);
          c.lineTo(cx + i * 6, headY - 12);
          c.lineTo(cx + i * 1, headY - 6);
          c.closePath();
          c.fill();
          c.stroke();
        }

        // 4. Glowing Sub-Zero Eyes
        if (m.flashTimer === 0) {
          c.fillStyle = "#ffffff";
          c.shadowBlur = 6;
          c.shadowColor = crystalColor;
          c.beginPath();
          c.arc(cx - 3, headY - 2, 1.5, 0, Math.PI * 2);
          c.arc(cx + 3, headY - 2, 1.5, 0, Math.PI * 2);
          c.fill();
          c.shadowBlur = 0;
        }

        // 5. Frost Breath Vapor
  drawDungeonMobAnatomy(c,m,presentationTime,seed,'wyrmling');
}

function draw_magma_elemental(c,m,presentationTime,seed){

        let flicker = Math.sin(presentationTime / 60) * 3;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a0805";
        c.beginPath();
        c.roundRect(cx - 14, cy - 6, 28, 22, [4]);
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.strokeStyle = "#ff5500";
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(cx - 6, cy);
          c.stroke();
        }
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#d35400";
        c.beginPath();
        c.moveTo(cx - 14, cy);
        c.quadraticCurveTo(cx - 24 - flicker, cy + 4, cx - 20, cy + 12);
        c.lineTo(cx - 11, cy + 6);
        c.moveTo(cx + 14, cy);
        c.quadraticCurveTo(cx + 24 + flicker, cy + 4, cx + 20, cy + 12);
        c.lineTo(cx + 11, cy + 6);
        c.closePath();
        c.fill();
        c.stroke();
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2d110b";
        c.beginPath();
        c.arc(cx, cy - 12, 8, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = "#e67e22";
        c.beginPath();
        c.moveTo(cx - 6, cy - 18);
        c.quadraticCurveTo(cx, cy - 28 - flicker, cx + 6, cy - 18);
        c.quadraticCurveTo(cx + 3, cy - 12, cx - 3, cy - 12);
        c.closePath();
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "#f1c40f";
          c.beginPath();
          c.arc(cx - 3, cy - 12, 1.5, 0, Math.PI * 2);
          c.arc(cx + 3, cy - 12, 1.5, 0, Math.PI * 2);
          c.fill();
        }
  drawDungeonMobAnatomy(c,m,presentationTime,seed,'magma_elemental');
}

function draw_lava_serpent(c,m,presentationTime,seed){

        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + 2;
        let time = presentationTime / 140;
        for (let i = 5; i >= 0; i--) {
          let segX = cx + i * 5.5;
          let segY = cy + Math.sin(time - i * 0.8) * 3.5;
          let radius = 6.5 - i * 0.7;
          c.fillStyle =
            m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#ff8c00" : "#1c0905";
          c.beginPath();
          c.arc(segX, segY, radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          if (m.flashTimer === 0) {
            c.fillStyle = m.isRare ? "#ffffff" : "#ff3300";
            c.beginPath();
            c.arc(segX, segY, radius * 0.45, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = "#2c110c";
            c.beginPath();
            c.moveTo(segX + 1, segY - radius);
            c.lineTo(segX - 2, segY - radius - 3);
            c.lineTo(segX - 3, segY - radius);
            c.closePath();
            c.fill();
            c.stroke();
          }
        }
        c.fillStyle =
          m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#ff4500" : "#110200";
        let hX = cx - 5;
        let hY = cy + Math.sin(time) * 3.5;
        c.beginPath();
        c.moveTo(hX + 6, hY - 6);
        c.lineTo(hX - 7, hY - 5);
        c.lineTo(hX - 8, hY + 1);
        c.lineTo(hX + 6, hY + 7);
        c.closePath();
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "#e67e22";
          c.beginPath();
          c.moveTo(hX + 2, hY - 5);
          c.quadraticCurveTo(hX + 7, hY - 11, hX + 10, hY - 10);
          c.lineTo(hX + 3, hY - 2);
          c.closePath();
          c.fill();
          c.stroke();
          c.fillStyle = "#f1c40f";
          c.beginPath();
          c.arc(hX - 2, hY - 1, 1.2, 0, Math.PI * 2);
          c.fill();
        }
  drawDungeonMobAnatomy(c,m,presentationTime,seed,'lava_serpent');
}

function draw_hell_bat(c,m,presentationTime,seed){

        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + Math.sin(presentationTime / 110) * 3;
        let batWing = Math.sin(presentationTime / 70) * 11;
        if(m.familyAttack){const a=m.familyAttack,p=a.progress,launch=smooth((p-.4)/.6);
          const wing=a.phase==='windup'?13*(1-launch)-8*launch:-8;
          const blend=a.phase==='windup'?smooth(p/.4):a.phase==='recovery'?1-smooth(p):1;batWing+=(wing-batWing)*blend;}
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1e1f26";
        c.beginPath();
        c.ellipse(cx, cy, 7, 11, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#962d22";
        c.beginPath();
        c.moveTo(cx - 5, cy - 2);
        c.quadraticCurveTo(
          cx - 18,
          cy - 12 - batWing,
          cx - 22,
          cy - 5 - batWing,
        );
        c.quadraticCurveTo(cx - 12, cy, cx - 5, cy - 2);
        c.moveTo(cx + 5, cy - 2);
        c.quadraticCurveTo(
          cx + 18,
          cy - 12 - batWing,
          cx + 22,
          cy - 5 - batWing,
        );
        c.quadraticCurveTo(cx + 12, cy, cx + 5, cy - 2);
        c.closePath();
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "#ff6b6b";
          c.beginPath();
          c.arc(cx - 2, cy - 4, 1.5, 0, Math.PI * 2);
          c.arc(cx + 2, cy - 4, 1.5, 0, Math.PI * 2);
          c.fill();
        }
  drawDungeonMobAnatomy(c,m,presentationTime,seed,'hell_bat');
}

function draw_slag_slime(c,m,presentationTime,seed){

        const a=m.familyAttack,blend=!a?0:a.phase==='windup'?smooth(a.progress):a.phase==='recovery'?1-smooth(a.progress):1;
        let squish = Math.sin(presentationTime / 100) * 3.5*(1-blend);
        let wScale = m.w / 2 + squish;
        let hScale = m.h / 2 - squish;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h - 10 + squish / 2;

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
          slimeGrad.addColorStop(1, "#27ae60");
        }

        c.fillStyle = slimeGrad;
        c.beginPath();
        c.ellipse(cx, cy, wScale * 1.2, hScale * 0.9, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Bounded deterministic bubbles replace source render RNG/globals.
        if(m.flashTimer===0){const t=presentationTime/600+(seed%31);c.fillStyle='rgba(46,204,113,.6)';
          for(let i=0;i<2;i++){const phase=(t+i*.47)%1;c.beginPath();c.arc(cx+Math.sin(i*2+seed)*wScale*.4,cy-hScale*.4-phase*4,1.2+phase,0,Math.PI*2);c.fill();}}

        if (m.flashTimer === 0) {
          c.fillStyle = "#7f8c8d";
          c.beginPath();
          c.moveTo(cx - 4, cy - 2);
          c.lineTo(cx + 4, cy - 5);
          c.lineTo(cx + 2, cy + 3);
          c.closePath();
          c.fill();
          c.stroke();

          c.fillStyle = "#110202";
          let eyeOffsetX = wScale * 0.35;
          let eyeOffsetY = hScale * 0.1;
          c.beginPath();
          c.arc(cx - eyeOffsetX + 3, cy - eyeOffsetY, 1.8, 0, Math.PI * 2);
          c.arc(cx + eyeOffsetX + 3, cy - eyeOffsetY, 1.8, 0, Math.PI * 2);
          c.fill();

          c.fillStyle = "#1e272e";
          c.fillRect(cx - 8, cy + hScale * 0.3, 3, 5);
          c.fillRect(cx + 4, cy + hScale * 0.2, 2, 4);
        }
  drawDungeonMobAnatomy(c,m,presentationTime,seed,'slag_slime');
}

function draw_swamp_basilisk(c,m,presentationTime,seed){

        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + 2;
        let time = presentationTime / 150;
        for (let i = 5; i >= 0; i--) {
          let segX = cx + i * 5.5;
          let segY = cy + Math.sin(time - i * 0.8) * 3.5;
          let radius = 6.5 - i * 0.7;
          c.fillStyle =
            m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#00b894" : "#1a3a22";
          c.beginPath();
          c.arc(segX, segY, radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          if (m.flashTimer === 0) {
            c.fillStyle = m.isRare ? "#ff007f" : "#9b59b6";
            c.beginPath();
            c.moveTo(segX + 1, segY - radius);
            c.lineTo(segX - 1, segY - radius - 4);
            c.lineTo(segX - 2, segY - radius);
            c.closePath();
            c.fill();
            c.stroke();
          }
        }
        c.fillStyle =
          m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#00b894" : "#122c19";
        let hX = cx - 5;
        let hY = cy + Math.sin(time) * 3.5;
        c.beginPath();
        c.moveTo(hX + 7, hY - 7);
        c.lineTo(hX - 8, hY - 3);
        c.lineTo(hX - 7, hY + 4);
        c.lineTo(hX + 7, hY + 7);
        c.closePath();
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "#ffffff";
          c.beginPath();
          c.moveTo(hX - 6, hY - 1);
          c.lineTo(hX - 8, hY + 2);
          c.lineTo(hX - 4, hY + 1);
          c.closePath();
          c.fill();
          c.fillStyle = "#f1c40f";
          c.beginPath();
          c.arc(hX - 2, hY - 2, 1.2, 0, Math.PI * 2);
          c.fill();
        }
  drawDungeonMobAnatomy(c,m,presentationTime,seed,'swamp_basilisk');
}

function draw_toxic_fly(c,m,presentationTime,seed){

        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + Math.sin(presentationTime / 110) * 4;
        let wing = Math.sin(presentationTime / 60) * 11;
        c.fillStyle = "rgba(46, 204, 113, 0.4)";
        c.beginPath();
        c.ellipse(cx - 7, cy - 4, 5, 12 + wing, -Math.PI / 4, 0, Math.PI * 2);
        c.ellipse(cx + 7, cy - 4, 5, 12 + wing, Math.PI / 4, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
        c.beginPath();
        c.arc(cx, cy, 6, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2ecc71";
        c.beginPath();
        c.ellipse(cx, cy + 9, 5, 7, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
  drawDungeonMobAnatomy(c,m,presentationTime,seed,'toxic_fly');
}

function draw_marsh_ghost(c,m,presentationTime,seed){

        // Render a wispy, translucent, floating swamp phantom
        let hover = Math.sin(presentationTime / 140) * 6;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;

        c.save();
        // Translucent glowing trail
        let glowTime = presentationTime / 200;
        let trailGrad = c.createLinearGradient(cx, cy - 10, cx, cy + 22);
        if (m.flashTimer > 0) {
          trailGrad.addColorStop(0, "#ffffff");
          trailGrad.addColorStop(1, "rgba(255,255,255,0)");
        } else {
          trailGrad.addColorStop(0, "rgba(46, 204, 113, 0.7)");
          trailGrad.addColorStop(0.5, "rgba(155, 89, 182, 0.4)");
          trailGrad.addColorStop(1, "rgba(0,0,0,0)");
        }

        c.fillStyle = trailGrad;
        c.beginPath();
        c.moveTo(cx - 12, cy - 4);
        c.quadraticCurveTo(cx - 16, cy + 8, cx - 4, cy + 22);
        c.lineTo(cx + 4, cy + 22);
        c.quadraticCurveTo(cx + 16, cy + 8, cx + 12, cy - 4);
        c.closePath();
        c.fill();

        // Wispy spirit head
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#111a14";
        c.strokeStyle = "#000";
        c.lineWidth = 1.8;
        c.beginPath();
        c.arc(cx, cy - 10, 9, Math.PI, 0);
        c.lineTo(cx + 9, cy + 2);
        c.quadraticCurveTo(cx + 6, cy + 8, cx, cy + 12);
        c.quadraticCurveTo(cx - 6, cy + 8, cx - 9, cy + 2);
        c.closePath();
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          // Glowing swamp eyes
          c.fillStyle = "#55efc4";
          c.shadowBlur = 6;
          c.shadowColor = "#55efc4";
          c.beginPath();
          c.arc(cx - 3, cy - 10, 1.8, 0, Math.PI * 2);
          c.arc(cx + 3, cy - 10, 1.8, 0, Math.PI * 2);
          c.fill();
          c.shadowBlur = 0;
        }
        c.restore();
  drawDungeonMobAnatomy(c,m,presentationTime,seed,'marsh_ghost');
}

function draw_corroded_golem(c,m,presentationTime,seed){

        let hover = Math.sin(presentationTime / 130) * 2;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
        c.beginPath();
        c.roundRect(cx - 15, cy - 10, 30, 20, [3]);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.strokeStyle = "#2ecc71";
          c.lineWidth = 1.8;
          c.beginPath();
          c.moveTo(cx - 8, cy - 4);
          c.lineTo(cx - 2, cy + 2);
          c.lineTo(cx + 6, cy - 6);
          c.stroke();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#5d6d7e";
        c.beginPath();
        c.arc(cx - 18, cy - 6, 6, 0, Math.PI * 2);
        c.arc(cx + 18, cy - 6, 6, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        if(!m.familyAttack){
        if (m.flashTimer === 0) {
          c.strokeStyle = "#2ecc71";
          c.lineWidth = 2.5;
          c.beginPath();
          c.moveTo(cx - 15, cy + 2);
          c.quadraticCurveTo(cx - 22, cy + 12, cx - 18, cy + 18);
          c.moveTo(cx + 15, cy + 2);
          c.quadraticCurveTo(cx + 22, cy + 12, cx + 18, cy + 18);
          c.stroke();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
        c.beginPath();
        c.roundRect(cx - 22, cy + 14, 8, 8, [2]);
        c.roundRect(cx + 14, cy + 14, 8, 8, [2]);
        c.fill();
        c.stroke();

        }
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
        c.beginPath();
        c.roundRect(cx - 8, cy - 24, 16, 14, [4]);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.fillStyle = "#2ecc71";
          c.shadowBlur = 8;
          c.shadowColor = "#2ecc71";
          c.fillRect(cx - 6, cy - 18, 12, 3);
          c.shadowBlur = 0;
        }
  drawDungeonMobAnatomy(c,m,presentationTime,seed,'corroded_golem');
}

function draw_void_orb(c,m,presentationTime,seed){

        let hover = Math.sin(presentationTime / 150) * 4;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;
        let rot = presentationTime / 800;

        // 1. Draw BACK segment of the gravity ring first (Math.PI to 2*Math.PI)
        if (m.flashTimer === 0) {
          c.strokeStyle = "#8e44ad";
          c.lineWidth = 1.8;
          c.save();
          c.translate(cx, cy);
          c.rotate(rot);
          c.beginPath();
          c.ellipse(0, 0, 22, 6, 0, Math.PI, 0); // Upper arc (behind core)
          c.stroke();
          c.restore();
        }

        // 2. Draw Void Orb core sphere
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#0d011a";
        c.beginPath();
        c.arc(cx, cy, 14, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // 3. Draw FRONT segment of the gravity ring last (0 to Math.PI)
        if (m.flashTimer === 0) {
          c.strokeStyle = "#8e44ad";
          c.lineWidth = 1.8;
          c.save();
          c.translate(cx, cy);
          c.rotate(rot);
          c.beginPath();
          c.ellipse(0, 0, 22, 6, 0, 0, Math.PI); // Lower arc (in front of core)
          c.stroke();
          c.restore();
        }
  drawDungeonMobAnatomy(c,m,presentationTime,seed,'void_orb');
}

export const DUNGEON_MOB_PAINTERS_V1=Object.freeze({thorn_wyrm:draw_thorn_wyrm,wyrmling:draw_wyrmling,magma_elemental:draw_magma_elemental,lava_serpent:draw_lava_serpent,hell_bat:draw_hell_bat,slag_slime:draw_slag_slime,swamp_basilisk:draw_swamp_basilisk,toxic_fly:draw_toxic_fly,marsh_ghost:draw_marsh_ghost,corroded_golem:draw_corroded_golem,void_orb:draw_void_orb});

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=v=>{const p=clamp(v,0,1);return p*p*(3-2*p);};
const rangedFamilies=new Set(['thorn_wyrm','wyrmling','magma_elemental','toxic_fly','void_orb']);
export function hostileRangedPose(actor,tick){
  const r=actor.ranged;if(!actor.alive||!r||r.phase==='idle'||!rangedFamilies.has(actor.enemyFamily))return null;
  const d=r.aim??(r.targetPosition?{x:r.targetPosition.x-actor.position.x,y:r.targetPosition.y-actor.position.y}:{x:actor.presentationFacingX??1,y:0}),length=Math.hypot(d.x,d.y),direction=length>.001?{x:d.x/length,y:d.y/length}:{x:1,y:0};
  const p=clamp((tick-r.phaseStartedTick)/Math.max(1,r.phaseEndsTick-r.phaseStartedTick),0,1),charge=r.phase==='windup'?smooth(p):0;
  const release=r.phase==='recovery'?Math.max(0,1-(tick-r.phaseStartedTick)/3):0,recovery=r.phase==='recovery'?1-p:0,angle=Math.atan2(direction.y,direction.x),family=actor.enemyFamily;
  const body={x:0,y:0,rotation:0,scaleX:1,scaleY:1};let travel=0;
  const hold=r.phase==='windup'?charge:1-smooth(p),kick=r.phase==='recovery'?Math.sin(Math.PI*clamp((tick-r.phaseStartedTick)/4,0,1)):0;
  switch(family){
    case 'thorn_wyrm':body.rotation=direction.x*(.08*hold-.04*kick);body.scaleX=1-.16*hold+.05*kick;body.scaleY=1+.12*hold;travel=-3*hold-2*kick;break;
    case 'wyrmling':body.rotation=direction.x*(-.09*hold+.06*kick);body.y=-3*hold;body.scaleY=1+.08*hold-.06*kick;travel=-2*hold-3*kick;break;
    case 'magma_elemental':body.rotation=direction.x*(-.06*hold+.08*kick);body.scaleX=1+.08*hold;body.scaleY=1-.08*hold+.06*kick;travel=-hold-4*kick;break;
    case 'toxic_fly':body.rotation=direction.x*(-.12*hold+.08*kick);body.scaleX=1+.12*hold;body.scaleY=1-.13*hold+.1*kick;body.y=-2*hold;travel=-2*hold+1.5*kick;break;
    case 'void_orb':body.rotation=angle*.16+charge*.2;body.scaleX=1+.12*charge-.1*release;body.scaleY=1-.1*charge+.12*release;travel=-2*charge-2*release;break;
  }
  body.x+=direction.x*travel;body.y+=direction.y*travel;
  return {family,ranged:true,...(family!=='void_orb'?{upright:true,bodyPivot:{x:0,y:-10}}:{}),phase:r.phase,progress:p,charge,release,recovery,direction,body,limb:{extension:0,sweep:0,open:charge}};
}

function drawDungeonMobAnatomy(c,m,time,seed,family){
  const cast=m.rangedPose,attack=m.familyAttack;
  if(!cast&&!attack)return;
  const q=cast?.charge??0,k=cast?.release??0,wind=attack?.phase==='windup'?attack.progress:0;
  c.save();c.lineJoin='round';c.lineCap='round';
  if(family==='thorn_wyrm'){
    const y=-10+Math.sin(time/130)*3;c.fillStyle='#123b21';c.beginPath();c.ellipse(-11,y,1.5+q*1.5,.8+q*2,0,0,Math.PI*2);c.fill();
    c.fillStyle='#b9dc83';c.beginPath();c.moveTo(-12-q*2,y);c.lineTo(-15-q*2-k*2,y-1.5);c.lineTo(-14-q*2,y+1.5);c.closePath();c.fill();
  }else if(family==='wyrmling'){
    const y=-30+Math.sin(time/150)*4;c.fillStyle='#163b61';c.beginPath();c.ellipse(0,y,2+q*2,1+q*2.5,0,0,Math.PI*2);c.fill();
    c.strokeStyle='#d2ffff';c.lineWidth=1;for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(i*2,y-2);c.lineTo(i*(2+q*2),y-4-q*3-k*2);c.stroke();}
  }else if(family==='magma_elemental'){
    c.fillStyle='#f4b649';c.beginPath();c.moveTo(-3,-15);c.lineTo(0,-22-q*5-k*3);c.lineTo(4,-15);c.lineTo(0,-10);c.closePath();c.fill();
    c.strokeStyle='#ffe7a3';c.lineWidth=1.2;c.beginPath();c.moveTo(-6,-7);c.lineTo(-3,-11-q*3);c.moveTo(6,-7);c.lineTo(3,-11-q*3);c.stroke();
  }else if(family==='toxic_fly'){
    const y=-18+Math.sin(time/110)*4;c.strokeStyle='#263b2e';c.lineWidth=2.5;c.beginPath();c.moveTo(0,y+2);c.lineTo(0,y-2-q*4);c.stroke();
    c.fillStyle='#87d877';c.beginPath();c.ellipse(0,y-3-q*4,1.5+q*1.8,1+q*1.3,0,0,Math.PI*2);c.fill();
  }else if(family==='void_orb'){
    const y=-12+Math.sin(time/150)*4;c.strokeStyle='#cb8edc';c.lineWidth=1.4;c.beginPath();c.ellipse(0,y,4+q*5-k*2,6+q*3-k*2,time/400,0,Math.PI*2);c.stroke();
    c.fillStyle='#e296c1';c.beginPath();c.arc(0,y,1.5+q*2+k,0,Math.PI*2);c.fill();
  }else if(family==='lava_serpent'||family==='swamp_basilisk'){
    const y=-10+Math.sin(time/(family==='lava_serpent'?140:150))*3.5;
    c.fillStyle=family==='lava_serpent'?'#5f1b09':'#101e12';c.beginPath();c.moveTo(-10,y-2-wind*2);c.lineTo(-15,y-1);c.lineTo(-10,y+3+wind*2);c.closePath();c.fill();
    c.fillStyle=family==='lava_serpent'?'#f3b654':'#e3e9ce';for(const side of [-1,1]){c.beginPath();c.moveTo(-12,y+side*(2+wind));c.lineTo(-15,y+side*.6);c.lineTo(-10,y+side*(2+wind));c.fill();}
  }else if(family==='hell_bat'){
    c.fillStyle='#f0d6bd';c.beginPath();c.moveTo(-2,-14);c.lineTo(-1,-10+wind*2);c.lineTo(0,-14);c.moveTo(1,-14);c.lineTo(2,-10+wind*2);c.lineTo(3,-14);c.fill();
  }else if(family==='marsh_ghost'){
    c.strokeStyle='#72bdae';c.lineWidth=1.4;c.globalAlpha=.65;for(const side of [-1,1]){c.beginPath();c.moveTo(side*7,-8);c.quadraticCurveTo(side*(13+wind*3),-17,side*8,-21-wind*4);c.stroke();}
  }
  c.restore();
}
