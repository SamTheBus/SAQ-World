import {asCombatAmount} from '../shared/contracts/combat_amount.js';
// Verbatim recovered from the user's complete playable HTML file (October 23 2026).
// Origin: Marcus-the-Outlaw-PLAYABLE.html

  var ID = "marcus_the_outlaw";
  var TAU = Math.PI * 2;
  var INK = "#11151a";
  var CLOTH = "#261a36";
  var FOLD = "#493253";
  var SHADOW = "#160f25";
  var DEEP = "#090711";
  var GOLD = "#edbf43";
  var LIGHT = "#ffe094";
  var PALE = "#fff1c3";
  var BRASS = "#b07729";
  var RED = "#f05b4b";
  var VIOLET = "#b17be1";
  var MOLTEN = "#ee762b";
  var clamp = (x) => Math.max(0, Math.min(1, x));
  var ease = (x) => {
    x = clamp(x);
    return x * x * (3 - 2 * x);
  };
  var mix = (a, b, p) => a + (b - a) * p;
  var point2 = (x, y) => ({ x, y });
  var unit = (x, y) => {
    const d = Math.hypot(x, y) || 1;
    return point2(x / d, y / d);
  };
  var rotate = (x, y, a) => point2(Math.cos(a) * x - Math.sin(a) * y, Math.sin(a) * x + Math.cos(a) * y);
  var progress = (row, tick) => clamp((tick - row.startedTick) / Math.max(1, row.resolvesTick - row.startedTick));
  function hash(value) {
    let n = 2166136261;
    for (const ch of String(value)) n = Math.imul(n ^ ch.charCodeAt(0), 16777619);
    return n >>> 0;
  }
  function fraction(value, max) {
    const a = asCombatAmount(value ?? 0), b = asCombatAmount(max ?? 1);
    if (a.n === "0" || b.n === "0") return 0;
    const head3 = (s) => Number(s.slice(0, 15)), exp = (s) => s.length - Math.min(15, s.length), p = exp(a.n) + exp(b.d) - exp(a.d) - exp(b.n);
    return clamp(head3(a.n) * head3(b.d) / (head3(a.d) * head3(b.n)) * 10 ** Math.max(-330, Math.min(330, p)));
  }
  function positive(value) {
    return asCombatAmount(value ?? 0).n !== "0";
  }
  function bounded(value, max) {
    const a = asCombatAmount(value ?? 0), n = BigInt(a.n) / BigInt(a.d);
    return Number(n > BigInt(max) ? BigInt(max) : n);
  }
  function path(c, points, close = false) {
    c.beginPath();
    for (const [i, p] of points.entries()) i ? c.lineTo(...p) : c.moveTo(...p);
    if (close) c.closePath();
  }
  function polygon(c, points, fill, outline = true, width = 1.26) {
    path(c, points, true);
    c.fillStyle = fill;
    c.fill();
    if (outline) {
      c.strokeStyle = INK;
      c.lineWidth = width;
      c.stroke();
    }
  }
  function line(c, points, stroke, width = 1) {
    path(c, points);
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
  function ellipse(c, x, y, rx, ry, fill, outline = false, width = 1.26) {
    c.beginPath();
    c.ellipse(x, y, Math.max(1e-3, rx), Math.max(1e-3, ry), 0, 0, TAU);
    c.fillStyle = fill;
    c.fill();
    if (outline) {
      c.strokeStyle = INK;
      c.lineWidth = width;
      c.stroke();
    }
  }
  function ring(c, x, y, r, stroke, width = 1) {
    c.beginPath();
    c.arc(x, y, Math.max(1e-3, r), 0, TAU);
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
  function glow(c, x, y, r, color8) {
    const g = c.createRadialGradient(x, y, 0.1, x, y, r);
    g.addColorStop(0, color8);
    g.addColorStop(1, "#00000000");
    ellipse(c, x, y, r, r, g);
  }
  function coin(c, x, y, r = 3.7, angle2 = 0, flat = 0.69, flash = false) {
    c.save();
    c.translate(x, y);
    c.rotate(angle2);
    ellipse(c, 0, 0.8, r, r * flat, flash ? "#fff" : BRASS, true, 1);
    ellipse(c, -0.25, -0.4, r * 0.87, r * flat * 0.87, flash ? "#fff" : GOLD);
    if (!flash) {
      ellipse(c, -r * 0.22, -r * flat * 0.25, r * 0.5, r * flat * 0.31, LIGHT);
      c.beginPath();
      c.ellipse(-0.25, -0.4, r * 0.6, r * flat * 0.59, 0, 0, TAU);
      c.strokeStyle = "#a06a29";
      c.lineWidth = 0.55;
      c.stroke();
      line(c, [[-r * 0.3, -r * flat * 0.5], [r * 0.1, -r * flat * 0.5]], PALE, 0.7);
    }
    c.restore();
  }
  function marcusAttackPose(actor2, tick) {
    const b = actor2.boss ?? {}, alive = actor2.alive !== false, pending = alive ? b.pendingAction : null, last = alive ? b.lastAction : null, age = last ? tick - last.resolvedTick : Infinity, recent = age >= 0 && age < 40 ? last : null, record2 = pending ?? recent, p = pending ? progress(pending, tick) : 0;
    const origin = record2?.originPosition ?? actor2.position, aim2 = record2?.targetPosition ?? point2(actor2.position.x + Math.cos(b.facingAngle ?? Math.PI / 2) * 60, actor2.position.y + Math.sin(b.facingAngle ?? Math.PI / 2) * 60), d = unit(aim2.x - origin.x, aim2.y - origin.y), seed = Number.isFinite(actor2.visualSeed) ? actor2.visualSeed : hash(actor2.entityId ?? ID) % 997;
    const hover = Math.sin((tick + seed * 0.17) / 9) * 3.4, walk = actor2.movedLastTick ? 1 : 0;
    const pose = { ability: record2?.ability ?? null, p, age, direction: d, aim: aim2, bodyX: 0, bodyY: -9 + hover, rotation: Math.sin((tick + seed) / 41) * 0.018, scaleX: 1, scaleY: 1, gather: 0, charge: 0, release: 0, slack: 0, headDrop: 0, orbitRadius: 45, orbitTilt: Math.sin(tick / 58) * 0.17, orbitPhase: tick * 0.014, walk };
    pose.rotation += Math.sin(tick * 0.25) * 0.022 * walk;
    const shield = b.moltenShield, sa = shield?.resolvedTick == null ? Infinity : tick - shield.resolvedTick, owns = alive && shield && (shield.outcome === "channeling" || b.actionState === "dazed" || ["completed", "broken"].includes(shield.outcome) && sa >= 0 && sa < 36);
    if (owns) {
      const held = ease(((shield.outcome === "channeling" ? tick : shield.resolvedTick) - shield.startedTick) / 14), weight = held * (shield.outcome === "channeling" ? 1 : 1 - ease(sa / 30));
      pose.bodyY -= 5 * weight;
      pose.gather = 0.8 * weight;
      pose.charge = 0.9 * weight;
      pose.orbitRadius -= 11 * weight;
      if (b.actionState === "dazed") {
        const elapsed = tick - (b.dazeStartedTick ?? tick), remaining = (b.dazeEndsTick ?? tick + 210) - tick;
        pose.slack = ease(elapsed / 16) * (1 - ease((18 - remaining) / 18));
        pose.bodyY += 10 * pose.slack;
        pose.rotation += 0.16 * pose.slack + Math.sin(elapsed * 0.19) * 0.02 * pose.slack;
        pose.headDrop = 4 * pose.slack;
        pose.orbitTilt += 0.28 * pose.slack;
      }
      const entry = (1 - ease((Math.min(tick, shield.resolvedTick ?? tick) - shield.startedTick) / 12)) * (shield.outcome === "channeling" ? 1 : 1 - ease(sa / 18));
      if (entry > 0 && last && shield.startedTick - last.resolvedTick >= 0 && shield.startedTick - last.resolvedTick < 40) {
        const prior = marcusAttackPose({ ...actor2, position: shield.originPosition, boss: { ...b, moltenShield: null, pendingAction: null, actionState: "idle" } }, shield.startedTick), idle = -9 + Math.sin((shield.startedTick + seed * 0.17) / 9) * 3.4;
        pose.bodyX += prior.bodyX * entry;
        pose.bodyY += (prior.bodyY - idle) * entry;
      }
      pose.ability = b.actionState === "dazed" ? "dazed" : "molten_shield";
      pose.p = progress(shield, tick);
      pose.age = sa;
      return pose;
    }
    if (pending?.ability === "lasso") {
      const coil = ease(p / 0.7), drive = ease((p - 0.8) / 0.2);
      pose.bodyX = d.x * (-3 * coil + 4 * drive);
      pose.bodyY += -3 * coil + d.y * 2 * drive;
      pose.rotation += d.x * (-0.07 * coil + 0.11 * drive);
      pose.gather = coil;
      pose.charge = coil;
      pose.orbitRadius -= 12 * coil;
    } else if (recent?.ability === "lasso") {
      const w = 1 - ease(age / 30);
      pose.bodyX = d.x * w;
      pose.bodyY += (-3 + d.y * 2) * w;
      pose.rotation += d.x * 0.04 * w;
      pose.gather = w;
      pose.charge = w;
      pose.orbitRadius -= 12 * w;
      pose.release = 1 - ease(age / 12);
    } else if (pending?.ability === "barrage" || recent?.ability === "barrage") {
      const w = pending ? ease(p / 0.78) : 1 - ease(age / 32);
      pose.bodyY -= 5 * w;
      pose.gather = -0.5 * w;
      pose.charge = w;
      pose.orbitRadius -= 8 * w;
      if (!pending) pose.release = 1 - ease(age / 12);
    } else if (pending?.ability === "inversion" || recent?.ability === "inversion") {
      const w = pending ? ease(p / 0.82) : 1 - ease(age / 32), turn4 = pending ? p * p : 1 - ease(age / 32);
      pose.bodyY -= 4 * w;
      pose.charge = w;
      pose.gather = 0.4 * w;
      pose.orbitPhase += TAU * turn4;
      pose.orbitTilt -= 0.2 * w;
      if (!pending) pose.release = 1 - ease(age / 16);
    } else if (pending?.ability === "gold_rush_dash" || recent?.ability === "gold_rush_dash") {
      const w = pending ? ease(p / 0.82) : 1 - ease(age / 27);
      pose.bodyX -= d.x * 4 * w;
      pose.bodyY -= 5 * w;
      pose.rotation -= d.x * 0.12 * w;
      pose.scaleX -= 0.045 * w;
      pose.scaleY += 0.025 * w;
      pose.gather = w;
      pose.charge = w;
      if (!pending) pose.release = 1 - ease(age / 14);
    } else if (recent?.ability === "strike" && age < 24) {
      const w = 1 - ease(age / 24);
      pose.bodyX = d.x * 5 * w;
      pose.bodyY += d.y * 3 * w;
      pose.rotation += d.x * 0.11 * w;
      pose.gather = 0.4 * w;
      pose.charge = 0.5 * w;
      pose.release = 0.5 * w;
    }
    return pose;
  }
  function bodyOffset(pose, x, y) {
    const p = rotate(x * pose.scaleX, y * pose.scaleY, pose.rotation);
    return point2(p.x + pose.bodyX, p.y + pose.bodyY);
  }
  function coinFormation(actor2, pose, tick) {
    const b = actor2.boss ?? {}, pending = actor2.alive !== false && b.pendingAction?.ability === "barrage" ? b.pendingAction : null, last = b.lastAction;
    const releaseAge = last?.ability === "barrage" ? tick - last.resolvedTick : Infinity, refilling = !pending && releaseAge >= 0 && releaseAge < 60;
    const q = pending ? progress(pending, tick) : 0, align = ease(q / 0.78), settle = ease((q - 0.3) / 0.64), phase = pending ? ((pending.startedTick * 0.014 + Math.PI) % TAU + TAU) % TAU - Math.PI : pose.orbitPhase;
    const coins = [];
    for (let i = 0; i < 8; i++) {
      const heading = i * TAU / 8, a = heading + (pending ? (phase + 0.014 * (tick - pending.startedTick) * (1 - align)) * (1 - align) : phase), depth = Math.sin(a), bob = Math.sin(tick * 0.085 + i * 0.83) * 1.6 * (1 - align);
      const base = bodyOffset(pose, Math.cos(a) * pose.orbitRadius, 2 + depth * 13 + Math.cos(a) * pose.orbitRadius * pose.orbitTilt + bob + pose.slack * 5);
      const row = { index: i, x: base.x, y: base.y, depth, r: 4.8, angle: 0.18 * Math.sin(tick * 0.045 + i * 0.9) + pose.rotation, flat: 0.7 + 0.23 * Math.abs(Math.cos(tick * 0.028 + i * 0.83)), alpha: 1 };
      if (pending) {
        const origin = pending.originPosition ?? actor2.position, target = point2(origin.x - actor2.position.x + Math.cos(heading) * 12, origin.y - actor2.position.y + Math.sin(heading) * 12 - 5);
        row.x = mix(row.x, target.x, settle);
        row.y = mix(row.y, target.y, settle);
        row.depth = mix(depth, Math.sin(heading), settle);
        row.r = mix(row.r, 4.5, settle);
        row.angle = mix(row.angle, heading, align);
        row.flat = mix(row.flat, 0.44 + 0.38 * Math.abs(Math.cos(i)), settle);
      } else if (refilling) {
        const age = releaseAge - 24 - i * 3, u = ease(age / 15);
        if (age <= 0) continue;
        const from = bodyOffset(pose, 0, -24);
        row.x = mix(from.x, row.x, u);
        row.y = mix(from.y, row.y, u) - Math.sin(Math.PI * u) * (6 + i % 3);
        row.depth = mix(1, depth, ease((u - 0.35) / 0.65));
        row.r *= 0.25 + 0.75 * u;
        row.alpha = ease(age / 9);
      }
      coins.push(row);
    }
    return coins.sort((a, b2) => a.depth - b2.depth);
  }
  function floatingCoins(c, coins, front2, flash) {
    for (const row of coins) {
      if (row.depth >= -1e-8 !== front2) continue;
      c.save();
      c.globalAlpha *= row.alpha;
      coin(c, row.x, row.y, row.r, row.angle, row.flat, flash);
      c.restore();
    }
  }
  function cloak(c, pose, flash) {
    const fill = (x) => flash ? "#fff" : x, squeeze = pose.gather * 1.4;
    c.beginPath();
    c.moveTo(-27 + squeeze, 7);
    c.quadraticCurveTo(-24, -4, -14, -7);
    c.quadraticCurveTo(-6, -7, 0, -2);
    c.quadraticCurveTo(11, -12, 20, -6);
    c.quadraticCurveTo(25, -1, 27 - squeeze, 7);
    c.quadraticCurveTo(14, 12, 0, 8);
    c.quadraticCurveTo(-15, 12, -27 + squeeze, 7);
    c.closePath();
    c.fillStyle = fill(CLOTH);
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 1.26;
    c.stroke();
    if (!flash) {
      c.save();
      c.clip();
      polygon(c, [[-29, 1], [-12, -4], [8, 4], [-1, 8], [-22, 8]], FOLD, false);
      polygon(c, [[2, -4], [17, -7], [27, 4], [15, 9], [7, 3]], "#35243f", false);
      polygon(c, [[-14, 7], [2, 2], [18, 7], [12, 11], [-7, 11]], SHADOW, false);
      c.restore();
      line(c, [[-16, -2], [-1, 5], [13, 1]], "#110d1e", 0.8);
    }
    c.beginPath();
    c.moveTo(-16, 1);
    c.quadraticCurveTo(-21, -12, -14, -26);
    c.lineTo(-7, -30);
    c.lineTo(8, -30);
    c.quadraticCurveTo(17, -26, 18, -15);
    c.lineTo(15, 2);
    c.quadraticCurveTo(3, 8, -16, 1);
    c.closePath();
    c.fillStyle = fill(SHADOW);
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 1.26;
    c.stroke();
    if (!flash) {
      c.save();
      c.clip();
      polygon(c, [[-13, -27], [-3, -24], [-4, -3], [-15, 2], [-18, -9]], FOLD, false);
      polygon(c, [[-5, -23], [2, -24], [8, 5], [-3, 3]], "#32213e", false);
      polygon(c, [[9, -28], [18, -18], [15, 5], [8, 2]], DEEP, false);
      c.restore();
      line(c, [[-12, -19], [-15, -11], [-12, -5]], "#21162f", 0.75);
      line(c, [[7, -21], [10, -10], [8, -2]], "#4d3455", 0.65);
    }
    if (!flash && pose.charge > 0) glow(c, 0, -24, 9 + pose.charge * 3, `rgba(245,184,58,${0.17 + pose.charge * 0.22})`);
    ellipse(c, 0, -24, 3.3, 3.5, fill(GOLD), true);
    if (!flash) {
      polygon(c, [[-1.8, -25.4], [0.1, -27], [1.4, -24.5], [0, -23]], PALE, false);
      ellipse(c, 0.4, -23.2, 1.1, 1.2, BRASS);
    }
    c.save();
    c.translate(0, pose.headDrop);
    c.rotate(-pose.slack * 0.06);
    c.beginPath();
    c.moveTo(-10, -28);
    c.quadraticCurveTo(-16, -40, -7, -47);
    c.quadraticCurveTo(1, -53, 10, -45);
    c.quadraticCurveTo(16, -37, 10, -28);
    c.quadraticCurveTo(0, -24, -10, -28);
    c.closePath();
    c.fillStyle = fill(CLOTH);
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 1.26;
    c.stroke();
    if (!flash) {
      c.save();
      c.clip();
      c.beginPath();
      c.moveTo(-12, -41);
      c.quadraticCurveTo(-4, -52, 4, -48);
      c.lineTo(-1, -41);
      c.lineTo(-7, -28);
      c.lineTo(-12, -32);
      c.closePath();
      c.fillStyle = FOLD;
      c.fill();
      polygon(c, [[7, -47], [14, -38], [11, -27], [4, -28], [6, -37]], SHADOW, false);
      c.restore();
    }
    ellipse(c, 0, -37, 6.7, 8.3, flash ? "#fff" : DEEP, true, 0.9);
    if (!flash) {
      const heat = 0.76 + 0.15 * Math.sin(pose.orbitPhase * 4) + pose.charge * 0.16, look = pose.direction;
      glow(c, 0, -37, 7, `rgba(240,72,61,${0.12 + pose.charge * 0.1})`);
      for (const s of [-1, 1]) {
        ellipse(c, s * 2.8 + look.x * 0.55, -37 + look.y * 0.35, 1.45, 1.25, `rgba(249,85,64,${Math.min(1, heat)})`);
        ellipse(c, s * 2.8 + look.x * 0.55 - 0.25, -37.35 + look.y * 0.35, 0.5, 0.4, "#ffc788");
      }
    }
    c.restore();
  }
  function drawMarcusTheOutlaw(c, actor2, tick, flash = false) {
    if (actor2.boss?.bossDefinitionId !== ID) return false;
    const pose = marcusAttackPose(actor2, tick), death = actor2.alive === false ? ease((actor2.deathAge ?? 0) / 38) : 0, coins = coinFormation(actor2, pose, tick);
    c.save();
    c.translate(actor2.position.x, actor2.position.y);
    c.lineCap = "round";
    c.lineJoin = "round";
    c.globalAlpha *= 1 - death;
    ellipse(c, 0, 6, 24, 5.6, "#07081166");
    floatingCoins(c, coins, false, flash);
    c.save();
    c.translate(pose.bodyX, pose.bodyY + death * 12);
    c.rotate(pose.rotation + death * 0.22);
    c.scale(pose.scaleX, pose.scaleY);
    cloak(c, pose, flash);
    c.restore();
    floatingCoins(c, coins, true, flash);
    c.restore();
    return true;
  }
  function warning(c, p, r, q, color8 = GOLD) {
    ellipse(c, p.x, p.y, r, r, color8 === VIOLET ? "#9f64d20b" : "#e3b5430b");
    ring(c, p.x, p.y, r, INK, 2.5);
    ring(c, p.x, p.y, r, color8, 1.05);
    c.beginPath();
    c.arc(p.x, p.y, r - 3, -Math.PI / 2, -Math.PI / 2 + TAU * q);
    c.strokeStyle = color8 === VIOLET ? "#e4bdff" : PALE;
    c.lineWidth = 1.3;
    c.stroke();
  }
  function reversalMarks(c, p, r, turn4, alpha = 1) {
    c.save();
    c.translate(p.x, p.y);
    c.rotate(turn4);
    c.globalAlpha *= alpha;
    for (let i = 0; i < 4; i++) {
      c.save();
      c.rotate(i * TAU / 4);
      line(c, [[r - 7, -4], [r - 1, -4], [r - 1, 3]], VIOLET, 1.05);
      polygon(c, [[r - 4, 1], [r - 1, 6], [r + 2, 1]], "#ddafff", false);
      c.restore();
    }
    c.restore();
  }
  function slag(c, row, tick) {
    const age = tick - row.createdTick, life = Math.max(1, row.expiresTick - row.createdTick);
    if (age < 0 || tick > row.expiresTick) return;
    const r = row.radius ?? 12, fade = 1 - 0.75 * ease((age / life - 0.72) / 0.28), splash = ease(age / 6);
    c.save();
    c.translate(row.position.x, row.position.y);
    c.globalAlpha *= fade;
    c.beginPath();
    for (let i = 0; i < 20; i++) {
      const a = i * TAU / 20, rr = r * (0.91 + 0.05 * Math.sin(i * 2.3 + hash(row.id) % 11));
      i ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    c.closePath();
    c.fillStyle = "#4b261d";
    c.fill();
    c.strokeStyle = "#e49b3c";
    c.lineWidth = 0.65;
    c.stroke();
    c.save();
    c.clip();
    ellipse(c, -1, -1, r * 0.82, r * 0.65, "#dc641e");
    ellipse(c, -3, -3, r * 0.55, r * 0.35, "#f4ad3e");
    polygon(c, [[-r, -1], [-3, 1], [2, 5], [r, 3], [r, r], [-r, r]], "#74351f", false);
    line(c, [[-7, -4], [-2, -6], [4, -4]], "#ffd886", 0.75);
    c.restore();
    if (age < 9) {
      c.globalAlpha *= 1 - ease(age / 9);
      ring(c, 0, 0, r * (0.6 + 0.4 * splash), LIGHT, 0.9);
    }
    c.restore();
  }
  function drawMarcusGround(c, model2, tick) {
    const h = model2.bossHazards ?? {};
    c.save();
    for (const row of h.marcusSlagPools ?? []) slag(c, row, tick);
    for (const row of h.marcusTelegraphs ?? []) {
      if (tick < row.startedTick || tick > row.resolvesTick) continue;
      const q = progress(row, tick), p = row.position ?? row.targetPosition;
      if (row.ability === "lasso") warning(c, p, 48, q);
      else if (row.ability === "inversion") {
        warning(c, p, 120, q, VIOLET);
        reversalMarks(c, p, 104, -TAU * ease(q) * 0.5, 0.35 + 0.65 * q);
      } else if (row.ability === "gold_rush_dash") {
        const nodes = row.dashNodes ?? [];
        line(c, [[row.originPosition.x, row.originPosition.y], ...nodes.map((n) => [n.x, n.y])], "#dba95166", 0.8);
        for (const n of nodes) warning(c, n, 42, q, MOLTEN);
      } else if (row.ability === "barrage") {
        for (let i = 0; i < 8; i++) {
          const a = i * TAU / 8;
          line(c, [[p.x + Math.cos(a) * 22, p.y + Math.sin(a) * 22], [p.x + Math.cos(a) * (27 + q * 6), p.y + Math.sin(a) * (27 + q * 6)]], GOLD, 0.8);
        }
      }
    }
    for (const row of h.marcusImpacts ?? []) {
      const age = tick - row.resolvedTick;
      if (age < 0 || age >= 36) continue;
      const p = row.originPosition;
      if (row.ability === "inversion") {
        c.save();
        c.globalAlpha *= 1 - ease(age / 36);
        ellipse(c, p.x, p.y, 120, 120, "#9d58d418");
        ring(c, p.x, p.y, 120, VIOLET, 1.15);
        ring(c, p.x, p.y, 12 + 108 * ease(age / 14), "#e6baff", 1.3);
        reversalMarks(c, p, 104, -Math.PI - age * 0.035, 0.7);
        c.restore();
      } else if (row.ability === "barrage" && age < 12) {
        c.save();
        c.globalAlpha *= 1 - ease(age / 12);
        ring(c, p.x, p.y, 12 + 14 * ease(age / 12), LIGHT, 0.85);
        c.restore();
      }
    }
    for (const row of h.marcusMoltenShields ?? []) {
      const age = tick - row.startedTick;
      if (age < 0 || age >= 22) continue;
      c.save();
      c.globalAlpha *= 1 - ease(age / 22);
      ring(c, row.position.x, row.position.y, 12 + 24 * ease(age / 22), MOLTEN, 1.2);
      if (Math.hypot(row.originPosition.x - row.position.x, row.originPosition.y - row.position.y) > 1) {
        ring(c, row.originPosition.x, row.originPosition.y, 27 * (1 - ease(age / 22)) + 3, GOLD, 1);
      }
      c.restore();
    }
    for (const row of h.marcusGoldDrops ?? []) payoutGround(c, row, tick);
    c.restore();
  }
  function caster(row, model2, tick) {
    const actor2 = model2.entitiesById?.[row.sourceEntityId], p = actor2?.position ?? row.currentPosition ?? row.sourcePosition ?? row.originPosition, pose = actor2 ? marcusAttackPose(actor2, tick) : { bodyX: 0, bodyY: -9, rotation: 0 }, offset = rotate(0, -24, pose.rotation);
    return { actor: actor2, p, pose, clasp: point2(p.x + pose.bodyX + offset.x, p.y + pose.bodyY + offset.y) };
  }
  function rope(c, from, to, bend = 0, alpha = 1) {
    const d = unit(to.x - from.x, to.y - from.y), control = point2((from.x + to.x) / 2 - d.y * bend, (from.y + to.y) / 2 + d.x * bend);
    c.save();
    c.globalAlpha *= alpha;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(from.x, from.y);
    c.quadraticCurveTo(control.x, control.y, to.x, to.y);
    c.strokeStyle = INK;
    c.lineWidth = 3.1;
    c.stroke();
    c.strokeStyle = GOLD;
    c.lineWidth = 1.7;
    c.stroke();
    c.strokeStyle = PALE;
    c.lineWidth = 0.48;
    c.stroke();
    c.restore();
  }
  function ropeLoop(c, p, rx, ry, angle2 = 0, alpha = 1) {
    c.save();
    c.translate(p.x, p.y);
    c.rotate(angle2);
    c.globalAlpha *= alpha;
    c.beginPath();
    c.ellipse(0, 0, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU);
    c.strokeStyle = INK;
    c.lineWidth = 2.9;
    c.stroke();
    c.strokeStyle = GOLD;
    c.lineWidth = 1.5;
    c.stroke();
    c.strokeStyle = PALE;
    c.lineWidth = 0.42;
    c.stroke();
    c.restore();
  }
  function lasso(c, row, tick, model2, pending) {
    const { clasp } = caster(row, model2, tick), age = pending ? 0 : tick - row.resolvedTick, q = pending ? progress(row, tick) : 1;
    if (!pending && (age < 0 || age >= 24)) return;
    const hit = row.hitRecords?.[0], target = hit ? model2.entitiesById?.[hit.targetEntityId]?.position ?? hit.position : row.targetPosition;
    c.save();
    if (pending) {
      const cast = ease((q - 0.57) / 0.43), coil = ease(q / 0.45), end = point2(mix(clasp.x, row.targetPosition.x, cast), mix(clasp.y, row.targetPosition.y - 6, cast) - Math.sin(Math.PI * cast) * 26);
      rope(c, clasp, end, Math.sin(Math.PI * cast) * 15, 0.35 + 0.65 * coil);
      ropeLoop(c, end, mix(7, 19, cast) * coil, mix(3, 9, cast) * coil, -0.22 + q * TAU, coil);
    } else if (hit && age < 15) {
      const to = point2(target.x, target.y - 6), tight = ease(age / 5);
      rope(c, clasp, point2(to.x - 5, to.y), 5 * (1 - tight), 1 - ease((age - 9) / 6));
      ropeLoop(c, to, 13 - 2 * tight, 5, -0.07, 1 - ease((age - 10) / 5));
      if (age < 6) {
        c.globalAlpha *= 1 - ease(age / 6);
        for (let i = 0; i < 4; i++) {
          const a = i * TAU / 4;
          line(c, [[to.x + Math.cos(a) * 13, to.y + Math.sin(a) * 7], [to.x + Math.cos(a) * 18, to.y + Math.sin(a) * 11]], PALE, 1);
        }
      }
    } else if (!hit) {
      const fade = 1 - ease(age / 24), reel = ease(age / 24), to = point2(mix(row.targetPosition.x, clasp.x, reel), mix(row.targetPosition.y - 6, clasp.y, reel) + Math.sin(Math.PI * reel) * 10);
      rope(c, clasp, to, 16 * Math.sin(Math.PI * reel), fade);
      ropeLoop(c, to, 19 * (1 - reel) + 2, 9 * (1 - reel) + 1, reel * 0.8, fade);
    }
    c.restore();
  }
  function projectile(c, row, tick) {
    const age = tick - row.createdTick, p = row.position, prev = row.previousPosition ?? p, angle2 = Math.atan2(row.velocity.y, row.velocity.x), bounce = row.lastBounce, ba = bounce ? tick - bounce.tick : Infinity;
    c.save();
    if (ba === 0) {
      line(c, [[prev.x, prev.y - 5], [bounce.position.x, bounce.position.y - 5], [p.x, p.y - 5]], "#e4b24788", 1.05);
    } else line(c, [[prev.x, prev.y - 5], [p.x, p.y - 5]], "#e4b24788", 1.05);
    coin(c, p.x, p.y - 5, row.radius ?? 4.5, angle2 + age * 0.26, 0.44 + 0.38 * Math.abs(Math.cos(age * 0.45 + row.index)));
    if (ba >= 0 && ba < 8) {
      c.save();
      c.globalAlpha *= 1 - ease(ba / 8);
      for (let i = -1; i <= 1; i++) {
        const a = Math.atan2(bounce.normal.y, bounce.normal.x) + i * 0.65, r = 3 + ba * 0.8;
        line(c, [[bounce.position.x + Math.cos(a) * r, bounce.position.y - 5 + Math.sin(a) * r], [bounce.position.x + Math.cos(a) * (r + 3), bounce.position.y - 5 + Math.sin(a) * (r + 3)]], PALE, 0.9);
      }
      c.restore();
    }
    c.restore();
  }
  function dashEcho(c, row, tick) {
    const age = tick - row.resolvedTick;
    if (age < 0 || age >= 22) return;
    const nodes = [row.originPosition, ...row.targets ?? []], fade = 1 - ease(age / 22);
    c.save();
    for (let i = 0; i < nodes.length - 1; i++) {
      const p = nodes[i], to = nodes[i + 1];
      if (Math.hypot(to.x - p.x, to.y - p.y) < 0.5) continue;
      c.save();
      c.globalAlpha *= fade * (0.24 + i * 0.025);
      c.translate(p.x, p.y - 9);
      polygon(c, [[-25, 7], [-16, -4], [-14, -27], [-9, -30], [-10, -43], [0, -50], [11, -42], [9, -29], [16, -25], [17, -3], [25, 7], [0, 10]], "#d7a254", false);
      c.restore();
      c.save();
      c.globalAlpha *= fade * 0.55;
      for (let j = 1; j <= 6; j++) {
        const q = j / 7, x = mix(p.x, to.x, q), y = mix(p.y, to.y, q) - 5;
        line(c, [[x - 2, y], [x + 2, y]], j % 2 ? GOLD : MOLTEN, 0.9);
      }
      c.restore();
    }
    c.restore();
  }
  function status(c, row, tick, kind) {
    if (tick < row.appliedTick || tick > row.expiresTick) return;
    const p = row.position, fade = 1 - ease((tick - (row.expiresTick - 18)) / 18);
    c.save();
    c.globalAlpha *= fade;
    if (kind === "snare") {
      ropeLoop(c, point2(p.x, p.y - 2), 12.5, 4.5, -0.08, 0.85);
      for (const s of [-1, 1]) ellipse(c, p.x + s * 9, p.y - 1, 1.3, 1.5, LIGHT, true, 0.6);
    } else {
      for (const s of [-1, 1]) {
        const x = p.x + s * 16, y = p.y - 5 + Math.sin((tick - row.appliedTick) * 0.1) * 1.4;
        line(c, [[x - s * 6, y], [x, y], [x - s * 3, y - 3], [x, y], [x - s * 3, y + 3]], "#d9a8ff", 0.95);
      }
    }
    c.restore();
  }
  function moltenWard(c, row, tick, model2) {
    const active = row.outcome === "channeling", age = row.resolvedTick == null ? 0 : tick - row.resolvedTick;
    if (!active && (age < 0 || age >= 36)) return;
    const { p, pose } = caster(row, model2, tick), ratio = fraction(row.shieldUnits, row.maxShieldUnits), entry = ease((tick - row.startedTick) / 14), cx = p.x + pose.bodyX, cy = p.y + pose.bodyY - 20, r = mix(27, 42, entry);
    c.save();
    c.translate(cx, cy);
    c.globalAlpha *= active ? 1 : 1 - ease(age / 36);
    if (active) {
      ring(c, 0, 0, r, "#f2a13b30", 0.8);
      for (let i = 0; i < 12; i++) {
        const health = clamp(ratio * 12 - i);
        if (!health) continue;
        const a = -Math.PI / 2 + i * TAU / 12 + 0.045, z = a + (TAU / 12 - 0.09) * health, points = [];
        for (let j = 0; j <= 4; j++) {
          const u = mix(a, z, j / 4);
          points.push([Math.cos(u) * (r + 1.5 * Math.sin(i * 2.1)), Math.sin(u) * (r + 1.5 * Math.sin(i * 2.1))]);
        }
        for (let j = 4; j >= 0; j--) {
          const u = mix(a, z, j / 4);
          points.push([Math.cos(u) * (r - 4), Math.sin(u) * (r - 4)]);
        }
        polygon(c, points, i % 3 ? MOLTEN : GOLD, true, 1);
        line(c, points.slice(0, 5), LIGHT, 0.65);
      }
      const ha = row.lastShieldHit ? tick - row.lastShieldHit.tick : Infinity;
      if (ha >= 0 && ha < 7) {
        c.save();
        c.globalAlpha *= 1 - ease(ha / 7);
        ring(c, 0, 0, r + 1, PALE, 1.7);
        c.restore();
      }
    } else if (row.outcome === "broken") {
      const prior = fraction(row.lastShieldHit?.absorbedUnits ?? row.maxShieldUnits, row.maxShieldUnits);
      for (let i = 0; i < 12; i++) {
        const a = -Math.PI / 2 + (i + 0.5) * TAU / 12, solid = clamp(prior * 12 - i), travel = age * (0.55 + i % 3 * 0.13);
        c.save();
        c.globalAlpha *= 0.18 + 0.82 * solid;
        c.translate(Math.cos(a) * (42 + travel), Math.sin(a) * (42 + travel) + age * age * 0.025);
        c.rotate(a + age * 0.035 * (i % 2 ? 1 : -1));
        polygon(c, [[-2, -8], [3, -6], [3, 5], [-1, 8]], i % 2 ? MOLTEN : GOLD, true, 0.8);
        c.restore();
      }
    } else {
      ring(c, 0, 0, 42 * (1 - ease(age / 30)) + 1, LIGHT, 1.2);
    }
    c.restore();
  }
  function siphon(c, row, tick, model2) {
    const last = row.lastSiphon, age = last ? tick - last.tick : Infinity;
    if (!last || age < 0 || age >= 15 || !row.targetPosition) return;
    const { clasp } = caster(row, model2, tick), from = point2(row.targetPosition.x, row.targetPosition.y - 12), to = clasp;
    c.save();
    for (const [kind, enabled, side] of [["gold", positive(last.goldAmount), -1], ["hp", positive(last.hpDrained), 1]]) {
      if (!enabled) continue;
      for (let i = 0; i < 4; i++) {
        const delay = i * 1.25, q = clamp((age - delay) / (14 - delay));
        if (age < delay || q >= 1) continue;
        const u = 1 - q, middle = point2((from.x + to.x) / 2 + side * 8, Math.min(from.y, to.y) - 14), x = u * u * from.x + 2 * u * q * middle.x + q * q * to.x, y = u * u * from.y + 2 * u * q * middle.y + q * q * to.y;
        c.save();
        c.globalAlpha *= Math.sin(Math.PI * q) * 0.95;
        if (kind === "gold") coin(c, x, y, 2.7, q * TAU, 0.64);
        else {
          ellipse(c, x, y, 2.2, 2.6, RED, true, 0.7);
          ellipse(c, x - 0.5, y - 0.7, 0.65, 0.75, "#ffc1a0");
        }
        c.restore();
      }
    }
    if (age < 8 && (positive(last.goldHealed) || positive(last.hpHealed))) {
      c.globalAlpha *= 1 - ease(age / 8);
      glow(c, to.x, to.y, 10, "#ffc87755");
    }
    c.restore();
  }
  function strike(c, row, tick, model2) {
    const age = tick - row.resolvedTick;
    if (age < 0 || age >= 12) return;
    const from = caster(row, model2, tick).clasp, to = point2(row.targetPosition.x, row.targetPosition.y - 10);
    c.save();
    c.globalAlpha *= 1 - ease(age / 12);
    rope(c, from, to, 9 * (1 - ease(age / 12)), 0.75);
    coin(c, to.x, to.y, 4.1, age * 0.18, 0.48);
    for (const s of [-1, 1]) line(c, [[to.x + s * 4, to.y - 3], [to.x + s * (8 + age * 0.2), to.y - 6]], PALE, 0.9);
    c.restore();
  }
  var PAYOUT_SLOTS = [[-6, 1], [1, 2], [7, 0], [-3, -2], [4, -3], [-8, -2], [8, -3], [-1, -5], [2, -6]];
  function payoutCount(row) {
    return Math.max(1, bounded(row.amount, 18));
  }
  function payoutSlot(i, count, seed) {
    if (i === count - 1 && count >= 6) return { x: -0.5, y: -8.5 - Math.floor(count / 9) * 0.6, r: 3.6, flat: 1.02, a: -0.13 };
    const p = PAYOUT_SLOTS[i % 9];
    return { x: p[0] + Math.sin(seed * 0.01 + i * 1.9) * 0.8, y: p[1] - Math.floor(i / 9) * 0.9, r: 3.3 + i % 3 * 0.22, flat: 0.47, a: Math.sin(i * 1.8 + seed * 0.03) * 0.13 };
  }
  function payoutOrigin(row) {
    return point2(row.originPosition.x, row.originPosition.y - (row.sourceActionState === "molten_shield" ? 38 : row.sourceActionState === "dazed" ? 29 : 33));
  }
  function payoutGround(c, row, tick) {
    if (!positive(row.amount) || tick < row.createdTick || row.collectedTick != null && tick >= row.collectedTick) return;
    const q = clamp((tick - row.createdTick) / Math.max(1, row.landsTick - row.createdTick)), p = point2(mix(row.originPosition.x, row.position.x, q), mix(row.originPosition.y, row.position.y, q));
    c.save();
    c.globalAlpha *= 0.25 + 0.75 * q;
    ellipse(c, p.x, p.y + 2, 10 + q * 3, 3 + q * 0.7, "#33200d52");
    if (tick >= row.landsTick) glow(c, row.position.x, row.position.y, 19, "#e7bb4424");
    c.restore();
  }
  function payout(c, row, tick) {
    if (!positive(row.amount) || tick < row.createdTick) return;
    const count = payoutCount(row), seed = hash(row.id), collected = row.collectedTick != null && tick >= row.collectedTick;
    c.save();
    if (collected) {
      const age = tick - row.collectedTick;
      if (age >= 30 || !row.collectionPosition) {
        c.restore();
        return;
      }
      const to = point2(row.collectionPosition.x, row.collectionPosition.y - 14);
      for (let i = 0; i < count; i++) {
        const s = payoutSlot(i, count, seed), delay = i % 6 * 1.1, q = clamp((age - delay) / (22 - delay)), u = 1 - q, from = point2(row.position.x + s.x, row.position.y + s.y), middle = point2(mix(from.x, to.x, 0.48), Math.min(from.y, to.y) - 17 - i % 3 * 3);
        if (q >= 1) continue;
        const x = u * u * from.x + 2 * u * q * middle.x + q * q * to.x, y = u * u * from.y + 2 * u * q * middle.y + q * q * to.y;
        c.save();
        c.globalAlpha *= 1 - ease((q - 0.82) / 0.18);
        coin(c, x, y, s.r * (1 - q * 0.27), s.a + q * TAU, s.flat);
        c.restore();
      }
      if (age >= 10) {
        const q = clamp((age - 10) / 20);
        c.save();
        c.globalAlpha *= 1 - ease(q);
        for (let i = 0; i < 4; i++) {
          const a2 = i * TAU / 4 + 0.35, r = 4 + 8 * ease(q);
          line(c, [[to.x + Math.cos(a2) * r, to.y + Math.sin(a2) * r], [to.x + Math.cos(a2) * (r + 3), to.y + Math.sin(a2) * (r + 3)]], PALE, 0.9);
        }
        const a = asCombatAmount(row.amount), digits = (BigInt(a.n) / BigInt(a.d)).toString(), label = digits.length <= 7 ? "+" + digits + " G" : "+ GOLD";
        c.font = "bold 8px sans-serif";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.strokeStyle = "#201a13";
        c.lineWidth = 2.3;
        c.strokeText(label, to.x, to.y - 13 - q * 7);
        c.fillStyle = PALE;
        c.fillText(label, to.x, to.y - 13 - q * 7);
        c.restore();
      }
    } else if (tick < row.landsTick) {
      const age = tick - row.createdTick, q = clamp(age / Math.max(1, row.landsTick - row.createdTick)), from = payoutOrigin(row), to = row.position, d = unit(to.x - row.originPosition.x, to.y - row.originPosition.y), n = point2(-d.y, d.x), arc = Math.sin(Math.PI * q), travel = 1 - Math.pow(1 - q, 1.18), coins = [];
      if (age < 6) {
        c.save();
        c.globalAlpha *= 1 - ease(age / 6);
        glow(c, from.x, from.y, 11, "#ffdc7959");
        c.restore();
      }
      for (let i = 0; i < count; i++) {
        const s = payoutSlot(i, count, seed), fan = count === 1 ? 0 : (i / (count - 1) - 0.5) * 31 * arc;
        coins.push({ x: mix(from.x, to.x + s.x, travel) + n.x * fan, y: mix(from.y, to.y + s.y, travel) + n.y * fan * 0.6 - arc * (10 + i % 5 * 4), s, i });
      }
      coins.sort((a, b) => a.y - b.y);
      for (const { x, y, s, i } of coins) coin(c, x, y, s.r, s.a + TAU * (1 - q) * (1 + i % 2), mix(0.26 + Math.abs(Math.cos(q * TAU * 1.4 + i)) * 0.53, s.flat, ease((q - 0.65) / 0.35)));
    } else {
      const age = tick - row.landsTick, bounce = age < 8 ? Math.sin(Math.PI * age / 8) * (1 - age / 8) * 2 : 0;
      c.translate(row.position.x, row.position.y - bounce);
      for (let i = 0; i < count; i++) {
        const s = payoutSlot(i, count, seed);
        coin(c, s.x, s.y, s.r, s.a, s.flat);
      }
      const twinkle = (tick + seed % 83) % 83;
      if (twinkle < 16) {
        c.globalAlpha *= Math.sin(Math.PI * twinkle / 16);
        line(c, [[3, -15], [3, -9]], PALE, 0.85);
        line(c, [[0.7, -12], [5.3, -12]], PALE, 0.85);
      }
    }
    c.restore();
  }
  function marcusDepthItems(model2, tick, viewport = null) {
    const h = model2.bossHazards ?? {}, items = [], visible = (p, r) => !viewport || p.x + r >= (viewport.x ?? viewport.left ?? -Infinity) && p.x - r <= (viewport.right ?? (viewport.x ?? 0) + (viewport.width ?? Infinity)) && p.y + r >= (viewport.y ?? viewport.top ?? -Infinity) && p.y - r <= (viewport.bottom ?? (viewport.y ?? 0) + (viewport.height ?? Infinity));
    const add = (id, p, r, dy, draw) => {
      if (p && visible(p, r)) items.push(Object.freeze({ id: "marcus-vfx/" + id, anchorX: p.x, anchorY: p.y + dy, draw }));
    };
    for (const row of h.marcusTelegraphs ?? []) {
      if (tick < row.startedTick || tick > row.resolvesTick) continue;
      const id = row.id ?? row.bossId + "/" + row.sequence;
      if (row.ability === "lasso") {
        const p = row.targetPosition, from = row.originPosition, middle = point2((p.x + from.x) / 2, Math.max(p.y, from.y));
        add(id + "/lasso", middle, Math.hypot(p.x - from.x, p.y - from.y) + 80, 2, (c) => lasso(c, row, tick, model2, true));
      }
    }
    for (const row of h.marcusImpacts ?? []) {
      const age = tick - row.resolvedTick;
      if (age < 0 || age >= 40) continue;
      const id = row.id ?? row.bossId + "/" + row.sequence;
      if (row.ability === "lasso") {
        const p = row.targetPosition, from = row.originPosition, middle = point2((p.x + from.x) / 2, Math.max(p.y, from.y));
        add(id + "/lasso", middle, Math.hypot(p.x - from.x, p.y - from.y) + 100, 3, (c) => lasso(c, row, tick, model2, false));
      } else if (row.ability === "strike") add(id + "/strike", row.targetPosition, 90, 2, (c) => strike(c, row, tick, model2));
      else if (row.ability === "gold_rush_dash") add(id + "/echo", row.originPosition, 400, -1, (c) => dashEcho(c, row, tick));
    }
    for (const row of h.marcusProjectiles ?? []) add(row.id + "/coin", row.position, 24, 0, (c) => projectile(c, row, tick));
    for (const row of h.marcusSnares ?? []) add("snare/" + row.targetEntityId, row.position, 30, 2, (c) => status(c, row, tick, "snare"));
    for (const row of h.marcusInversions ?? []) add("invert/" + row.targetEntityId, row.position, 30, 2, (c) => status(c, row, tick, "inversion"));
    for (const row of h.marcusMoltenShields ?? []) {
      const { p } = caster(row, model2, tick), id = row.id ?? row.bossId + "/molten/" + row.sequence;
      add(id + "/ward", p, 115, -1, (c) => moltenWard(c, row, tick, model2));
      if (row.targetPosition) {
        const target = row.targetPosition, middle = point2((p.x + target.x) / 2, Math.max(p.y, target.y));
        add(id + "/siphon", middle, Math.hypot(p.x - target.x, p.y - target.y) + 85, 2, (c) => siphon(c, row, tick, model2));
      }
    }
    for (const row of h.marcusGoldDrops ?? []) {
      if (!positive(row.amount) || tick < row.createdTick || row.collectedTick != null && tick - row.collectedTick >= 30) continue;
      const collected = row.collectedTick != null && tick >= row.collectedTick, airborne = !collected && tick < row.landsTick, from = collected ? row.position : row.originPosition, to = collected ? row.collectionPosition : row.position;
      if (!to) continue;
      const q = airborne ? clamp((tick - row.createdTick) / Math.max(1, row.landsTick - row.createdTick)) : 1, anchor = airborne ? point2(mix(from.x, to.x, q), Math.max(from.y, mix(from.y, to.y, q))) : collected ? point2((from.x + to.x) / 2, Math.max(from.y, to.y)) : to;
      add("return/" + row.id, anchor, airborne || collected ? Math.hypot(to.x - from.x, to.y - from.y) + 85 : 25, 2, (c) => payout(c, row, tick));
    }
    return items;
  }

export {marcusAttackPose,drawMarcusTheOutlaw,drawMarcusGround,marcusDepthItems};