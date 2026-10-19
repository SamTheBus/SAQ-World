// Port: Dungeon dungeon_map.js STATION_FORGE sections 1–8. No NPC ownership.
export function drawForgeStation(ctx,cx,cy,time){
        ctx.save();

        // 1. Charred Stone Hearth Base Pad
        let hearthW = 76;
        let hearthH = 30;
        let hearthX = cx - hearthW / 2;
        let hearthY = cy - 6;

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.beginPath();
        ctx.roundRect(hearthX - 2, hearthY - 2, hearthW + 4, hearthH + 4, [4]);
        ctx.fill();

        ctx.fillStyle = "#1c1917";
        ctx.strokeStyle = "#0c0a09";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(hearthX, hearthY, hearthW, hearthH, [3]);
        ctx.fill();
        ctx.stroke();

        // Glowing Magma Seams in the Hearth
        ctx.strokeStyle = "rgba(249, 115, 22, 0.35)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(hearthX + 12, hearthY + 8);
        ctx.lineTo(hearthX + 28, hearthY + 16);
        ctx.lineTo(hearthX + 48, hearthY + 10);
        ctx.moveTo(hearthX + 32, hearthY + 20);
        ctx.lineTo(hearthX + 60, hearthY + 22);
        ctx.stroke();

        // 2. Heat Aura Radial Glow
        let glowPulse = 1.0 + Math.sin(time / 160) * 0.15;
        let heatGrad = ctx.createRadialGradient(
          cx - 6,
          cy - 4,
          6,
          cx - 6,
          cy - 4,
          52 * glowPulse,
        );
        heatGrad.addColorStop(0, "rgba(255, 90, 0, 0.6)");
        heatGrad.addColorStop(0.5, "rgba(245, 158, 11, 0.25)");
        heatGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = heatGrad;
        ctx.beginPath();
        ctx.arc(cx - 6, cy - 4, 52 * glowPulse, 0, Math.PI * 2);
        ctx.fill();

        // 3. Chimney Smoke Plumes
        for (let s = 0; s < 4; s++) {
          let seed = s * 73.1;
          let progress = (time / 850 + seed) % 1.0;
          let smkX = cx - 8 + Math.sin(time / 180 + seed) * 8;
          let smkY = cy - 42 - progress * 26;
          let smkAlpha = (1.0 - progress) * 0.35;
          let smkSize = 4.0 + progress * 7.0;

          ctx.fillStyle = `rgba(120, 113, 108, ${smkAlpha})`;
          ctx.beginPath();
          ctx.arc(smkX, smkY, smkSize, 0, Math.PI * 2);
          ctx.fill();
        }

        // 4. Chimney Stack & Iron Bands
        ctx.fillStyle = "#292524";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.roundRect(cx - 20, cy - 40, 24, 20, [3, 3, 0, 0]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#78350f";
        ctx.fillRect(cx - 21, cy - 38, 26, 3);
        ctx.strokeRect(cx - 21, cy - 38, 26, 3);
        ctx.fillRect(cx - 21, cy - 25, 26, 3);
        ctx.strokeRect(cx - 21, cy - 25, 26, 3);

        // 5. Main Blast Furnace Body
        ctx.fillStyle = "#1c1917";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.roundRect(cx - 30, cy - 22, 48, 38, [5]);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "#0c0a09";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx - 30, cy - 12);
        ctx.lineTo(cx + 18, cy - 12);
        ctx.moveTo(cx - 30, cy - 2);
        ctx.lineTo(cx + 18, cy - 2);
        ctx.moveTo(cx - 30, cy + 8);
        ctx.lineTo(cx + 18, cy + 8);
        ctx.stroke();

        // Arched Firebox Hearth
        let flick1 = Math.sin(time / 80) * 2.5;
        let flick2 = Math.cos(time / 100) * 2.0;

        ctx.fillStyle = "#0c0a09";
        ctx.strokeStyle = "#451a03";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.roundRect(cx - 20, cy - 8, 28, 22, [8, 8, 2, 2]);
        ctx.fill();
        ctx.stroke();

        let fireGrad = ctx.createRadialGradient(
          cx - 6,
          cy + 4,
          2,
          cx - 6,
          cy + 4,
          14 + flick1,
        );
        fireGrad.addColorStop(0, "#ffffff");
        fireGrad.addColorStop(0.3, "#fef08a");
        fireGrad.addColorStop(0.65, "#f97316");
        fireGrad.addColorStop(1, "#dc2626");

        ctx.fillStyle = fireGrad;
        ctx.beginPath();
        ctx.arc(cx - 6, cy + 4, 13 + Math.abs(flick1), 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ea580c";
        ctx.beginPath();
        ctx.moveTo(cx - 18, cy + 12);
        ctx.quadraticCurveTo(
          cx - 12 + flick1,
          cy - 12 + flick2,
          cx - 8,
          cy + 4,
        );
        ctx.quadraticCurveTo(cx - 6 + flick2, cy - 14 + flick1, cx - 2, cy + 4);
        ctx.quadraticCurveTo(
          cx + 3 - flick1,
          cy - 10 + flick2,
          cx + 6,
          cy + 12,
        );
        ctx.closePath();
        ctx.fill();

        // 6. Quenching Trough (Left)
        ctx.fillStyle = "#451a03";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(cx - 36, cy + 6, 12, 16, [2]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#0284c7";
        ctx.fillRect(cx - 34, cy + 8, 8, 12);

        for (let st = 0; st < 2; st++) {
          let stmProgress = (time / 500 + st * 0.5) % 1.0;
          let stmX = cx - 30 + Math.sin(time / 150 + st) * 3;
          let stmY = cy + 6 - stmProgress * 14;
          let stmAlpha = (1.0 - stmProgress) * 0.5;

          ctx.fillStyle = `rgba(224, 242, 254, ${stmAlpha})`;
          ctx.beginPath();
          ctx.arc(stmX, stmY, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }

        // 7. Mechanical Bellows (Far Left)
        let bellowsPump = Math.sin(time / 150) * 3;
        ctx.save();
        ctx.translate(cx - 30, cy - 2);

        ctx.fillStyle = "#78350f";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-10 - bellowsPump, -7);
        ctx.lineTo(-10 - bellowsPump, 7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#f1c40f";
        ctx.fillRect(0, -2, 5, 4);
        ctx.strokeRect(0, -2, 5, 4);
        ctx.restore();

        // 8. Anvil & Red-Hot Workpiece (Right)
        let anvilX = cx + 22;
        let anvilY = cy + 10;

        ctx.fillStyle = "#5c2e16";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.roundRect(anvilX - 9, anvilY + 2, 18, 12, [2]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#475569";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.8;

        ctx.beginPath();
        ctx.moveTo(anvilX - 12, anvilY - 4);
        ctx.lineTo(anvilX + 8, anvilY - 4);
        ctx.lineTo(anvilX + 8, anvilY - 9);
        ctx.lineTo(anvilX - 6, anvilY - 9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(anvilX - 5, anvilY - 9, 12, 1.5);

        // Red-Hot Glowing Sword Blade on Anvil
        ctx.fillStyle = "#facc15";
        ctx.shadowBlur = 0;
        ctx.shadowColor = "#f97316";
        ctx.fillRect(anvilX - 2, anvilY - 11, 10, 2.5);
        ctx.shadowBlur = 0;


ctx.restore();
}
