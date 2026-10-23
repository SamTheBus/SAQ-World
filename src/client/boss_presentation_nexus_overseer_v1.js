import {asCombatAmount} from '../shared/contracts/combat_amount.js';
// Recovered verbatim from the original Oct 2026 playable preview esbuild bundle.
// src/client/boss_presentation_nexus_overseer_v1.js
  var ID = "nexus_overseer";
  var TAU = Math.PI * 2;
  var INK = "#11151a";
  var PINK = "#f12c94";
  var HOT = "#ff8bc9";
  var CYAN = "#50e1e5";
  var PALE = "#e5fbff";
  var FACE = "#30233f";
  var LIGHT = "#573550";
  var TEAL = "#19bf9d";
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
  var progress = (row, tick) => clamp((tick - row.startedTick) / Math.max(1, row.resolvesTick - row.startedTick));
  function hash(value) {
    let n = 2166136261;
    for (const ch of String(value)) n = Math.imul(n ^ ch.charCodeAt(0), 16777619);
    return n >>> 0;
  }
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
  function path(c, points, close = false) {
    c.beginPath();
    for (const [i, p] of points.entries()) i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]);
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
  function wire(c, points, color8, width = 1.1, backing = true, close = false) {
    path(c, points, close);
    if (backing) {
      c.strokeStyle = INK;
      c.lineWidth = width + 1.26;
      c.stroke();
    }
    c.strokeStyle = color8;
    c.lineWidth = width;
    c.stroke();
  }
  function glow(c, x, y, r, color8) {
    const g = c.createRadialGradient(x, y, 0.1, x, y, r);
    g.addColorStop(0, color8);
    g.addColorStop(1, "#00000000");
    ellipse(c, x, y, r, r, g);
  }
  var isMain = (a) => a?.boss?.bossDefinitionId === ID;
  var isDecoy = (a) => Boolean(a?.nexusDecoy);
  var FORMS = [
    [[-24, -22], [24, -22], [24, 22], [-24, 22], [-24, 0]],
    [[0, -30], [13, -4], [26, 22], [-26, 22], [-13, -4]],
    [[-18, -25], [18, -25], [29, 9], [0, 29], [-29, 9]]
  ];
  function formAt(time, lock = 0) {
    const cycle = (time % 900 + 900) % 900, index = Math.floor(cycle / 300), p = ease((cycle % 300 - 236) / 64);
    return FORMS[index].map(([x, y], i) => [mix(mix(x, FORMS[(index + 1) % 3][i][0], p), FORMS[0][i][0], lock), mix(mix(y, FORMS[(index + 1) % 3][i][1], p), FORMS[0][i][1], lock)]);
  }
  function nexusAttackPose(actor2, tick) {
    const b = actor2.boss ?? {}, decoy = isDecoy(actor2), alive = actor2.alive !== false;
    const pending = alive ? b.pendingAction : null, last = alive ? b.lastAction : null, age = last ? tick - last.resolvedTick : Infinity;
    const recent = age >= 0 && age < 40 ? last : null, record2 = pending ?? recent, p = pending ? progress(pending, tick) : 0;
    const origin = record2?.originPosition ?? actor2.position;
    const aim2 = record2?.targetPosition ?? point2(actor2.position.x + Math.cos(b.facingAngle ?? actor2.facingAngle ?? Math.PI / 2) * 60, actor2.position.y + Math.sin(b.facingAngle ?? actor2.facingAngle ?? Math.PI / 2) * 60);
    const d = unit(aim2.x - origin.x, aim2.y - origin.y), seed = Number.isFinite(actor2.visualSeed) ? actor2.visualSeed : hash(actor2.id ?? actor2.entityId ?? ID) % 997;
    const pose = { ability: record2?.ability ?? null, p, age, direction: d, aim: aim2, bodyX: 0, bodyY: (decoy ? -21 : -40) + Math.sin((tick + seed * 0.13) / 11) * (decoy ? 1.7 : 3), rotation: 0.09 + Math.sin((tick + seed * 0.04) / 77) * 0.12, yaw: 0.72 * Math.sin((tick + seed * 0.31) / 42 + 0.6), scaleX: 1, scaleY: 1, charge: 0, release: 0, lock: 0, formTime: tick + seed % 180, decoy };
    if (decoy) {
      const shotAge = tick - (actor2.nexusDecoy.lastShotTick ?? -Infinity), ready = actor2.nexusDecoy.aggro ? 1 - ease(((actor2.nexusDecoy.nextShotTick ?? tick + 60) - tick) / 16) : 0;
      pose.charge = clamp(ready) * 0.5;
      if (shotAge >= 0 && shotAge < 16) {
        const recoil = 1 - ease(shotAge / 16);
        pose.bodyY -= 2 * recoil;
        pose.scaleX = 1 - 0.07 * recoil;
        pose.scaleY = 1 + 0.05 * recoil;
        pose.release = recoil;
      }
      return pose;
    }
    const barrier = b.barrier, barrierAge = barrier?.resolvedTick == null ? Infinity : tick - barrier.resolvedTick;
    const ownsBarrier = alive && barrier && (barrier.outcome === "active" || barrierAge >= 0 && barrierAge < 30 && barrier.outcome === "broken");
    if (ownsBarrier) {
      const lift = ease((tick - barrier.startedTick) / 14) * (barrier.outcome === "active" ? 1 : 1 - ease(barrierAge / 30));
      pose.bodyY -= 5 * lift;
      pose.charge = 0.7 * lift;
      pose.lock = lift;
      pose.ability = "cyber_barrier";
      const entry = 1 - ease((tick - barrier.startedTick) / 12);
      if (entry > 0 && last && barrier.startedTick - last.resolvedTick >= 0 && barrier.startedTick - last.resolvedTick < 40) {
        const prior = nexusAttackPose({ ...actor2, position: barrier.originPosition, boss: { ...b, barrier: null, pendingAction: null } }, barrier.startedTick);
        const idleY = -40 + Math.sin((barrier.startedTick + seed * 0.13) / 11) * 3;
        pose.bodyX += prior.bodyX * entry;
        pose.bodyY += (prior.bodyY - idleY) * entry;
      }
      return pose;
    }
    if (pending?.ability === "prism_collapse") {
      const coil = ease(p / 0.68);
      pose.bodyX = -d.x * 3 * coil;
      pose.bodyY -= 6 * coil;
      pose.rotation -= d.x * 0.07 * coil;
      pose.scaleX = 1 - 0.055 * coil;
      pose.scaleY = 1 + 0.055 * coil;
      pose.charge = coil;
    } else if (recent?.ability === "prism_collapse") {
      const amount2 = 1 - ease(age / 36), kick = Math.sin(Math.PI * clamp(age / 12));
      pose.bodyX = -d.x * 3 * amount2;
      pose.bodyY += -6 * amount2 + 2.5 * kick;
      pose.rotation -= d.x * 0.07 * amount2;
      pose.scaleX = 1 - 0.055 * amount2;
      pose.scaleY = 1 + 0.055 * amount2;
      pose.charge = amount2;
      pose.release = 1 - ease(age / 12);
    } else if (pending?.ability === "control_glitch") {
      const coil = ease(p / 0.85);
      pose.bodyY -= 3 * coil;
      pose.scaleX = 1 + 0.04 * coil;
      pose.scaleY = 1 + 0.02 * coil;
      pose.charge = coil;
      pose.lock = coil;
    } else if (recent?.ability === "control_glitch") {
      const amount2 = 1 - ease(age / 32);
      pose.bodyY -= 3 * amount2;
      pose.scaleX = 1 + 0.04 * amount2;
      pose.scaleY = 1 + 0.02 * amount2;
      pose.charge = amount2;
      pose.lock = amount2;
      pose.release = 1 - ease(age / 13);
    } else if (recent?.ability === "strike" && age < 26) {
      const amount2 = 1 - ease(age / 26);
      pose.bodyX = d.x * 7 * amount2;
      pose.bodyY += d.y * 5 * amount2;
      pose.rotation += d.x * 0.12 * amount2;
      pose.scaleX = 1 + 0.05 * amount2;
      pose.charge = 0.4 * amount2;
      pose.release = 0.5 * amount2;
    }
    return pose;
  }
  function eye(c, pose, size, flash) {
    const r = 9.3 * size, look = unit(pose.aim.x, pose.aim.y), heat = pose.charge, release = pose.release;
    glow(c, 0, 0, (16 + heat * 5) * size, pose.decoy ? "#4ce5eb48" : `rgba(24,218,176,${0.22 + heat * 0.2})`);
    ellipse(c, 0, 0, r + 1.5 * size, r + 1 * size, flash ? "#fff" : "#0b302e", true, 1.05);
    ellipse(c, 0, 0, r, r * 0.98, flash ? "#fff" : pose.decoy ? "#60dfdf" : TEAL);
    if (flash) return;
    c.save();
    c.beginPath();
    c.ellipse(0, 0, r, r * 0.98, 0, 0, TAU);
    c.clip();
    ellipse(c, -r * 0.22, -r * 0.32, r * 0.93, r * 0.72, pose.decoy ? "#bbffff" : "#66e8bd");
    ellipse(c, r * 0.33, r * 0.68, r * 0.95, r * 0.55, pose.decoy ? "#30989f" : "#0a827c");
    c.restore();
    const px = look.x * 1.5 * size, py = look.y * 1.1 * size, w = (1.7 - 0.5 * heat) * size, h = (6.4 + heat * 0.8) * size;
    polygon(c, [[px, py - h], [px + w, py - h * 0.45], [px + w, py + h * 0.55], [px, py + h], [px - w, py + h * 0.45], [px - w, py - h * 0.55]], release > 0.3 ? PALE : PINK, true, 0.75);
    ellipse(c, -r * 0.34, -r * 0.45, 1.8 * size, 1.2 * size, PALE);
    if (release > 0) {
      c.save();
      c.globalCompositeOperation = "lighter";
      c.globalAlpha *= release;
      wire(c, [[-r * 1.6, 0], [r * 1.6, 0]], PALE, 0.8, false);
      c.restore();
    }
  }
  function prism(c, pose, size, flash) {
    const yawSin = Math.sin(pose.yaw), yawCos = Math.cos(pose.yaw);
    const verts = formAt(pose.formTime, pose.lock).map(([x, y]) => [x * size * pose.scaleX * yawCos, (y * pose.scaleY + x * yawSin * 0.13) * size]);
    const ex = 19 * yawSin * size, ey = -10 * yawCos * size, back = verts.map(([x, y]) => [x + ex, y + ey]);
    const color8 = pose.decoy ? CYAN : PINK, backColor = pose.decoy ? "#143e4c" : "#211b36";
    polygon(c, back, flash ? "#fff" : backColor, true);
    for (let i = 0; i < verts.length; i++) {
      const j = (i + 1) % verts.length, a = verts[i], z = verts[j], visible = (z[1] - a[1]) * ex - (z[0] - a[0]) * ey > 0;
      if (!visible) continue;
      polygon(c, [a, z, back[j], back[i]], flash ? "#fff" : i === 0 ? pose.decoy ? "#286071" : LIGHT : pose.decoy ? "#1b4655" : "#392239", true);
      wire(c, [back[i], back[j]], i === 0 ? HOT : color8, 0.9, false);
    }
    polygon(c, verts, flash ? "#fff" : pose.decoy ? "#183541a8" : FACE, true);
    if (!flash) {
      c.save();
      path(c, verts, true);
      c.clip();
      polygon(c, [[-40 * size, -35 * size], [35 * size, -35 * size], [-10 * size, 3 * size], [-40 * size, 15 * size]], pose.decoy ? "#58d6e21f" : "#5c365a", false);
      polygon(c, [[20 * size, -20 * size], [38 * size, -5 * size], [38 * size, 40 * size], [-12 * size, 40 * size]], pose.decoy ? "#0d1f3950" : "#241d37", false);
      if (pose.decoy) {
        c.strokeStyle = "#9af8ff5c";
        c.lineWidth = 0.7;
        for (let y = -22; y <= 22; y += 8) {
          c.beginPath();
          c.moveTo(-34 * size, y * size);
          c.lineTo(34 * size, y * size);
          c.stroke();
        }
      }
      c.restore();
      wire(c, verts.map(([x, y]) => [x * 0.85, y * 0.85]), color8, 1.05, false, true);
      for (let i = 0; i < verts.length; i++) {
        const a = verts[i], z = verts[(i + 1) % verts.length];
        if (Math.hypot(z[0] - a[0], z[1] - a[1]) < 6 * size) continue;
        wire(c, [[mix(a[0], z[0], 0.08), mix(a[1], z[1], 0.08)], [mix(a[0], z[0], 0.29), mix(a[1], z[1], 0.29)]], i % 2 ? CYAN : HOT, 0.9, false);
      }
      if (pose.charge > 0) {
        c.save();
        c.globalAlpha *= pose.charge * 0.55;
        wire(c, verts.map(([x, y]) => [x * 0.68, y * 0.68]), pose.ability === "control_glitch" ? CYAN : HOT, 0.7, false, true);
        c.restore();
      }
    }
    c.save();
    c.rotate(-pose.rotation);
    const cos = Math.cos(pose.rotation), sin = Math.sin(pose.rotation);
    eye(c, { ...pose, aim: point2(cos * pose.aim.x - sin * pose.aim.y, sin * pose.aim.x + cos * pose.aim.y) }, size, flash);
    c.restore();
  }
  function deathFragments(c, actor2, tick) {
    const age = tick - actor2.nexusDecoy.defeatedTick;
    if (age < 0 || age >= 24) return;
    c.save();
    c.globalAlpha *= 1 - ease(age / 24);
    c.translate(actor2.position.x, actor2.position.y - 21);
    for (let i = 0; i < 7; i++) {
      const a = i * 2.39996 + hash(actor2.id ?? actor2.entityId) % 11, r = 5 + age * (0.45 + i % 3 * 0.17), x = Math.cos(a) * r, y = Math.sin(a) * r + age * age * 0.018;
      c.save();
      c.translate(x, y);
      c.rotate(a + age * 0.045);
      polygon(c, [[-2.5, -1.5], [2.5, -1.5], [2.5, 1.5], [-2.5, 1.5]], i % 2 ? CYAN : PINK, true, 0.8);
      c.restore();
    }
    c.restore();
  }
  function drawNexusOverseer(c, actor2, tick, flash = false) {
    if (!isMain(actor2) && !isDecoy(actor2)) return false;
    const decoy = isDecoy(actor2), pose = nexusAttackPose(actor2, tick), size = decoy ? 0.51 : 1;
    const deathAge = decoy && actor2.nexusDecoy.defeatedTick != null ? tick - actor2.nexusDecoy.defeatedTick : actor2.deathAge ?? 0;
    const death = actor2.alive === false ? ease(deathAge / (decoy ? 18 : 36)) : 0;
    c.save();
    c.lineCap = "round";
    c.lineJoin = "round";
    c.translate(actor2.position.x, actor2.position.y);
    c.globalAlpha *= 1 - death;
    ellipse(c, 2, 4, decoy ? 14 : 31, decoy ? 4 : 8, "#0b0b1648");
    c.save();
    c.translate(pose.bodyX, pose.bodyY + death * 10);
    c.rotate(pose.rotation);
    if (pose.charge > 0) glow(c, 2, 0, decoy ? 24 : 46, `rgba(241,44,148,${pose.charge * 0.12})`);
    const vx = pose.aim.x - actor2.position.x - pose.bodyX, vy = pose.aim.y - actor2.position.y - pose.bodyY - 17, cos = Math.cos(pose.rotation), sin = Math.sin(pose.rotation);
    const localPose = { ...pose, aim: point2(cos * vx + sin * vy, -sin * vx + cos * vy) };
    prism(c, localPose, size, flash);
    const phase = ((tick + hash(actor2.id ?? actor2.entityId ?? ID) % 173) % 173 + 173) % 173;
    if (phase < 8 && !flash) {
      c.save();
      c.globalAlpha *= Math.sin(phase / 8 * Math.PI) * 0.45;
      wire(c, [[-22 * size, -12 * size], [-8 * size, -12 * size]], CYAN, 0.9, false);
      wire(c, [[11 * size, 14 * size], [27 * size, 14 * size]], PINK, 0.8, false);
      c.restore();
    }
    c.restore();
    if (decoy && actor2.alive !== false) {
      const barY = pose.bodyY - 25, w = 26;
      c.fillStyle = INK;
      c.fillRect(-w / 2 - 1, barY - 1, w + 2, 4.5);
      c.fillStyle = "#173541";
      c.fillRect(-w / 2, barY, w, 2.5);
      c.fillStyle = CYAN;
      c.fillRect(-w / 2, barY, w * fraction(actor2.hp, actor2.maxHp), 2.5);
    }
    c.restore();
    if (decoy && actor2.alive === false) deathFragments(c, actor2, tick);
    return true;
  }
  function perimeter(c, pos, r, p, color8) {
    ellipse(c, pos.x, pos.y, r, r, "#d22e7d0c");
    circle(c, pos.x, pos.y, r, INK, 2.5);
    circle(c, pos.x, pos.y, r, color8, 1.05);
    c.strokeStyle = PALE;
    c.lineWidth = 1.25;
    c.beginPath();
    c.arc(pos.x, pos.y, r - 3, -Math.PI / 2, -Math.PI / 2 + TAU * p);
    c.stroke();
  }
  function cageState(row, tick, pending) {
    const age = pending ? 0 : tick - row.resolvedTick, p = pending ? progress(row, tick) : 1, build = ease(p / 0.68), collapse = ease((p - 0.82) / 0.18);
    const r = (row.radius ?? 64) * Math.SQRT1_2 * (1 - 0.84 * collapse), height = 56 * build * (1 - 0.88 * collapse);
    return { age, p, build, collapse, r: pending ? r : r + ease(age / 13) * 45, height: pending ? height : height * (1 - ease(age / 10)), alpha: pending ? 0.22 + 0.65 * build : 1 - ease(age / 28) };
  }
  function cageGround(c, row, tick, pending) {
    const pos = row.position ?? row.targetPosition, r = row.radius ?? 64, q = cageState(row, tick, pending);
    if (!pending && (q.age < 0 || q.age >= 40)) return;
    c.save();
    if (pending) {
      perimeter(c, pos, r, q.p, PINK);
      c.globalAlpha *= 0.25 + 0.45 * q.build;
      const span = r * Math.SQRT1_2;
      wire(c, [[pos.x - span, pos.y - span], [pos.x + span, pos.y - span], [pos.x + span, pos.y + span], [pos.x - span, pos.y + span]], CYAN, 0.75, false, true);
      for (const side of [-1, 1]) {
        wire(c, [[pos.x + side * (r - 9), pos.y - 4], [pos.x + side * (r - 2), pos.y], [pos.x + side * (r - 9), pos.y + 4]], HOT, 0.9, false);
      }
    } else {
      const fade = 1 - ease(q.age / 32);
      c.globalAlpha *= fade;
      if (q.age < 10) {
        c.save();
        c.globalAlpha *= 1 - ease(q.age / 10);
        ellipse(c, pos.x, pos.y, r, r, "#f459b123");
        circle(c, pos.x, pos.y, r, PALE, 1.6);
        c.restore();
      }
      circle(c, pos.x, pos.y, 8 + (r - 8) * ease(q.age / 16), PINK, 1.5);
      for (let i = 0; i < 8; i++) {
        const a = i * TAU / 8 + 0.16, dist = 8 + (r - 7) * ease(q.age / 18);
        wire(c, [[pos.x + Math.cos(a) * (dist - 5), pos.y + Math.sin(a) * (dist - 5)], [pos.x + Math.cos(a) * dist, pos.y + Math.sin(a) * dist]], i % 2 ? CYAN : HOT, 0.9, false);
      }
    }
    c.restore();
  }
  function glitchGrid(c, row, tick, pending) {
    const pos = pending ? row.position ?? row.originPosition : row.originPosition, r = row.radius ?? 180, age = pending ? 0 : tick - row.resolvedTick, p = pending ? progress(row, tick) : 1;
    if (!pending && (age < 0 || age >= 36)) return;
    const fade = pending ? 1 : 1 - ease(age / 36);
    c.save();
    c.globalAlpha *= fade;
    perimeter(c, pos, r, p, CYAN);
    c.save();
    c.translate(pos.x, pos.y);
    c.beginPath();
    c.arc(0, 0, r - 2, 0, TAU);
    c.clip();
    c.rotate(-0.12 + p * 0.24 + (pending ? 0 : ease(age / 15) * Math.PI / 2));
    for (let i = -5; i <= 5; i++) {
      const at = i * 30, brightness = (0.07 + 0.24 * ease((p - 0.1) / 0.9)) * (0.5 + 0.5 * ease((p - Math.abs(i) * 0.1) / 0.35));
      c.strokeStyle = i % 2 ? "#e757b1" : CYAN;
      c.lineWidth = 0.7;
      c.globalAlpha = fade * brightness;
      c.beginPath();
      c.moveTo(at, -r);
      c.lineTo(at, r);
      c.moveTo(-r, at);
      c.lineTo(r, at);
      c.stroke();
    }
    c.restore();
    c.globalAlpha *= 0.45 + 0.4 * p;
    const travel = pending ? (r - 6) * ease(p) : r * (1 - ease(age / 26));
    circle(c, pos.x, pos.y, Math.max(1, travel), pending ? PINK : PALE, 1.25);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2, dist = r - 10;
      c.save();
      c.translate(pos.x + Math.cos(a) * dist, pos.y + Math.sin(a) * dist);
      c.rotate(a);
      wire(c, [[-4, -4], [0, 0], [-4, 4]], PALE, 1, false);
      c.restore();
    }
    c.restore();
  }
  function teleportGround(c, row, tick) {
    const age = tick - row.startedTick;
    if (age < 0 || age >= 22 || !row.originPosition || !row.position) return;
    if (Math.hypot(row.position.x - row.originPosition.x, row.position.y - row.originPosition.y) < 1) return;
    c.save();
    c.globalAlpha *= 1 - ease(age / 22);
    for (const [pos, depart] of [[row.originPosition, true], [row.position, false]]) {
      const r = depart ? 30 * (1 - ease(age / 22)) + 5 : 8 + 30 * ease(age / 22);
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2 + 0.2;
        c.save();
        c.translate(pos.x, pos.y);
        c.rotate(a);
        wire(c, [[r - 6, -6], [r, -6], [r, 2]], depart ? PINK : CYAN, 1, false);
        c.restore();
      }
    }
    c.restore();
  }
  function drawNexusGround(c, model2, tick) {
    const h = model2.bossHazards ?? {};
    c.save();
    for (const row of h.nexusTelegraphs ?? []) {
      if (tick < row.startedTick || tick > row.resolvesTick) continue;
      if (row.ability === "prism_collapse") cageGround(c, row, tick, true);
      else if (row.ability === "control_glitch") glitchGrid(c, row, tick, true);
    }
    for (const row of h.nexusImpacts ?? []) {
      if (row.ability === "prism_collapse") cageGround(c, row, tick, false);
      else if (row.ability === "control_glitch") glitchGrid(c, row, tick, false);
    }
    for (const row of h.nexusBarriers ?? []) teleportGround(c, row, tick);
    c.restore();
  }
  function targetCage(c, row, tick, pending, front2) {
    const q = cageState(row, tick, pending);
    if (!pending && (q.age < 0 || q.age >= 28)) return;
    const pos = row.position ?? row.targetPosition, r = q.r, top = q.height, base = [[-r, -r], [r, -r], [r, r], [-r, r]];
    const color8 = !pending && q.age < 5 ? PALE : front2 ? HOT : CYAN;
    c.save();
    c.translate(pos.x, pos.y);
    c.globalAlpha *= q.alpha;
    const indices2 = front2 ? [2, 3] : [0, 1];
    for (const i of indices2) {
      const [x, y] = base[i];
      wire(c, [[x, y], [x, y - top]], color8, 1.05, true);
      ellipse(c, x, y - top, 1.9, 1.9, color8, true, 0.75);
    }
    const edges = front2 ? [[1, 2], [2, 3], [3, 0]] : [[0, 1]];
    for (const [a, b] of edges) {
      const A = base[a], B = base[b];
      wire(c, [[A[0], A[1] - top], [B[0], B[1] - top]], color8, 1, true);
    }
    if (!front2 && pending) {
      const A = base[0], B = base[1];
      polygon(c, [[A[0], A[1]], [B[0], B[1]], [B[0], B[1] - top], [A[0], A[1] - top]], "#41d8eb0e", false);
    }
    if (!pending) {
      for (const i of indices2) {
        const [x, y] = base[i], distance4 = q.age * 0.4, fall = q.age * q.age * 0.023;
        c.save();
        c.translate(x + Math.sign(x) * distance4, y - top + fall);
        c.rotate(i + q.age * 0.09);
        polygon(c, [[-3, -2], [3, -2], [3, 2], [-3, 2]], color8, true, 0.8);
        c.restore();
      }
    }
    c.restore();
  }
  function barrierCenter(row, model2) {
    return model2.entitiesById?.[row.sourceEntityId]?.position ?? row.currentPosition ?? row.position;
  }
  function barrierWard(c, row, tick, model2) {
    const active = row.outcome === "active", age = tick - (row.resolvedTick ?? tick);
    if (!active && (age < 0 || age >= 30)) return;
    const p = barrierCenter(row, model2), actor2 = model2.entitiesById?.[row.sourceEntityId], pose = actor2 ? nexusAttackPose(actor2, tick) : { bodyX: 0, bodyY: -45 };
    const charge = ease((tick - row.startedTick) / 14), fade = active ? 1 : 1 - ease(age / 30), hitAge = row.blockedHitTick == null ? Infinity : tick - row.blockedHitTick;
    c.save();
    c.translate(p.x + pose.bodyX, p.y + pose.bodyY);
    c.globalAlpha *= fade;
    const shape = [[-38, -31], [0, -45], [39, -29], [43, 24], [0, 40], [-42, 25]];
    if (active) {
      polygon(c, shape, "#2fbfd60b", false);
      wire(c, shape, CYAN, 1.35, true, true);
      for (let i = 0; i < 6; i++) {
        const a = shape[i], b = shape[(i + 1) % 6];
        wire(c, [[mix(a[0], b[0], 0.08), mix(a[1], b[1], 0.08)], [mix(a[0], b[0], 0.08 + 0.28 * charge), mix(a[1], b[1], 0.08 + 0.28 * charge)]], i % 2 ? HOT : PALE, 0.8, false);
      }
      if (hitAge >= 0 && hitAge < 8) {
        c.save();
        c.globalAlpha *= 1 - ease(hitAge / 8);
        wire(c, shape, PALE, 2, false, true);
        c.restore();
      }
    } else if (row.outcome === "broken") {
      for (let i = 0; i < 6; i++) {
        const a = shape[i], b = shape[(i + 1) % 6], cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2, d = unit(cx, cy), travel = age * 0.7, fall = age * age * 0.018;
        c.save();
        c.translate(cx + d.x * travel, cy + d.y * travel + fall);
        c.rotate((i % 2 ? 1 : -1) * age * 0.025);
        wire(c, [[a[0] - cx, a[1] - cy], [b[0] - cx, b[1] - cy]], i % 2 ? CYAN : HOT, 1.15, true);
        c.restore();
      }
    } else wire(c, shape, CYAN, 1, false, true);
    c.restore();
  }
  function tether(c, row, decoy, tick, model2) {
    if (row.outcome !== "active" || decoy.alive === false) return;
    const a = barrierCenter(row, model2), boss2 = model2.entitiesById?.[row.sourceEntityId], bp = boss2 ? nexusAttackPose(boss2, tick) : { bodyX: 0, bodyY: -45 }, dp = nexusAttackPose(decoy, tick);
    const from = point2(a.x + bp.bodyX, a.y + bp.bodyY), to = point2(decoy.position.x + dp.bodyX, decoy.position.y + dp.bodyY), middle = point2(mix(from.x, to.x, 0.5), Math.min(from.y, to.y) - 8);
    c.save();
    c.globalAlpha *= 0.65;
    c.strokeStyle = INK;
    c.lineWidth = 2.7;
    c.beginPath();
    c.moveTo(from.x, from.y);
    c.quadraticCurveTo(middle.x, middle.y, to.x, to.y);
    c.stroke();
    c.strokeStyle = CYAN;
    c.lineWidth = 1.1;
    c.stroke();
    const travel = ((tick - row.startedTick) * 0.023 + hash(decoy.id ?? decoy.entityId) % 10 * 0.1) % 1, u = 1 - travel, x = u * u * to.x + 2 * u * travel * middle.x + travel * travel * from.x, y = u * u * to.y + 2 * u * travel * middle.y + travel * travel * from.y;
    ellipse(c, x, y, 2, 1.5, PALE);
    c.restore();
  }
  function bolt(c, row, tick) {
    if (tick < row.createdTick || tick > row.expiresTick) return;
    const p = row.position, v = row.velocity ?? point2(p.x - (row.previousPosition?.x ?? p.x), p.y - (row.previousPosition?.y ?? p.y)), d = unit(v.x, v.y), r = row.radius ?? 6;
    c.save();
    ellipse(c, p.x, p.y + 2, r + 2, 2.3, "#11152235");
    c.translate(p.x, p.y - 14);
    glow(c, 0, 0, r + 5, "#65dfe355");
    wire(c, [[-d.x * (r + 11), -d.y * (r + 11)], [-d.x * r, -d.y * r]], "#ed389b7d", 2, false);
    const n = point2(-d.y, d.x);
    polygon(c, [[d.x * r, d.y * r], [n.x * r * 0.67, n.y * r * 0.67], [-d.x * r, -d.y * r], [-n.x * r * 0.67, -n.y * r * 0.67]], PINK, true, 1.1);
    ellipse(c, 0, 0, r * 0.44, r * 0.44, PALE);
    c.restore();
  }
  function glitchStatus(c, row, tick) {
    if (tick < row.appliedTick || tick >= row.expiresTick) return;
    const p = row.position, remaining = clamp((row.expiresTick - tick) / Math.max(1, row.expiresTick - row.appliedTick));
    c.save();
    c.translate(p.x, p.y);
    c.lineCap = "round";
    c.lineJoin = "round";
    c.strokeStyle = CYAN;
    c.lineWidth = 1;
    c.beginPath();
    c.arc(0, 2, 16, -Math.PI / 2, -Math.PI / 2 + TAU * remaining);
    c.stroke();
    c.fillStyle = "#171628e8";
    c.fillRect(-27, -48, 54, 12);
    c.strokeStyle = PINK;
    c.lineWidth = 0.7;
    c.strokeRect(-27, -48, 54, 12);
    c.fillStyle = PALE;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = "bold 7px sans-serif";
    c.fillText("REVERSED", 0, -42);
    wire(c, [[-8, 9], [8, 9], [4, 5]], PINK, 1.1, true);
    wire(c, [[8, 13], [-8, 13], [-4, 17]], CYAN, 1.1, true);
    c.restore();
  }
  function strikeGlint(c, row, tick) {
    const age = tick - row.resolvedTick;
    if (age < 0 || age >= 15) return;
    const p = row.targetPosition, d = unit(p.x - row.originPosition.x, p.y - row.originPosition.y);
    c.save();
    c.translate(p.x, p.y - 17);
    c.rotate(Math.atan2(d.y, d.x));
    c.globalAlpha *= 1 - ease(age / 15);
    wire(c, [[-4, -4], [4, 0], [-4, 4]], HOT, 1.2, false);
    wire(c, [[3, -5], [7, 0], [3, 5]], CYAN, 0.8, false);
    c.restore();
  }
  function nexusDepthItems(model2, tick, viewport = null) {
    const h = model2.bossHazards ?? {}, items = [];
    const visible = (p, r) => !viewport || p.x + r >= (viewport.x ?? viewport.left ?? -Infinity) && p.x - r <= (viewport.right ?? (viewport.x ?? 0) + (viewport.width ?? Infinity)) && p.y + r >= (viewport.y ?? viewport.top ?? -Infinity) && p.y - r <= (viewport.bottom ?? (viewport.y ?? 0) + (viewport.height ?? Infinity));
    const add = (id, p, r, dy, draw) => {
      if (p && visible(p, r)) items.push(Object.freeze({ id: "nexus-vfx/" + id, anchorX: p.x, anchorY: p.y + dy, draw }));
    };
    for (const row of h.nexusTelegraphs ?? []) {
      if (row.ability !== "prism_collapse" || tick < row.startedTick || tick > row.resolvesTick) continue;
      const p = row.position ?? row.targetPosition, id = row.id ?? row.bossId + "/" + row.sequence;
      for (const front2 of [false, true]) add(id + "/cage/" + front2, p, 140, front2 ? 47 : -47, (c) => targetCage(c, row, tick, true, front2));
    }
    for (const row of h.nexusImpacts ?? []) {
      const age = tick - row.resolvedTick;
      if (age < 0 || age >= 40) continue;
      const p = row.targetPosition, id = row.id ?? row.bossId + "/" + row.sequence;
      if (row.ability === "prism_collapse") for (const front2 of [false, true]) add(id + "/cage/" + front2, p, 140, front2 ? 47 : -47, (c) => targetCage(c, row, tick, false, front2));
      else if (row.ability === "strike") add(id + "/strike", p, 35, 1, (c) => strikeGlint(c, row, tick));
    }
    for (const row of h.nexusBarriers ?? []) {
      const p = barrierCenter(row, model2), id = row.id ?? row.bossId + "/barrier/" + row.sequence;
      add(id + "/ward", p, 110, -1, (c) => barrierWard(c, row, tick, model2));
      if (row.outcome === "active") for (const entityId of row.livingDecoyEntityIds ?? row.decoyEntityIds ?? []) {
        const a = model2.entitiesById?.[entityId];
        if (!a || a.alive === false) continue;
        const middle = point2((p.x + a.position.x) / 2, (p.y + a.position.y) / 2);
        add(id + "/tether/" + entityId, middle, Math.hypot(p.x - a.position.x, p.y - a.position.y) / 2 + 80, -2, (c) => tether(c, row, a, tick, model2));
      }
    }
    for (const row of h.nexusProjectiles ?? []) add(row.id, row.position, 30, 1, (c) => bolt(c, row, tick));
    for (const row of h.nexusGlitches ?? []) add(row.id ?? (row.sourceBossId ?? row.bossId ?? ID) + "/glitch/" + row.targetEntityId, row.position, 65, 2, (c) => glitchStatus(c, row, tick));
    return items;
  }

export {nexusAttackPose,drawNexusOverseer,drawNexusGround,nexusDepthItems};