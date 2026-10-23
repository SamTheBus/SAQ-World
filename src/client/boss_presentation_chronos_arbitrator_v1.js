import {asCombatAmount} from '../shared/contracts/combat_amount.js';
// Recovered verbatim from the original Oct 2026 playable preview esbuild bundle.
// src/client/boss_presentation_chronos_arbitrator_v1.js
  var ID = "chronos_arbitrator";
  var TAU = Math.PI * 2;
  var INK = "#11151a";
  var GOLD = "#e2ac43";
  var PALE = "#ffe8ad";
  var BRASS = "#a86d27";
  var COPPER = "#ca713b";
  var IVORY = "#f7edd4";
  var clamp = (x) => Math.max(0, Math.min(1, x));
  var ease = (x) => {
    x = clamp(x);
    return x * x * (3 - 2 * x);
  };
  var point2 = (x, y) => ({ x, y });
  var angleDelta = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
  var angleMix = (a, b, p) => a + angleDelta(a, b) * p;
  var unit = (x, y) => {
    const d = Math.hypot(x, y) || 1;
    return point2(x / d, y / d);
  };
  var progress = (row, tick) => clamp((tick - row.startedTick) / Math.max(1, row.resolvesTick - row.startedTick));
  function fraction(value, max) {
    const a = asCombatAmount(value ?? 0), b = asCombatAmount(max ?? 1);
    if (a.n === "0" || b.n === "0") return 0;
    const head3 = (s) => Number(s.slice(0, 15)), exponent = (s) => s.length - Math.min(15, s.length);
    const power = exponent(a.n) + exponent(b.d) - exponent(a.d) - exponent(b.n);
    return clamp(head3(a.n) * head3(b.d) / (head3(a.d) * head3(b.n)) * 10 ** Math.max(-330, Math.min(330, power)));
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
  function circle(c, x, y, r, color8, width = 1) {
    c.beginPath();
    c.arc(x, y, Math.max(1e-3, r), 0, TAU);
    c.strokeStyle = color8;
    c.lineWidth = width;
    c.stroke();
  }
  function polygon(c, points, fill, outline = true, width = 1.26) {
    c.beginPath();
    for (const [i, [x, y]] of points.entries()) i ? c.lineTo(x, y) : c.moveTo(x, y);
    c.closePath();
    c.fillStyle = fill;
    c.fill();
    if (outline) {
      c.strokeStyle = INK;
      c.lineWidth = width;
      c.stroke();
    }
  }
  function smoothIntegral(t, span) {
    if (t <= 0) return 0;
    if (t >= span) return t - span / 2;
    return t * t * t / (span * span) - t * t * t * t / (2 * span * span * span);
  }
  function reverseClock(t) {
    return t - 2 * smoothIntegral(t, 16);
  }
  function mechanismTime(b, tick) {
    const rw = b.rewind;
    if (!rw || tick < rw.startedTick) return tick;
    const end = rw.outcome === "channeling" ? tick : rw.resolvedTick ?? tick, clock = rw.startedTick + reverseClock(Math.max(0, end - rw.startedTick));
    if (rw.outcome === "channeling") return clock;
    const age = Math.max(0, tick - end);
    if (rw.outcome === "broken") {
      const resume = b.dazeResumeTick ?? end + 211, after = Math.max(0, tick - resume);
      return clock - 12 * (1 - Math.exp(-age / 12)) + smoothIntegral(after, 20);
    }
    return clock - age + 2 * smoothIntegral(age, 24);
  }
  function rewindHands(b, tick) {
    const rw = b.rewind;
    if (!rw || tick < rw.startedTick) return null;
    const end = rw.outcome === "channeling" ? tick : rw.resolvedTick ?? tick, p = ease(progress(rw, end));
    const start2 = [rw.startedTick / 600, rw.startedTick / 108], turns = [1, 2];
    const angles = start2.map((a, i) => a - (((a + Math.PI / 2) % TAU + TAU) % TAU + turns[i] * TAU) * p);
    if (rw.outcome === "channeling") return angles;
    const age = Math.max(0, tick - end), after = rw.outcome === "broken" ? Math.max(0, tick - (b.dazeResumeTick ?? end + 211)) : age;
    return angles.map((a, i) => a + smoothIntegral(after, 20) / (i ? 108 : 600));
  }
  function chronosAttackPose(actor2, tick) {
    const b = actor2.boss ?? {}, alive = actor2.alive !== false && b.bossDefinitionId === ID;
    const pending = alive ? b.pendingAction : null, last = alive ? b.lastAction : null, age = last ? tick - last.resolvedTick : Infinity;
    const recent = age >= 0 && age < 40 ? last : null, record2 = pending ?? recent, p = pending ? progress(pending, tick) : 0;
    const aim2 = record2?.targetPosition ?? point2(actor2.position.x + Math.cos(b.facingAngle ?? Math.PI / 2) * 60, actor2.position.y + Math.sin(b.facingAngle ?? Math.PI / 2) * 60);
    const origin = record2?.originPosition ?? actor2.position, d = unit(aim2.x - origin.x, aim2.y - origin.y), clock = mechanismTime(b, tick);
    const pose = { ability: record2?.ability ?? null, p, age, bodyX: 0, bodyY: -47 + Math.sin((tick + (actor2.visualSeed ?? 0) * 0.11) / 12) * 3.3, rotation: Math.sin(tick / 53) * 0.018, charge: 0, slack: 0, mainAngle: clock / 90, silverAngle: -clock / 24, copperAngle: clock / 30 + 0.5, hourAngle: clock / 600, minuteAngle: clock / 108, direction: d };
    const rw = b.rewind, rwAge = rw?.resolvedTick == null ? Infinity : tick - rw.resolvedTick, rwHands = rewindHands(b, tick);
    if (rwHands) {
      pose.hourAngle = rwHands[0];
      pose.minuteAngle = rwHands[1];
    }
    if (alive && rw?.outcome === "channeling") {
      const coil = ease((tick - rw.startedTick) / 16);
      pose.bodyY -= 7 * coil;
      pose.charge = coil;
    } else if (alive && rw?.outcome === "completed" && rwAge >= 0 && rwAge < 38) {
      const amount2 = 1 - ease(rwAge / 38);
      pose.bodyY -= 7 * amount2;
      pose.charge = amount2;
    } else if (alive && rw?.outcome === "broken" && rwAge >= 0 && rwAge < 18) {
      const heldLift = ease((rw.resolvedTick - rw.startedTick) / 16), amount2 = 1 - ease(rwAge / 18);
      pose.bodyY -= 7 * heldLift * amount2;
      pose.charge = heldLift * (1 - ease(rwAge / 16));
    }
    if (alive && b.actionState === "dazed") {
      const dazeAge = tick - (b.dazeStartedTick ?? tick), remaining = (b.dazeEndsTick ?? tick + 210) - tick;
      pose.slack = ease(dazeAge / 16) * (1 - ease((18 - remaining) / 18));
      pose.bodyY += 10 * pose.slack;
      pose.rotation += 0.14 * pose.slack + Math.sin(dazeAge * 0.27) * 0.035 * pose.slack;
    }
    const rewindOwnsBody = alive && rw && (rw.outcome === "channeling" || b.actionState === "dazed" || ["completed", "broken"].includes(rw.outcome) && rwAge >= 0 && rwAge < 38);
    if (rewindOwnsBody) {
      const entryTick = rw.outcome === "channeling" ? tick : Math.min(tick, rw.resolvedTick ?? tick);
      const entryWeight = (1 - ease((entryTick - rw.startedTick) / 12)) * (rw.outcome === "channeling" ? 1 : 1 - ease(rwAge / 18));
      if (entryWeight > 0 && b.lastAction && rw.startedTick - b.lastAction.resolvedTick >= 0 && rw.startedTick - b.lastAction.resolvedTick < 40) {
        const prior = chronosAttackPose({ ...actor2, position: rw.originPosition, boss: { ...b, rewind: null, actionState: "idle", pendingAction: null } }, rw.startedTick);
        const idleY = -47 + Math.sin((rw.startedTick + (actor2.visualSeed ?? 0) * 0.11) / 12) * 3.3, idleRotation = Math.sin(rw.startedTick / 53) * 0.018;
        pose.bodyX += prior.bodyX * entryWeight;
        pose.bodyY += (prior.bodyY - idleY) * entryWeight;
        pose.rotation += (prior.rotation - idleRotation) * entryWeight;
        pose.hourAngle = angleMix(pose.hourAngle, prior.hourAngle, entryWeight);
        pose.minuteAngle = angleMix(pose.minuteAngle, prior.minuteAngle, entryWeight);
        pose.charge += prior.charge * entryWeight;
      }
      pose.ability = b.actionState === "dazed" ? "dazed" : "chrono_rewind";
      pose.p = progress(rw, tick);
      pose.age = rwAge;
      return pose;
    }
    const targetAngle = Math.atan2(aim2.y - actor2.position.y - 17 - pose.bodyY - 6, aim2.x - actor2.position.x - pose.bodyX) - pose.rotation;
    if (pending?.ability === "slam") {
      const coil = ease(p / 0.72), drive = ease((p - 0.8) / 0.2);
      pose.bodyX = -d.x * 4 * coil + d.x * 7 * drive;
      pose.bodyY += -10 * coil + 15 * drive;
      pose.rotation += d.x * (-0.1 * coil + 0.08 * drive);
      pose.minuteAngle = angleMix(pose.minuteAngle, targetAngle - 1.05, coil);
      pose.minuteAngle = angleMix(pose.minuteAngle, targetAngle, drive);
      pose.hourAngle = angleMix(pose.hourAngle, targetAngle - 0.4, coil);
      pose.charge = coil;
    } else if (recent?.ability === "slam") {
      const amount2 = 1 - ease(age / 35);
      pose.bodyX = d.x * 3 * amount2;
      pose.bodyY += 5 * amount2;
      pose.rotation -= d.x * 0.02 * amount2;
      pose.minuteAngle = angleMix(pose.minuteAngle, targetAngle, amount2);
      pose.hourAngle = angleMix(pose.hourAngle, targetAngle - 0.4, amount2);
      pose.charge = amount2;
    } else if (pending?.ability === "dilation_field") {
      const coil = ease(p / 0.85);
      pose.bodyY -= 5 * coil;
      pose.rotation -= d.x * 0.06 * coil;
      pose.hourAngle = angleMix(pose.hourAngle, -Math.PI / 2, coil);
      pose.minuteAngle = angleMix(pose.minuteAngle, -Math.PI / 2, coil);
      pose.charge = coil * 0.65;
    } else if (recent?.ability === "dilation_field") {
      const amount2 = 1 - ease(age / 32);
      pose.bodyY -= 5 * amount2;
      pose.rotation -= d.x * 0.06 * amount2;
      pose.hourAngle = angleMix(pose.hourAngle, -Math.PI / 2, amount2);
      pose.minuteAngle = angleMix(pose.minuteAngle, -Math.PI / 2, amount2);
      pose.charge = amount2 * 0.65;
    } else if (recent?.ability === "strike" && age < 25) {
      const amount2 = 1 - ease(age / 25);
      pose.bodyX = d.x * 8 * amount2;
      pose.bodyY += d.y * 6 * amount2;
      pose.rotation += d.x * 0.1 * amount2;
      pose.minuteAngle = angleMix(pose.minuteAngle, targetAngle, amount2);
      pose.charge = 0.38 * amount2;
    }
    return pose;
  }
  function gearPath(c, r, teeth, angle2) {
    c.beginPath();
    for (let i = 0; i < teeth * 4; i++) {
      const a = angle2 + (i - 0.5) * TAU / (teeth * 4), rad = i % 4 < 2 ? r + 2.5 : r - 2.6, x = Math.cos(a) * rad, y = Math.sin(a) * rad;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.closePath();
  }
  function gear(c, x, y, r, teeth, angle2, palette, flash) {
    c.save();
    c.translate(x, y);
    gearPath(c, r, teeth, angle2);
    c.fillStyle = flash ? "#fff" : palette[0];
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 1.26;
    c.stroke();
    if (!flash) {
      c.save();
      c.clip();
      c.fillStyle = palette[1];
      c.beginPath();
      c.arc(0, 0, r + 3, 0.08, Math.PI - 0.18);
      c.lineTo(-r * 0.72, -r * 0.02);
      c.quadraticCurveTo(0, r * 0.45, r * 0.9, 0);
      c.closePath();
      c.fill();
      c.fillStyle = palette[2];
      c.beginPath();
      c.arc(-1, -1, r - 3, Math.PI * 1.04, Math.PI * 1.89);
      c.lineTo(r * 0.63, -r * 0.3);
      c.quadraticCurveTo(-r * 0.05, -r * 0.53, -r * 0.8, -r * 0.16);
      c.closePath();
      c.fill();
      c.restore();
    }
    ellipse(c, 0, 0, r * 0.69, r * 0.69, flash ? "#fff" : palette[1], true, 0.9);
    ellipse(c, 0, 0, r * 0.57, r * 0.57, flash ? "#fff" : "#272b2c", true, 0.85);
    if (!flash) {
      c.strokeStyle = palette[2];
      c.lineWidth = 0.8;
      c.beginPath();
      c.arc(0, 0, r * 0.69, Math.PI * 1.05, Math.PI * 1.85);
      c.stroke();
    }
    for (let i = 0; i < 4; i++) {
      const a = angle2 + i * Math.PI / 2, px = Math.cos(a) * r * 0.79, py = Math.sin(a) * r * 0.79;
      ellipse(c, px, py, r > 30 ? 1.7 : 1.3, r > 30 ? 1.7 : 1.3, flash ? "#fff" : "#443324", true, 0.8);
    }
    if (r < 30) {
      ellipse(c, 0, 0, r * 0.22, r * 0.22, flash ? "#fff" : palette[0], true);
      if (!flash) ellipse(c, -r * 0.05, -r * 0.08, r * 0.09, r * 0.07, palette[2]);
    }
    c.restore();
  }
  function hand(c, angle2, length, color8, flash) {
    c.save();
    c.translate(0, 6);
    c.rotate(angle2);
    polygon(c, [[-3.3, 0], [0, -1.1], [length - 4, -1.1], [length, 0], [length - 4, 1.1], [0, 1.1]], flash ? "#fff" : color8, true, 1);
    if (!flash) {
      c.strokeStyle = PALE;
      c.lineWidth = 0.55;
      c.beginPath();
      c.moveTo(1, -0.4);
      c.lineTo(length - 4, -0.4);
      c.stroke();
    }
    c.restore();
  }
  function mask(c, pose, flash) {
    c.save();
    c.beginPath();
    c.moveTo(-1, -26);
    c.quadraticCurveTo(-21, -21, -20, 0);
    c.lineTo(-12, 27);
    c.lineTo(12, 27);
    c.lineTo(20, 0);
    c.quadraticCurveTo(21, -20, -1, -26);
    c.closePath();
    c.fillStyle = flash ? "#fff" : IVORY;
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 1.26;
    c.stroke();
    if (!flash) {
      c.save();
      c.clip();
      polygon(c, [[3, -25], [20, -17], [23, 1], [12, 29], [4, 29], [8, 2], [5, -9]], "#cfbea0", false);
      polygon(c, [[-2, -24], [-15, -16], [-17, -3], [-14, 7], [-12, -7]], "#fff8e8", false);
      c.restore();
      c.strokeStyle = "#6b5c46";
      c.lineWidth = 0.9;
      c.beginPath();
      c.moveTo(-12, -15);
      c.lineTo(-8, -11);
      c.lineTo(-11, -5);
      c.moveTo(12, -16);
      c.lineTo(8, -11);
      c.lineTo(11, -6);
      c.moveTo(10, 12);
      c.lineTo(6, 17);
      c.lineTo(8, 22);
      c.stroke();
      for (const side of [-1, 1]) {
        const x = side * 7, y = -6;
        const glow = c.createRadialGradient(x, y, 0.2, x, y, 7 + pose.charge * 2);
        glow.addColorStop(0, "#fff0b9cc");
        glow.addColorStop(1, "#f2c85500");
        ellipse(c, x, y, 7 + pose.charge * 2, 7 + pose.charge * 2, glow);
        ellipse(c, x, y, 4.2, 3.8, "#68583f", true, 0.8);
        ellipse(c, x, y, 3.3, 3.1, "#fffbed");
        ellipse(c, x - 0.4, y - 0.5, 2.1, 1.8, "#fff");
      }
    }
    hand(c, pose.hourAngle, 14, "#42484a", flash);
    hand(c, pose.minuteAngle, 23, COPPER, flash);
    ellipse(c, 0, 6, 2.1, 2.1, flash ? "#fff" : GOLD, true, 0.9);
    if (!flash) ellipse(c, -0.4, 5.5, 0.75, 0.65, PALE);
    c.restore();
  }
  function assembly(c, pose, flash) {
    const silver = point2(-33, -27 + 3 * pose.slack), copper = point2(35, 24 + 5 * pose.slack);
    for (const p of [silver, copper]) {
      c.strokeStyle = INK;
      c.lineWidth = 7;
      c.beginPath();
      c.moveTo(p.x * 0.35, p.y * 0.35);
      c.lineTo(p.x, p.y);
      c.stroke();
      c.strokeStyle = flash ? "#fff" : "#725038";
      c.lineWidth = 3.7;
      c.stroke();
    }
    gear(c, silver.x, silver.y, 20, 10, pose.silverAngle, ["#a0b4b8", "#61757c", "#d6e3e4"], flash);
    gear(c, copper.x, copper.y, 23, 12, pose.copperAngle, [COPPER, "#85462c", "#f4b46d"], flash);
    gear(c, 2.3, 3, 40, 16, pose.mainAngle, ["#74501e", "#573c22", "#a77931"], flash);
    gear(c, 0, 0, 40, 16, pose.mainAngle, [GOLD, BRASS, PALE], flash);
    mask(c, pose, flash);
  }
  function drawChronosArbitrator(c, actor2, tick, flash = false) {
    if (actor2.boss?.bossDefinitionId !== ID) return false;
    const pose = chronosAttackPose(actor2, tick), death = actor2.alive === false ? clamp((actor2.deathAge ?? 0) / 38) : 0;
    c.save();
    c.translate(actor2.position.x, actor2.position.y);
    c.lineCap = "round";
    c.lineJoin = "round";
    c.globalAlpha *= 1 - death;
    ellipse(c, 2, 6, 43, 9, "#100b0748");
    c.translate(pose.bodyX, pose.bodyY + death * 16);
    c.rotate(pose.rotation);
    if (pose.charge > 0) {
      const g = c.createRadialGradient(0, 0, 20, 0, 0, 60);
      g.addColorStop(0, "#efbf4c00");
      g.addColorStop(0.65, `rgba(239,191,76,${0.13 * pose.charge})`);
      g.addColorStop(1, "#efbf4c00");
      ellipse(c, 0, 0, 60, 60, g);
    }
    assembly(c, pose, flash);
    if (pose.slack > 0.05) {
      c.save();
      c.globalAlpha *= pose.slack;
      for (let i = 0; i < 3; i++) {
        const a = tick * 0.065 + i * TAU / 3, x = Math.cos(a) * 15, y = -48 + Math.sin(a) * 3;
        polygon(c, [[x - 2, y], [x, y - 2.5], [x + 2, y], [x, y + 2.5]], PALE, false);
      }
      c.restore();
    }
    c.restore();
    return true;
  }
  function clockFace(c, p, r, angle2, alpha = 1, marks = 1) {
    c.save();
    c.translate(p.x, p.y);
    c.globalAlpha *= alpha;
    circle(c, 0, 0, r, INK, 2.7);
    circle(c, 0, 0, r, GOLD, 1.2);
    c.strokeStyle = PALE;
    c.lineWidth = 0.9;
    for (let i = 0; i < 12; i++) {
      const a = -Math.PI / 2 + i * TAU / 12, visible = clamp(marks * 12 - i);
      if (visible <= 0) continue;
      c.save();
      c.globalAlpha *= visible;
      c.beginPath();
      c.moveTo(Math.cos(a) * (r - (i % 3 ? 3 : 6)), Math.sin(a) * (r - (i % 3 ? 3 : 6)));
      c.lineTo(Math.cos(a) * (r - 1), Math.sin(a) * (r - 1));
      c.stroke();
      c.restore();
    }
    c.strokeStyle = "#e7b858";
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(Math.cos(angle2) * (r - 9), Math.sin(angle2) * (r - 9));
    c.moveTo(0, 0);
    c.lineTo(Math.cos(angle2 * 0.25) * (r * 0.43), Math.sin(angle2 * 0.25) * (r * 0.43));
    c.stroke();
    ellipse(c, 0, 0, 1.7, 1.7, PALE);
    c.restore();
  }
  function fieldGround(c, row, tick, pending) {
    const age = pending ? 0 : Math.max(0, tick - row.createdTick), p = pending ? progress(row, tick) : 1, pos = row.position ?? row.targetPosition, r = row.radius ?? 35;
    const remaining = pending ? 420 : row.expiresTick - tick, fade = clamp(remaining / 48), angle2 = -Math.PI / 2 + (pending ? p * TAU : TAU + age * 0.018);
    c.save();
    c.globalAlpha *= pending ? 0.65 + 0.35 * p : 0.55 + 0.45 * fade;
    ellipse(c, pos.x, pos.y, r, r, `rgba(190,130,36,${(0.05 + 0.09 * p) * (0.55 + 0.45 * fade)})`);
    clockFace(c, pos, r, angle2, 1, pending ? ease(p / 0.7) : 1);
    if (pending) {
      c.strokeStyle = PALE;
      c.lineWidth = 1.6;
      c.beginPath();
      c.arc(pos.x, pos.y, r - 2, -Math.PI / 2, -Math.PI / 2 + TAU * p);
      c.stroke();
    }
    c.globalAlpha *= 0.32 * (pending ? ease((p - 0.2) / 0.65) : fade);
    circle(c, pos.x, pos.y, r * 0.69 + Math.sin(age * 0.035) * 1.1, "#f4d184", 0.8);
    c.restore();
  }
  function slamBoundary(c, row, tick, pending) {
    const p = row.position ?? row.targetPosition, r = row.radius ?? 64, age = pending ? 0 : tick - row.resolvedTick;
    if (!pending && (age < 0 || age >= 40)) return;
    const q = pending ? progress(row, tick) : 1;
    c.save();
    if (pending) {
      ellipse(c, p.x, p.y, r, r, "#bf7f2517");
      circle(c, p.x, p.y, r, INK, 2.7);
      circle(c, p.x, p.y, r, GOLD, 1.2);
      c.strokeStyle = PALE;
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(p.x, p.y, r - 3, -Math.PI / 2, -Math.PI / 2 + TAU * q);
      c.stroke();
    } else {
      const fade = 1 - ease(age / 40);
      if (age < 12) {
        c.globalAlpha *= 1 - ease(age / 12);
        circle(c, p.x, p.y, r, PALE, 1.6);
      }
      c.globalAlpha = fade;
      circle(c, p.x, p.y, 10 + (r - 10) * ease(age / 18), GOLD, 1.5);
      ellipse(c, p.x, p.y, 16 + 35 * ease(age / 15), 8 + 16 * ease(age / 15), "#d09b3533");
    }
    c.restore();
  }
  function teleportGround(c, row, tick) {
    const age = tick - row.startedTick;
    if (age < 0 || age > 18) return;
    const origin = row.originPosition, p = row.position;
    if (Math.hypot(p.x - origin.x, p.y - origin.y) < 1) return;
    c.save();
    c.globalAlpha *= 1 - ease(age / 18);
    for (const [at, reverse] of [[origin, false], [p, true]]) {
      const r = reverse ? 12 + 34 * ease(age / 18) : 42 - 28 * ease(age / 18);
      circle(c, at.x, at.y, r, GOLD, 1.3);
      for (let i = 0; i < 8; i++) {
        const a = i * TAU / 8;
        c.strokeStyle = PALE;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(at.x + Math.cos(a) * (r - 4), at.y + Math.sin(a) * (r - 4));
        c.lineTo(at.x + Math.cos(a) * r, at.y + Math.sin(a) * r);
        c.stroke();
      }
    }
    c.restore();
  }
  function drawChronosGround(c, model2, tick) {
    const h = model2.bossHazards ?? {};
    c.save();
    for (const row of h.chronosTelegraphs ?? []) {
      if (tick < row.startedTick || tick > row.resolvesTick) continue;
      if (row.ability === "slam") slamBoundary(c, row, tick, true);
      else if (row.ability === "dilation_field") fieldGround(c, row, tick, true);
    }
    for (const row of h.chronosFields ?? []) if (tick >= row.createdTick && tick <= row.expiresTick) fieldGround(c, row, tick, false);
    for (const row of h.chronosImpacts ?? []) if (row.ability === "slam") slamBoundary(c, row, tick, false);
    for (const row of h.chronosRewinds ?? []) teleportGround(c, row, tick);
    c.restore();
  }
  function slamForce(c, row, tick, pending, actor2) {
    const p = row.position ?? row.targetPosition, age = pending ? 0 : tick - row.resolvedTick;
    if (!pending && (age < 0 || age >= 40)) return;
    const q = pending ? progress(row, tick) : 1, gather = pending ? ease((q - 0.3) / 0.48) : 1, drop = pending ? ease((q - 0.8) / 0.2) : 1, fade = pending ? 1 : 1 - ease(age / 40);
    if (gather <= 0 || fade <= 0) return;
    const y = pending ? -46 * gather * (1 - drop) - 5 * drop : -5 * (1 - ease(age / 20)), h = pending ? 24 * gather * (1 - 0.7 * drop) : (7.2 + 12 * Math.sin(Math.PI * clamp(age / 18))) * (1 - ease(age / 34)), w = pending ? (4 + 11 * drop) * gather : (15 + 9 * Math.sin(Math.PI * clamp(age / 18))) * (1 - ease(age / 38));
    c.save();
    c.globalAlpha *= gather * fade;
    if (pending && actor2) {
      const pose = chronosAttackPose(actor2, tick), x = 23 * Math.cos(pose.minuteAngle), tipY = 6 + 23 * Math.sin(pose.minuteAngle), cs = Math.cos(pose.rotation), sn = Math.sin(pose.rotation);
      c.save();
      c.globalAlpha *= 0.45 * Math.sin(Math.PI * q);
      c.strokeStyle = GOLD;
      c.lineWidth = 1.1;
      c.beginPath();
      c.moveTo(actor2.position.x + pose.bodyX + x * cs - tipY * sn, actor2.position.y + pose.bodyY + x * sn + tipY * cs);
      c.quadraticCurveTo(p.x, p.y + y - 43, p.x, p.y + y);
      c.stroke();
      c.restore();
    }
    c.translate(p.x, p.y + y);
    polygon(c, [[0, -h], [w * 0.35, -h * 0.26], [w, 0], [w * 0.3, h * 0.28], [0, h], [-w * 0.3, h * 0.28], [-w, 0], [-w * 0.35, -h * 0.26]], BRASS, true);
    polygon(c, [[0, -h], [-w * 0.35, -h * 0.26], [-w, 0], [0, h], [w * 0.16, 0]], GOLD, false);
    polygon(c, [[0, -h * 0.78], [-w * 0.13, 0], [0, h * 0.84], [w * 0.13, 0]], PALE, false);
    c.restore();
    if (!pending && age < 22) {
      c.save();
      c.globalAlpha *= 1 - ease(age / 22);
      for (let i = 0; i < 8; i++) {
        const a = i * TAU / 8, d = age * (0.7 + i % 3 * 0.15), height = Math.max(0, age * 1.65 - age * age * 0.077);
        c.strokeStyle = i % 2 ? GOLD : PALE;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d * 0.6 - height);
        c.lineTo(p.x + Math.cos(a) * (d + 3), p.y + Math.sin(a) * (d + 3) * 0.6 - height - 1);
        c.stroke();
      }
      c.restore();
    }
  }
  function rewindWard(c, row, tick, actor2) {
    const active = row.outcome === "channeling", age = row.resolvedTick == null ? 0 : tick - row.resolvedTick;
    if (!active && (age < 0 || age >= 40 || !["broken", "completed"].includes(row.outcome))) return;
    const p = row.currentPosition ?? actor2?.position ?? row.position, pose = actor2 ? chronosAttackPose(actor2, tick) : { bodyX: 0, bodyY: -47 }, radius = 64;
    const enter = ease((tick - row.startedTick) / 12), ratio = fraction(row.shieldUnits, row.maxShieldUnits), fade = active ? 1 : 1 - ease(age / 40);
    c.save();
    c.translate(p.x + pose.bodyX, p.y + pose.bodyY);
    c.globalAlpha *= enter * fade;
    if (active) {
      const glow = c.createRadialGradient(0, 0, 47, 0, 0, 69);
      glow.addColorStop(0, "#ffd15d00");
      glow.addColorStop(0.7, "#ffd15d18");
      glow.addColorStop(1, "#ffd15d00");
      ellipse(c, 0, 0, 69, 69, glow);
      circle(c, 0, 0, radius, "#e2ac4338", 0.8);
      for (let i = 0; i < 12; i++) {
        const health = clamp(ratio * 12 - i), a = -Math.PI / 2 + i * TAU / 12, span = TAU / 12 - 0.055;
        if (health <= 0) continue;
        c.strokeStyle = INK;
        c.lineWidth = 4.8;
        c.beginPath();
        c.arc(0, 0, radius, a + 0.027, a + 0.027 + span * health);
        c.stroke();
        c.strokeStyle = GOLD;
        c.lineWidth = 2.5;
        c.stroke();
        c.strokeStyle = PALE;
        c.lineWidth = 0.8;
        c.beginPath();
        c.arc(0, 0, radius - 0.9, a + 0.027 + span * health * 0.05, a + 0.027 + span * health);
        c.stroke();
      }
      const cracks = Math.floor((1 - ratio) * 5);
      c.strokeStyle = "#fff1ba";
      c.lineWidth = 1;
      for (let i = 0; i < cracks; i++) {
        const a = i * 1.71 + 0.6;
        c.save();
        c.rotate(a);
        c.beginPath();
        c.moveTo(54, -3);
        c.lineTo(59, 1);
        c.lineTo(62, -2);
        c.lineTo(67, 3);
        c.stroke();
        c.restore();
      }
      const q = progress(row, tick);
      c.strokeStyle = "#fff2c8";
      c.lineWidth = 1.6;
      c.beginPath();
      c.arc(0, 0, radius + 4, -Math.PI / 2, -Math.PI / 2 + TAU * q);
      c.stroke();
      c.strokeStyle = PALE;
      c.lineWidth = 0.9;
      for (const x of [-3, 1, 4]) {
        c.beginPath();
        if (x === -3) {
          c.moveTo(x - 1.5, -radius - 10);
          c.lineTo(x + 1.5, -radius - 5);
          c.moveTo(x + 1.5, -radius - 10);
          c.lineTo(x - 1.5, -radius - 5);
        } else {
          c.moveTo(x, -radius - 10);
          c.lineTo(x, -radius - 5);
        }
        c.stroke();
      }
      const hitAge = row.lastShieldHit ? tick - row.lastShieldHit.tick : Infinity;
      if (hitAge >= 0 && hitAge < 7) {
        c.save();
        c.globalAlpha *= 1 - ease(hitAge / 7);
        circle(c, 0, 0, radius, "#fff6d4", 1.8);
        c.restore();
      }
    } else if (row.outcome === "broken") {
      for (let i = 0; i < 12; i++) {
        const a = -Math.PI / 2 + i * TAU / 12, r = radius + age * (0.45 + i % 3 * 0.16), fall = age * age * 0.032;
        c.save();
        c.translate(Math.cos(a) * r, Math.sin(a) * r + fall);
        c.rotate(a + Math.PI / 2 + age * (i % 2 ? 0.024 : -0.024));
        polygon(c, [[-5, -1.5], [5, -1], [4, 2], [-4, 1.6]], GOLD, true, 0.8);
        c.restore();
      }
    } else {
      const shrink = 1 - ease(age / 28);
      circle(c, 0, 0, Math.max(1, radius * shrink), PALE, 1.4);
      circle(c, 0, 0, Math.max(1, (radius - 5) * shrink), "#84d2a6", 1.1);
      for (let i = 0; i < 12; i++) {
        const a = i * TAU / 12, r = (48 + i % 3 * 6) * shrink;
        c.strokeStyle = i % 3 ? "#f5d887" : "#a4efd0";
        c.lineWidth = 1.1;
        c.beginPath();
        c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        c.lineTo(Math.cos(a) * Math.max(0, r - 5), Math.sin(a) * Math.max(0, r - 5));
        c.stroke();
      }
    }
    c.restore();
  }
  function strikeGlint(c, row, tick) {
    const age = tick - row.resolvedTick;
    if (age < 0 || age >= 16) return;
    const p = row.targetPosition;
    c.save();
    c.translate(p.x, p.y - 17);
    c.globalAlpha *= 1 - ease(age / 16);
    c.strokeStyle = PALE;
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-5 - age * 0.2, -3);
    c.lineTo(5 + age * 0.2, 3);
    c.moveTo(-3, 4);
    c.lineTo(3, -4);
    c.stroke();
    c.restore();
  }
  function chronosDepthItems(model2, tick, viewport = null) {
    const h = model2.bossHazards ?? {}, items = [];
    const visible = (p, r) => !viewport || p.x + r >= (viewport.x ?? viewport.left ?? -Infinity) && p.x - r <= (viewport.right ?? (viewport.x ?? 0) + (viewport.width ?? Infinity)) && p.y + r >= (viewport.y ?? viewport.top ?? -Infinity) && p.y - r <= (viewport.bottom ?? (viewport.y ?? 0) + (viewport.height ?? Infinity));
    const add = (id, p, r, dy, draw) => {
      if (visible(p, r)) items.push(Object.freeze({ id: "chronos-vfx/" + id, anchorX: p.x, anchorY: p.y + dy, draw }));
    };
    for (const row of h.chronosTelegraphs ?? []) if (row.ability === "slam" && tick >= row.startedTick && tick <= row.resolvesTick) {
      const p = row.position ?? row.targetPosition;
      add(row.id ?? row.bossId + "/pending", p, 100, 1, (c) => slamForce(c, row, tick, true, model2.entitiesById?.[row.sourceEntityId]));
    }
    for (const row of h.chronosImpacts ?? []) {
      const age = tick - row.resolvedTick;
      if (age < 0 || age >= 40) continue;
      const p = row.targetPosition;
      if (row.ability === "slam") add((row.id ?? row.bossId + "/" + row.sequence) + "/slam", p, 100, 1, (c) => slamForce(c, row, tick, false));
      else if (row.ability === "strike") add((row.id ?? row.bossId + "/" + row.sequence) + "/strike", p, 30, 1, (c) => strikeGlint(c, row, tick));
    }
    for (const row of h.chronosRewinds ?? []) {
      const p = row.currentPosition ?? row.position;
      add(row.id ?? row.bossId + "/rewind", p, 150, -2, (c) => rewindWard(c, row, tick, model2.entitiesById?.[row.sourceEntityId]));
    }
    return items;
  }

export {chronosAttackPose,drawChronosArbitrator,drawChronosGround,chronosDepthItems};