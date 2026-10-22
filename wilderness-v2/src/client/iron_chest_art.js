// Dungeon dungeon_map.js:2261–2726. Canvas art only; fixed iron-bound tier.
// Caller supplies authoritative open state and disposable lid interpolation.
export function drawIronChest(ctx,cx,cy,time,P){const tier="iron_bound",isOpen=P>=1;
        let closedScaleY = Math.max(0, Math.cos((P * Math.PI) / 2));
        let openScaleY = Math.max(0, Math.sin((P * Math.PI) / 2));

        ctx.save();

        // 1. Soft Ambient Occlusion Drop Shadow
        let baseShadowW = 13 + (tier !== "iron_bound" ? 1 : 0);
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.beginPath();
        ctx.ellipse(cx, cy + 9, baseShadowW, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Warm Tiered Floor Glow
        let pulse = Math.sin(time / 200) * 1.8;
        let auraRadius =
          (tier === "iron_bound" ? 16 : tier === "gilded" ? 18 : 20) + pulse;
        let auraGrad = ctx.createRadialGradient(
          cx,
          cy + 2,
          2,
          cx,
          cy + 2,
          auraRadius,
        );
        if (tier === "iron_bound") {
          auraGrad.addColorStop(
            0,
            isOpen ? "rgba(230, 126, 34, 0.12)" : "rgba(230, 126, 34, 0.35)",
          );
          auraGrad.addColorStop(
            0.6,
            isOpen ? "rgba(230, 126, 34, 0.02)" : "rgba(139, 69, 19, 0.12)",
          );
        } else if (tier === "gilded") {
          auraGrad.addColorStop(
            0,
            isOpen ? "rgba(255, 215, 0, 0.18)" : "rgba(255, 215, 0, 0.45)",
          );
          auraGrad.addColorStop(
            0.5,
            isOpen ? "rgba(230, 126, 34, 0.04)" : "rgba(230, 126, 34, 0.18)",
          );
        } else {
          auraGrad.addColorStop(
            0,
            isOpen ? "rgba(0, 255, 255, 0.22)" : "rgba(0, 255, 255, 0.55)",
          );
          auraGrad.addColorStop(
            0.5,
            isOpen ? "rgba(168, 85, 247, 0.06)" : "rgba(168, 85, 247, 0.22)",
          );
        }
        auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(cx, cy + 2, auraRadius, 0, Math.PI * 2);
        ctx.fill();

        // Core Dimensions & Coordinates
        let w = 22;
        let bodyH = 11;
        let lidH = 6;
        let x = cx - w / 2;
        let y = cy - (bodyH + lidH) / 2 + 3;
        let y_hinge = y + lidH;

        // ==========================================
        // BACK LAYER: openScaleY Rotating open lid (Back Face)
        // ==========================================
        if (openScaleY > 0.01) {
          ctx.save();
          ctx.translate(cx, y_hinge);
          ctx.scale(1, -openScaleY); // scale upwards on rear hinge

          if (tier === "iron_bound") {
            ctx.fillStyle = "#2a1204";
            ctx.strokeStyle = "#100903";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-w / 2, 0);
            ctx.lineTo(-w / 2, -lidH * 1.5);
            ctx.quadraticCurveTo(0, -lidH * 1.5 - 4, w / 2, -lidH * 1.5);
            ctx.lineTo(w / 2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Inside dark cavity
            ctx.fillStyle = "#0c0502";
            ctx.fillRect(
              -w / 2 + 1.5,
              -lidH * 1.5 + 1.5,
              w - 3,
              lidH * 1.5 - 1.5,
            );

            // Wrought-iron banding
            ctx.fillStyle = "#334155";
            ctx.strokeStyle = "#0f172a";
            ctx.lineWidth = 1.0;
            ctx.fillRect(-w / 2 + 3, -lidH * 1.5, 3.5, lidH * 1.5);
            ctx.strokeRect(-w / 2 + 3, -lidH * 1.5, 3.5, lidH * 1.5);
            ctx.fillRect(w / 2 - 6.5, -lidH * 1.5, 3.5, lidH * 1.5);
            ctx.strokeRect(w / 2 - 6.5, -lidH * 1.5, 3.5, lidH * 1.5);
          } else if (tier === "gilded") {
            ctx.fillStyle = "#4a0404";
            ctx.strokeStyle = "#200101";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-w / 2, 0);
            ctx.lineTo(-w / 2, -lidH * 1.5);
            ctx.quadraticCurveTo(0, -lidH * 1.5 - 4, w / 2, -lidH * 1.5);
            ctx.lineTo(w / 2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Inside burgundy backing
            ctx.fillStyle = "#220101";
            ctx.fillRect(
              -w / 2 + 1.5,
              -lidH * 1.5 + 1.5,
              w - 3,
              lidH * 1.5 - 1.5,
            );

            // Gold banding
            ctx.fillStyle = "#ffd700";
            ctx.strokeStyle = "#855800";
            ctx.lineWidth = 1.0;
            ctx.fillRect(-w / 2 + 3, -lidH * 1.5, 3.5, lidH * 1.5);
            ctx.strokeRect(-w / 2 + 3, -lidH * 1.5, 3.5, lidH * 1.5);
            ctx.fillRect(w / 2 - 6.5, -lidH * 1.5, 3.5, lidH * 1.5);
            ctx.strokeRect(w / 2 - 6.5, -lidH * 1.5, 3.5, lidH * 1.5);
          } else {
            ctx.fillStyle = "#0c0a1a";
            ctx.strokeStyle = "#02e8ff";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-w / 2, 0);
            ctx.lineTo(-w / 2, -lidH * 1.5);
            ctx.quadraticCurveTo(0, -lidH * 1.5 - 4, w / 2, -lidH * 1.5);
            ctx.lineTo(w / 2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Inside dark celestial backing
            ctx.fillStyle = "#02020a";
            ctx.fillRect(
              -w / 2 + 1.5,
              -lidH * 1.5 + 1.5,
              w - 3,
              lidH * 1.5 - 1.5,
            );

            // Glowing cyan lines
            ctx.strokeStyle = "rgba(0, 255, 255, 0.6)";
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(-w / 2 + 4, -lidH * 1.5 + 3);
            ctx.lineTo(-w / 2 + 4, -1);
            ctx.moveTo(w / 2 - 4, -lidH * 1.5 + 3);
            ctx.lineTo(w / 2 - 4, -1);
            ctx.stroke();
          }

          ctx.restore();
        }

        // ==========================================
        // MIDDLE LAYER: Standard Lower Box Base Container
        // ==========================================
        let bodyGrad = ctx.createLinearGradient(x, y_hinge, x, y_hinge + bodyH);
        if (tier === "iron_bound") {
          bodyGrad.addColorStop(0, "#5c2e0b");
          bodyGrad.addColorStop(0.5, "#411f05");
          bodyGrad.addColorStop(1, "#1c0b02");
          ctx.fillStyle = bodyGrad;
          ctx.strokeStyle = "#100903";
        } else if (tier === "gilded") {
          bodyGrad.addColorStop(0, "#800020");
          bodyGrad.addColorStop(0.5, "#4a0404");
          bodyGrad.addColorStop(1, "#200101");
          ctx.fillStyle = bodyGrad;
          ctx.strokeStyle = "#200101";
        } else {
          bodyGrad.addColorStop(0, "#1e1b4b");
          bodyGrad.addColorStop(0.5, "#0f0b29");
          bodyGrad.addColorStop(1, "#030010");
          ctx.fillStyle = bodyGrad;
          ctx.strokeStyle = "#a855f7";
        }
        ctx.lineWidth = 1.5;
        ctx.fillRect(x, y_hinge, w, bodyH);
        ctx.strokeRect(x, y_hinge, w, bodyH);

        // Hardware Straps on Base Container
        ctx.fillStyle =
          tier === "iron_bound"
            ? "#334155"
            : tier === "gilded"
              ? "#ffd700"
              : "#00ffff";
        ctx.strokeStyle =
          tier === "iron_bound"
            ? "#0f172a"
            : tier === "gilded"
              ? "#855800"
              : "rgba(255,255,255,0.8)";
        ctx.lineWidth = 1.0;
        if (tier === "astral") {
          ctx.save();
          ctx.shadowBlur = 4;
          ctx.shadowColor = "#00ffff";
        }
        ctx.fillRect(x + 3, y_hinge, 3.5, bodyH);
        ctx.strokeRect(x + 3, y_hinge, 3.5, bodyH);
        ctx.fillRect(x + w - 6.5, y_hinge, 3.5, bodyH);
        ctx.strokeRect(x + w - 6.5, y_hinge, 3.5, bodyH);
        if (tier === "astral") ctx.restore();

        // ==========================================
        // INTERNAL VOID REVEAL (Scales with openScaleY / P)
        // ==========================================
        if (P > 0.01) {
          ctx.save();
          let revealH = Math.round(4 * P);

          if (tier === "iron_bound") {
            ctx.fillStyle = "#050201";
            ctx.fillRect(x + 1.5, y_hinge + 1, w - 3, revealH);
          } else if (tier === "gilded") {
            ctx.fillStyle = "#e5c158";
            ctx.fillRect(x + 1.5, y_hinge + 1, w - 3, revealH);
          } else {
            // Swirling nebula void
            let swirlR = (3 + Math.sin(time / 180) * 1.0) * P;
            let swirlGrad = ctx.createRadialGradient(
              cx,
              y_hinge + 2,
              1,
              cx,
              y_hinge + 2,
              swirlR + 2,
            );
            swirlGrad.addColorStop(0, "rgba(0, 255, 255, 0.45)");
            swirlGrad.addColorStop(0.6, "rgba(168, 85, 247, 0.2)");
            swirlGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = swirlGrad;
            ctx.beginPath();
            ctx.arc(cx, y_hinge + 2, swirlR + 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#030010";
            ctx.fillRect(x + 1.5, y_hinge + 1, w - 3, revealH);
          }
          ctx.restore();
        }

        // Hanging latch clasp (Angled pivot with P)
        if (P > 0.01) {
          ctx.save();
          ctx.translate(cx, y_hinge);
          // Pivot latch outward by up to 35 degrees as lid swings open
          let latchAngle = P * ((35 * Math.PI) / 180);
          ctx.rotate(-latchAngle);

          ctx.fillStyle =
            tier === "iron_bound"
              ? "#475569"
              : tier === "gilded"
                ? "#ffd700"
                : "#00ffff";
          ctx.strokeStyle =
            tier === "iron_bound"
              ? "#0f172a"
              : tier === "gilded"
                ? "#855800"
                : "#ffffff";
          ctx.lineWidth = 0.8;
          ctx.fillRect(-1.5, 0, 3, 5);
          ctx.strokeRect(-1.5, 0, 3, 5);
          ctx.restore();
        }

        // ==========================================
        // FRONT LAYER: closedScaleY Rotating closed lid (Front Face)
        // ==========================================
        if (closedScaleY > 0.01) {
          ctx.save();
          ctx.translate(cx, y_hinge);
          ctx.scale(1, closedScaleY); // scale down around hinge seam

          let lidGrad = ctx.createLinearGradient(-w / 2, -lidH, -w / 2, 0);
          if (tier === "iron_bound") {
            lidGrad.addColorStop(0, "#7c3f12");
            lidGrad.addColorStop(0.5, "#5c2e0b");
            lidGrad.addColorStop(1, "#2a1204");
          } else if (tier === "gilded") {
            lidGrad.addColorStop(0, "#9e1b32");
            lidGrad.addColorStop(0.5, "#800020");
            lidGrad.addColorStop(1, "#4a0404");
          } else {
            lidGrad.addColorStop(0, "#312e81");
            lidGrad.addColorStop(0.5, "#1e1b4b");
            lidGrad.addColorStop(1, "#09051d");
          }

          ctx.fillStyle = lidGrad;
          ctx.strokeStyle =
            tier === "iron_bound"
              ? "#100903"
              : tier === "gilded"
                ? "#200101"
                : "#a855f7";
          ctx.lineWidth = 1.5;

          ctx.beginPath();
          ctx.moveTo(-w / 2, 0);
          ctx.quadraticCurveTo(0, -lidH - 2, w / 2, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Highlight
          ctx.strokeStyle =
            tier === "astral"
              ? "rgba(0, 255, 255, 0.35)"
              : "rgba(255, 255, 255, 0.15)";
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(-w / 2 + 3, -2);
          ctx.quadraticCurveTo(0, -lidH + 1, w / 2 - 3, -2);
          ctx.stroke();

          // Bandings clipped to closed lid arch
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(-w / 2, 0);
          ctx.quadraticCurveTo(0, -lidH - 2, w / 2, 0);
          ctx.closePath();
          ctx.clip();

          ctx.fillStyle =
            tier === "iron_bound"
              ? "#334155"
              : tier === "gilded"
                ? "#ffd700"
                : "#00ffff";
          ctx.strokeStyle =
            tier === "iron_bound"
              ? "#0f172a"
              : tier === "gilded"
                ? "#855800"
                : "#ffffff";
          ctx.lineWidth = 0.8;
          ctx.fillRect(-w / 2 + 3, -lidH - 2, 3.5, lidH + 2);
          ctx.strokeRect(-w / 2 + 3, -lidH - 2, 3.5, lidH + 2);
          ctx.fillRect(w / 2 - 6.5, -lidH - 2, 3.5, lidH + 2);
          ctx.strokeRect(w / 2 - 6.5, -lidH - 2, 3.5, lidH + 2);
          ctx.restore();

          // Dividing Seam
          ctx.strokeStyle =
            tier === "iron_bound"
              ? "#100903"
              : tier === "gilded"
                ? "#855800"
                : "#a855f7";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-w / 2, 0);
          ctx.lineTo(w / 2, 0);
          ctx.stroke();

          // Lock hardware
          let lockW = 6;
          let lockH = 7;
          let lockX = -lockW / 2;
          let lockY = -3;

          let lockGrad = ctx.createLinearGradient(
            lockX,
            lockY,
            lockX,
            lockY + lockH,
          );
          if (tier === "iron_bound") {
            lockGrad.addColorStop(0, "#64748b");
            lockGrad.addColorStop(1, "#334155");
            ctx.strokeStyle = "#0f172a";
          } else if (tier === "gilded") {
            lockGrad.addColorStop(0, "#ffe57f");
            lockGrad.addColorStop(1, "#ffc107");
            ctx.strokeStyle = "#855800";
          } else {
            lockGrad.addColorStop(0, "#ffffff");
            lockGrad.addColorStop(0.5, "#00ffff");
            lockGrad.addColorStop(1, "#008b8b");
            ctx.strokeStyle = "#008b8b";
          }

          ctx.fillStyle = lockGrad;
          ctx.lineWidth = 1.0;
          ctx.fillRect(lockX, lockY, lockW, lockH);
          ctx.strokeRect(lockX, lockY, lockW, lockH);

          // Lock keyhole core / gem
          if (tier === "gilded") {
            ctx.fillStyle = "#e74c3c"; // Ruby core gem
            ctx.beginPath();
            ctx.arc(0, lockY + 2.5, 1.2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = "#100903";
            ctx.beginPath();
            ctx.arc(0, lockY + 2.5, 1.0, 0, Math.PI * 2);
            ctx.fill();
            if (tier === "iron_bound") {
              ctx.fillRect(-0.5, lockY + 2.5, 1.0, 2.5);
            }
          }

          ctx.restore();
        }

        // ==========================================
        // Rising Glow Sparks (Drawn closed only)
        // ==========================================
        if (!isOpen && P < 0.99) {
          let numSparks = tier === "iron_bound" ? 3 : tier === "gilded" ? 3 : 4;
          for (let i = 0; i < numSparks; i++) {
            let sparkProgress =
              (time /
                (tier === "iron_bound"
                  ? 800 + i * 200
                  : tier === "gilded"
                    ? 600 + i * 200
                    : 500 + i * 150) +
                i * (tier === "astral" ? 0.25 : 0.33)) %
              1.0;
            let sx =
              cx +
              Math.sin(time / 150 + i * 2.5) * (tier === "astral" ? 11 : 8);
            let sy = cy - sparkProgress * (tier === "astral" ? 20 : 15);
            let alpha = (1.0 - sparkProgress) * 0.8 * (1.0 - P); // fade out sparks as lid lifts

            if (tier === "iron_bound") {
              ctx.fillStyle = `rgba(230, 126, 34, ${alpha})`;
            } else if (tier === "gilded") {
              ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
            } else {
              ctx.fillStyle =
                i % 2 === 0
                  ? `rgba(0, 255, 255, ${alpha})`
                  : `rgba(168, 85, 247, ${alpha})`;
            }

            ctx.beginPath();
            ctx.arc(sx, sy, 1.0, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.restore();
}
