import {asCombatAmount} from '../shared/contracts/combat_amount.js';
// Verbatim recovered from the user's complete playable HTML file (October 23 2026).
// Origin: Gilded-Vault-Keeper-PLAYABLE.html

  var ID = "gilded_vault_keeper";
  var TAU = Math.PI * 2;
  var INK = "#11151a";
  var GOLD = "#e9b747";
  var LIGHT = "#f9d976";
  var PALE = "#fff0b4";
  var BRASS = "#ad752d";
  var DARK_GOLD = "#795028";
  var WOOD = "#67412b";
  var WOOD_LIGHT = "#946039";
  var WOOD_DARK = "#402b24";
  var IRON = "#37343c";
  var RUBY = "#e33a66";
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
  var color = (flash, value) => flash ? "#fff" : value;
  function hash(value) {
    let n = 2166136261;
    for (const ch of String(value)) n = Math.imul(n ^ ch.charCodeAt(0), 16777619);
    return n >>> 0;
  }
  function fraction(value, max) {
    const a = asCombatAmount(value ?? 0), b = asCombatAmount(max ?? 1);
    if (a.n === "0" || b.n === "0") return 0;
    const head3 = (s) => Number(s.slice(0, 15)), exp = (s) => s.length - Math.min(15, s.length), power = exp(a.n) + exp(b.d) - exp(a.d) - exp(b.n);
    return clamp(head3(a.n) * head3(b.d) / (head3(a.d) * head3(b.n)) * 10 ** Math.max(-330, Math.min(330, power)));
  }
  function positive(value) {
    return asCombatAmount(value ?? 0).n !== "0";
  }
  function boundedAmount(value, limit) {
    const a = asCombatAmount(value ?? 0), n = BigInt(a.n) / BigInt(a.d);
    return Number(n > BigInt(limit) ? BigInt(limit) : n);
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
  function path(c, points, close = false) {
    c.beginPath();
    for (const [i, [x, y]] of points.entries()) i ? c.lineTo(x, y) : c.moveTo(x, y);
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
  function circle(c, x, y, r, stroke, width = 1) {
    c.beginPath();
    c.arc(x, y, Math.max(1e-3, r), 0, TAU);
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
  function glow(c, x, y, r, fill) {
    const g = c.createRadialGradient(x, y, 0.1, x, y, r);
    g.addColorStop(0, fill);
    g.addColorStop(1, "#00000000");
    ellipse(c, x, y, r, r, g);
  }
  function gildedAttackPose(actor2, tick) {
    const b = actor2.boss ?? {}, alive = actor2.alive !== false && b.bossDefinitionId === ID, pending = alive ? b.pendingAction : null, last = alive ? b.lastAction : null;
    const age = last ? tick - last.resolvedTick : Infinity, recent = age >= 0 && age < 40 ? last : null, record2 = pending ?? recent, p = pending ? progress(pending, tick) : 0;
    const aim2 = record2?.targetPosition ?? point2(actor2.position.x + Math.cos(b.facingAngle ?? Math.PI / 2) * 60, actor2.position.y + Math.sin(b.facingAngle ?? Math.PI / 2) * 60), origin = record2?.originPosition ?? actor2.position, d = unit(aim2.x - origin.x, aim2.y - origin.y);
    const seed = Number.isFinite(actor2.visualSeed) ? actor2.visualSeed : hash(actor2.entityId ?? actor2.id ?? ID) % 997, hover = Math.sin((tick + seed * 0.13) / 12) * 2;
    const pose = { ability: record2?.ability ?? null, p, age, direction: d, aim: aim2, bodyX: 0, bodyY: -38 + hover, rotation: Math.sin(tick / 47) * 0.018, jaw: 0.2 + 0.045 * Math.sin((tick + seed) / 17), wing: 0.08 + 0.025 * Math.sin(tick / 13), armLift: 0, armFold: 0, charge: 0, release: 0, slack: 0, strike: 0, strikeSide: d.x < 0 ? -1 : 1 };
    const tax = b.taxation, taxAge = tax?.resolvedTick == null ? Infinity : tick - tax.resolvedTick;
    const taxOwns = alive && tax && (tax.outcome === "channeling" || b.actionState === "dazed" || ["completed", "broken"].includes(tax.outcome) && taxAge >= 0 && taxAge < 36);
    if (taxOwns) {
      const held = ease(((tax.outcome === "channeling" ? tick : tax.resolvedTick) - tax.startedTick) / 14), weight = held * (tax.outcome === "channeling" ? 1 : 1 - ease(taxAge / 30));
      pose.bodyY -= 4 * weight;
      pose.jaw = mix(pose.jaw, 0.88, weight);
      pose.wing = mix(pose.wing, -0.47, weight);
      pose.armLift = -3 * weight;
      pose.armFold = 0.8 * weight;
      pose.charge = 0.85 * weight;
      if (b.actionState === "dazed") {
        const elapsed = tick - (b.dazeStartedTick ?? tick), remaining = (b.dazeEndsTick ?? tick + 210) - tick;
        pose.slack = ease(elapsed / 16) * (1 - ease((18 - remaining) / 18));
        pose.bodyY += 11 * pose.slack;
        pose.rotation += 0.13 * pose.slack + Math.sin(elapsed * 0.21) * 0.025 * pose.slack;
        pose.jaw += 0.25 * pose.slack;
        pose.wing += 0.38 * pose.slack;
        pose.armLift += 8 * pose.slack;
      }
      const entry = (1 - ease((Math.min(tick, tax.resolvedTick ?? tick) - tax.startedTick) / 12)) * (tax.outcome === "channeling" ? 1 : 1 - ease(taxAge / 18));
      if (entry > 0 && last && tax.startedTick - last.resolvedTick >= 0 && tax.startedTick - last.resolvedTick < 40) {
        const prior = gildedAttackPose({ ...actor2, position: tax.originPosition, boss: { ...b, taxation: null, pendingAction: null, actionState: "idle" } }, tax.startedTick);
        const idle = -38 + Math.sin((tax.startedTick + seed * 0.13) / 12) * 2;
        pose.bodyX += prior.bodyX * entry;
        pose.bodyY += (prior.bodyY - idle) * entry;
      }
      pose.ability = b.actionState === "dazed" ? "dazed" : "taxation";
      pose.p = progress(tax, tick);
      pose.age = taxAge;
      return pose;
    }
    if (pending?.ability === "vault_crush") {
      const coil = ease(p / 0.68), drive = ease((p - 0.8) / 0.2);
      pose.bodyX = d.x * (-3 * coil + 6 * drive);
      pose.bodyY += -5 * coil + 12 * drive;
      pose.rotation += d.x * (-0.05 * coil + 0.09 * drive);
      pose.wing += -0.46 * coil + 0.76 * drive;
      pose.armLift = -22 * coil + 42 * drive;
      pose.jaw = mix(pose.jaw, 0.7, coil) * (1 - 0.82 * drive);
      pose.charge = coil;
    } else if (recent?.ability === "vault_crush") {
      const amount2 = 1 - ease(age / 36), settle = Math.sin(Math.PI * clamp(age / 13));
      pose.bodyX = d.x * 3 * amount2;
      pose.bodyY += 7 * amount2 + 2 * settle;
      pose.rotation += d.x * 0.04 * amount2;
      pose.wing += 0.3 * amount2;
      pose.armLift = 20 * amount2;
      pose.jaw = mix(pose.jaw, 0.126, amount2);
      pose.charge = amount2;
      pose.release = 1 - ease(age / 12);
    } else if (pending?.ability === "gold_fall") {
      const coil = ease(p / 0.65), release = ease((p - 0.78) / 0.22);
      pose.bodyY -= 5 * coil - 3 * release;
      pose.wing -= 0.27 * coil;
      pose.armLift = -18 * coil + 5 * release;
      pose.armFold = -0.35 * coil;
      pose.jaw = mix(pose.jaw, 0.96, coil);
      pose.charge = coil;
    } else if (recent?.ability === "gold_fall") {
      const amount2 = 1 - ease(age / 34);
      pose.bodyY -= 2 * amount2;
      pose.wing -= 0.27 * amount2;
      pose.armLift = -13 * amount2;
      pose.armFold = -0.35 * amount2;
      pose.jaw = mix(pose.jaw, 0.96, amount2);
      pose.charge = amount2;
      pose.release = 1 - ease(age / 12);
    } else if (recent?.ability === "strike" && age < 26) {
      const amount2 = 1 - ease(age / 26);
      pose.bodyX = d.x * 7 * amount2;
      pose.bodyY += d.y * 8 * amount2;
      pose.rotation += d.x * 0.07 * amount2;
      pose.jaw = mix(pose.jaw, 0.05, amount2);
      pose.strike = amount2;
      pose.charge = 0.4 * amount2;
    }
    return pose;
  }
  function coin(c, x, y, rx, ry, angle2 = 0, flash = false) {
    c.save();
    c.translate(x, y);
    c.rotate(angle2);
    ellipse(c, 0, 0.8, rx, ry, color(flash, BRASS), true, 1);
    ellipse(c, -0.35, -0.4, rx * 0.87, ry * 0.83, color(flash, GOLD));
    if (!flash) {
      ellipse(c, -rx * 0.2, -ry * 0.27, rx * 0.55, ry * 0.36, LIGHT);
      c.strokeStyle = "#9b6729";
      c.lineWidth = 0.6;
      c.beginPath();
      c.ellipse(-0.25, -0.3, rx * 0.65, ry * 0.58, 0, 0, TAU);
      c.stroke();
      ellipse(c, -rx * 0.35, -ry * 0.42, Math.max(0.35, rx * 0.2), Math.max(0.2, ry * 0.18), PALE);
    }
    c.restore();
  }
  function hoard(c, actor2, tick, flash) {
    const walk = actor2.movedLastTick ? 1 : 0, step2 = Math.sin(tick * 0.27) * 0.7 * walk;
    ellipse(c, 0, 7, 38, 8, "#1c130b48");
    for (const [x, y, r] of [[-20, -3, 6.5], [-8, -5, 7], [6, -6, 6.7], [20, -3, 7], [-11, -10, 6], [1, -11, 6.3], [12, -9, 5.5], [-29, 2, 6], [-18, 5, 7], [-5, 4, 7.5], [8, 6, 7], [20, 4, 6.7], [30, 1, 5.5]]) coin(c, x + step2, y, r, r * 0.37, Math.sin(x * 0.2) * 0.12, flash);
  }
  function wing(c, side, pose, flash) {
    const angle2 = side * (pose.wing + (side < 0 ? -0.07 : 0) + pose.slack * (side < 0 ? 0.08 : -0.05));
    c.save();
    c.translate(side * 21, -3);
    c.rotate(angle2);
    const p = [[0, 0], [side * 33, -28], [side * 29, -5], [side * 37, 18], [side * 15, 11], [side * 5, 20]];
    polygon(c, p, color(flash, BRASS));
    if (!flash) {
      polygon(c, [[side * 4, -1], [side * 29, -24], [side * 24, -5], [side * 11, 9]], GOLD, false);
      polygon(c, [[side * 8, 1], [side * 26, -17], [side * 22, -5]], LIGHT, false);
      polygon(c, [[side * 26, 0], [side * 33, 14], [side * 17, 8]], DARK_GOLD, false);
      line(c, [[side * 5, 1], [side * 12, 8], [side * 29, 13]], "#e2b356", 0.8);
    }
    ellipse(c, side * 3, 3, 3.2, 3.2, color(flash, IRON), true, 0.9);
    ellipse(c, side * 2.7, 2.4, 1.3, 1.3, color(flash, LIGHT));
    c.restore();
  }
  function armGeometry(side, pose) {
    const root = point2(side * 25, 4), idle = point2(side * (32 - 11 * pose.armFold), 24 + pose.armLift), hand3 = { ...idle };
    if (side === pose.strikeSide && pose.strike > 0) {
      const vx = pose.aim.x - pose.actorX - pose.bodyX, vy = pose.aim.y - pose.actorY - 17 - pose.bodyY, u = rotate(vx, vy, -pose.rotation), d = unit(u.x - root.x, u.y - root.y);
      hand3.x = mix(hand3.x, u.x - d.x * 10, pose.strike);
      hand3.y = mix(hand3.y, u.y - d.y * 10, pose.strike);
    }
    const dx = hand3.x - root.x, dy = hand3.y - root.y, length = Math.hypot(dx, dy) || 1, bend = Math.max(4, Math.min(11, 19 - length * 0.18));
    const elbow2 = point2(root.x + dx * 0.45 + side * bend, root.y + dy * 0.45 - 3);
    const direction = pose.strike > 0 && side === pose.strikeSide ? unit(hand3.x - elbow2.x, hand3.y - elbow2.y) : unit(side * 0.12, 1);
    return { root, elbow: elbow2, hand: hand3, angle: Math.atan2(direction.y, direction.x) - Math.PI / 2 };
  }
  function ingotLimb(c, a, b, width, flash) {
    const d = unit(b.x - a.x, b.y - a.y), n = point2(-d.y, d.x), p = [[a.x + n.x * width, a.y + n.y * width], [b.x + n.x * width * 0.85, b.y + n.y * width * 0.85], [b.x - n.x * width * 0.85, b.y - n.y * width * 0.85], [a.x - n.x * width, a.y - n.y * width]];
    polygon(c, p, color(flash, BRASS));
    if (!flash) {
      polygon(c, [p[0], p[1], [b.x, b.y], [a.x, a.y]], GOLD, false);
      line(c, [[a.x + n.x * (width - 0.9), a.y + n.y * (width - 0.9)], [b.x + n.x * (width * 0.85 - 0.9), b.y + n.y * (width * 0.85 - 0.9)]], LIGHT, 0.8);
    }
  }
  function arm(c, g, flash, handOnly = false) {
    if (!handOnly) {
      ingotLimb(c, g.root, g.elbow, 3.4, flash);
      ingotLimb(c, g.elbow, g.hand, 4.1, flash);
      ellipse(c, g.elbow.x, g.elbow.y, 4.2, 4.2, color(flash, BRASS), true);
      ellipse(c, g.elbow.x - 0.8, g.elbow.y - 1, 2, 1.7, color(flash, LIGHT));
      return;
    }
    c.save();
    c.translate(g.hand.x, g.hand.y);
    c.rotate(g.angle);
    polygon(c, [[-5, -3], [4.5, -3], [5.5, 4], [3, 7], [-3, 7], [-5.5, 3]], color(flash, GOLD));
    for (const s of [-1, 1]) polygon(c, [[s * 3, 3], [s * 5.2, 5], [s * 5.3, 11], [s * 1.2, 14], [s * 2.8, 7]], color(flash, s < 0 ? LIGHT : BRASS));
    if (!flash) polygon(c, [[-3.8, -1], [-0.8, -1], [-0.8, 4], [-3.2, 4]], PALE, false);
    c.restore();
  }
  function crown(c, flash, slack) {
    c.save();
    c.translate(0, -25);
    c.rotate(-slack * 0.13);
    polygon(c, [[-12, 1], [-16, -11], [-7, -7], [0, -19], [7, -7], [16, -11], [12, 1]], color(flash, GOLD));
    if (!flash) {
      polygon(c, [[-12, 1], [-9, -3], [9, -3], [12, 1]], BRASS, false);
      polygon(c, [[-11, -8], [-7, -5], [0, -15], [-1, -6], [-4, -3]], PALE, false);
      polygon(c, [[2, -6], [7, -7], [13, -9], [9, -3], [2, -3]], "#cf9534", false);
    }
    polygon(c, [[-3, -3], [0, -7], [3, -3], [0, 0]], color(flash, RUBY), true, 0.8);
    c.restore();
  }
  function chest(c, pose, flash) {
    const gap = 6 + 22 * pose.jaw, tilt = -0.075 - 0.1 * pose.jaw + pose.slack * 0.06;
    const upperA = rotate(-24, 0, tilt), upperB = rotate(24, 0, tilt);
    upperA.y -= gap;
    upperB.y -= gap;
    polygon(c, [[-23, -1], [23, -1], [upperB.x, upperB.y], [upperA.x, upperA.y]], color(flash, "#17121d"));
    if (!flash) {
      c.save();
      path(c, [[-22, 0], [22, 0], [upperB.x, upperB.y], [upperA.x, upperA.y]], true);
      c.clip();
      glow(c, 0, -gap * 0.48, 16 + pose.charge * 4, `rgba(239,53,100,${0.45 + pose.charge * 0.25})`);
      const r = 5.6 + pose.charge * 0.8;
      polygon(c, [[0, -gap * 0.48 - r], [-r * 0.75, -gap * 0.48], [0, -gap * 0.48 + r], [r * 0.75, -gap * 0.48]], RUBY, true, 0.8);
      polygon(c, [[0, -gap * 0.48 - r], [-r * 0.75, -gap * 0.48], [0, -gap * 0.48 + 1]], "#ff9dba", false);
      ellipse(c, -0.7, -gap * 0.48 - 1.2, 1.1, 1.2, PALE);
      c.restore();
    }
    polygon(c, [[-24, -1], [24, -1], [25, 20], [17, 25], [-21, 22]], color(flash, WOOD));
    if (!flash) {
      polygon(c, [[-21, 2], [18, 2], [18, 8], [-21, 7]], WOOD_LIGHT, false);
      polygon(c, [[-21, 14], [24, 11], [25, 20], [17, 25], [-21, 22]], WOOD_DARK, false);
      line(c, [[-15, 12], [12, 11]], "#8b5732", 0.7);
    }
    for (const side of [-1, 1]) {
      const x = side < 0 ? -24 : 17;
      polygon(c, [[x, -1], [x + 6, -1], [x + 6, 22], [x, 21]], color(flash, IRON));
      if (!flash) {
        line(c, [[x + 1.3, 1], [x + 1.3, 19]], "#6c6262", 0.8);
        for (const y of [3, 17]) ellipse(c, x + 3, y, 1.15, 1.15, BRASS, true, 0.6);
      }
    }
    for (const x of [-16, -8, 0, 8, 16]) polygon(c, [[x - 2, -0.8], [x, -5.6], [x + 2, -0.8]], color(flash, GOLD), true, 0.75);
    for (const side of [-1, 1]) {
      const top = side < 0 ? upperA : upperB;
      ingotLimb(c, point2(side * 23, -1), point2(top.x, top.y + 1), 1.5, flash);
    }
    c.save();
    c.translate(0, -gap);
    c.rotate(tilt);
    for (const x of [-16, -8, 0, 8, 16]) polygon(c, [[x - 2.1, 0], [x, 5.2], [x + 2.1, 0]], color(flash, LIGHT), true, 0.75);
    c.beginPath();
    c.moveTo(-25, 0);
    c.lineTo(-25, -13);
    c.quadraticCurveTo(-23, -23, -11, -23);
    c.lineTo(12, -23);
    c.quadraticCurveTo(25, -22, 25, -12);
    c.lineTo(25, 0);
    c.closePath();
    c.fillStyle = color(flash, WOOD);
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 1.26;
    c.stroke();
    if (!flash) {
      c.save();
      c.clip();
      polygon(c, [[-26, -20], [18, -23], [23, -15], [-26, -13]], WOOD_LIGHT, false);
      polygon(c, [[-26, -5], [26, -8], [26, 1], [-26, 1]], WOOD_DARK, false);
      c.restore();
    }
    for (const x of [-23, 17]) {
      polygon(c, [[x, -18], [x + 5, -21], [x + 5, 0], [x, 0]], color(flash, GOLD));
      if (!flash) line(c, [[x + 1, -17], [x + 1, -2]], PALE, 0.8);
    }
    polygon(c, [[-4, -7], [4, -7], [4, 4], [-4, 4]], color(flash, GOLD));
    if (!flash) {
      ellipse(c, 0, -2, 1.5, 1.5, INK);
      polygon(c, [[-0.8, -2], [0.8, -2], [1, 1], [-1, 1]], INK, false);
    }
    crown(c, flash, pose.slack);
    c.restore();
  }
  function drawGildedVaultKeeper(c, actor2, tick, flash = false) {
    if (actor2.boss?.bossDefinitionId !== ID) return false;
    const pose = { ...gildedAttackPose(actor2, tick), actorX: actor2.position.x, actorY: actor2.position.y }, death = actor2.alive === false ? ease((actor2.deathAge ?? 0) / 38) : 0;
    c.save();
    c.translate(actor2.position.x, actor2.position.y);
    c.lineCap = "round";
    c.lineJoin = "round";
    c.globalAlpha *= 1 - death;
    hoard(c, actor2, tick, flash);
    c.translate(pose.bodyX, pose.bodyY + death * 14);
    c.rotate(pose.rotation + death * 0.22);
    wing(c, -1, pose, flash);
    wing(c, 1, pose, flash);
    const arms = [armGeometry(-1, pose), armGeometry(1, pose)];
    for (const g of arms) arm(c, g, flash);
    chest(c, pose, flash);
    for (const g of arms) arm(c, g, flash, true);
    if (pose.slack > 0.05) {
      c.save();
      c.globalAlpha *= pose.slack;
      for (let i = 0; i < 3; i++) {
        const a = tick * 0.06 + i * TAU / 3;
        coin(c, Math.cos(a) * 15, -72 + Math.sin(a) * 3, 2, 1.2, a);
      }
      c.restore();
    }
    c.restore();
    return true;
  }
  function sealMark(c, x, y, r, alpha = 1) {
    c.save();
    c.translate(x, y);
    c.globalAlpha *= alpha;
    circle(c, 0, 0, r, GOLD, 1);
    circle(c, 0, 0, r * 0.78, "#b4803466", 0.7);
    c.fillStyle = GOLD;
    c.beginPath();
    c.arc(0, -r * 0.11, r * 0.17, 0, TAU);
    c.fill();
    polygon(c, [[-r * 0.08, -r * 0.03], [r * 0.08, -r * 0.03], [r * 0.14, r * 0.26], [-r * 0.14, r * 0.26]], GOLD, false);
    c.restore();
  }
  function warning(c, p, r, q) {
    ellipse(c, p.x, p.y, r, r, "#d6a13a0d");
    circle(c, p.x, p.y, r, INK, 2.5);
    circle(c, p.x, p.y, r, GOLD, 1.05);
    c.strokeStyle = PALE;
    c.lineWidth = 1.3;
    c.beginPath();
    c.arc(p.x, p.y, r - 3, -Math.PI / 2, -Math.PI / 2 + TAU * q);
    c.stroke();
    for (let i = 0; i < 4; i++) {
      const a = i * TAU / 4;
      c.save();
      c.translate(p.x, p.y);
      c.rotate(a);
      line(c, [[r - 6, -3], [r - 1, 0], [r - 6, 3]], LIGHT, 0.9);
      c.restore();
    }
  }
  function targetRows(row) {
    return row.targets?.length ? row.targets : [row.position ?? row.targetPosition];
  }
  function impactGround(c, row, tick) {
    const age = tick - row.resolvedTick;
    if (age < 0 || age >= 40 || row.ability === "strike") return;
    const r = row.ability === "gold_fall" ? 24 : 64;
    for (const p of targetRows(row)) {
      c.save();
      c.globalAlpha *= 1 - ease(age / 35);
      ellipse(c, p.x, p.y, r * 0.76, r * 0.35, "#8e632a26");
      if (age < 9) {
        c.save();
        c.globalAlpha *= 1 - ease(age / 9);
        ellipse(c, p.x, p.y, r, r, "#ffe2a029");
        circle(c, p.x, p.y, r, PALE, 1.45);
        c.restore();
      }
      circle(c, p.x, p.y, 5 + (r - 5) * ease(age / 15), GOLD, 1.15);
      for (let i = 0; i < 6; i++) {
        const a = i * TAU / 6 + 0.35, dist = 8 + (r - 8) * ease(age / 18);
        line(c, [[p.x + Math.cos(a) * (dist - 4), p.y + Math.sin(a) * (dist - 4)], [p.x + Math.cos(a) * dist, p.y + Math.sin(a) * dist]], i % 2 ? LIGHT : BRASS, 0.8);
      }
      c.restore();
    }
  }
  function teleport(c, row, tick) {
    const age = tick - row.startedTick;
    if (age < 0 || age >= 22 || Math.hypot(row.position.x - row.originPosition.x, row.position.y - row.originPosition.y) < 1) return;
    c.save();
    c.globalAlpha *= 1 - ease(age / 22);
    for (const [p, depart] of [[row.originPosition, true], [row.position, false]]) {
      const r = depart ? 32 * (1 - ease(age / 22)) + 4 : 7 + 34 * ease(age / 22);
      sealMark(c, p.x, p.y, r, 0.7);
      for (let i = 0; i < 5; i++) {
        const a = i * TAU / 5;
        coin(c, p.x + Math.cos(a) * r, p.y + Math.sin(a) * r * 0.6 - age * 0.25, 2.6, 1.4, a + age * 0.06);
      }
    }
    c.restore();
  }
  function drawGildedGround(c, model2, tick) {
    const h = model2.bossHazards ?? {};
    c.save();
    for (const row of h.gildedTelegraphs ?? []) {
      if (tick < row.startedTick || tick > row.resolvesTick) continue;
      const q = progress(row, tick);
      for (const p of targetRows(row)) {
        warning(c, p, row.radius ?? (row.ability === "gold_fall" ? 24 : 64), q);
        if (row.ability === "vault_crush") sealMark(c, p.x, p.y, 26, 0.2 + 0.35 * q);
      }
    }
    for (const row of h.gildedImpacts ?? []) impactGround(c, row, tick);
    for (const row of h.gildedGoldDrops ?? []) payoutGround(c, row, tick);
    for (const row of h.gildedTaxations ?? []) teleport(c, row, tick);
    c.restore();
  }
  function stamp(c, row, tick, pending) {
    const p = row.position ?? row.targetPosition, age = pending ? 0 : tick - row.resolvedTick, q = pending ? progress(row, tick) : 1;
    if (!pending && (age < 0 || age >= 34)) return;
    const build = ease((q - 0.08) / 0.5), drop = ease((q - 0.8) / 0.2), height = pending ? 58 * build * (1 - drop) : 0, fade = pending ? build : 1 - ease((age - 7) / 27), ry = 12 * (pending ? 1 : 1 - 0.35 * Math.sin(Math.PI * clamp(age / 10)));
    if (fade <= 0) return;
    c.save();
    c.globalAlpha *= fade;
    c.translate(p.x, p.y - height);
    ellipse(c, 0, 4, 31 * build, ry, color(false, DARK_GOLD), true);
    ellipse(c, 0, -2, 31 * build, ry, GOLD, true);
    ellipse(c, -2, -4, 25 * build, ry * 0.69, LIGHT);
    c.save();
    c.scale(1, 0.43);
    sealMark(c, 0, -6, 23 * build, 0.9);
    c.restore();
    line(c, [[-24, -1], [-15, 3], [-2, 5]], PALE, 0.85);
    if (!pending && age < 24) for (let i = 0; i < 7; i++) {
      const a = i * 2.39996, travel = age * (0.7 + i % 3 * 0.13), rise = Math.max(0, age * 1.2 - age * age * 0.055);
      coin(c, Math.cos(a) * travel, Math.sin(a) * travel * 0.55 - rise, 2.8, 1.4, a + age * 0.06);
    }
    c.restore();
  }
  function goldIngot(c, x, y, scale, angle2 = 0, flash = false) {
    c.save();
    c.translate(x, y);
    c.rotate(angle2);
    const p = (arr) => arr.map(([x2, y2]) => [x2 * scale, y2 * scale]);
    polygon(c, p([[-12, -3], [6, -7], [13, -2], [13, 6], [-5, 10], [-12, 5]]), color(flash, BRASS));
    polygon(c, p([[-12, -3], [6, -7], [13, -2], [-5, 3]]), color(flash, LIGHT));
    polygon(c, p([[-5, 3], [13, -2], [13, 6], [-5, 10]]), color(flash, GOLD));
    if (!flash) {
      line(c, p([[-10, -3], [5, -6], [9, -3]]), PALE, 0.8);
      line(c, p([[-3, 5], [9, 1]]), "#c38b32", 0.7);
    }
    c.restore();
  }
  function fallingGold(c, row, index, tick, pending) {
    const p = targetRows(row)[index], age = pending ? 0 : tick - row.resolvedTick, q = pending ? progress(row, tick) : 1;
    if (!p || !pending && (age < 0 || age >= 35)) return;
    const build = ease((q - 0.06 - index * 0.08) / 0.34), drop = ease((q - 0.72) / 0.28), height = pending ? 74 * ease(q / 0.55) * (1 - drop) : 0, fade = pending ? build : 1 - ease((age - 6) / 29);
    if (fade <= 0) return;
    c.save();
    c.globalAlpha *= fade;
    goldIngot(c, p.x, p.y - height - 4, build * (pending ? 1 : 1 - 0.08 * Math.sin(Math.PI * clamp(age / 8))), -0.12 + index * 0.15);
    if (pending && drop > 0) {
      c.save();
      c.globalAlpha *= drop * 0.45;
      for (const dx of [-8, 7]) line(c, [[p.x + dx, p.y - height - 30], [p.x + dx, p.y - height - 13]], PALE, 0.8);
      c.restore();
    }
    if (!pending && age < 24) for (let i = 0; i < 5; i++) {
      const a = i * TAU / 5 + index, travel = age * (0.5 + i % 2 * 0.25), rise = Math.max(0, age * 1.1 - age * age * 0.052);
      coin(c, p.x + Math.cos(a) * travel, p.y + Math.sin(a) * travel * 0.6 - rise, 2.5, 1.3, a + age * 0.08);
    }
    c.restore();
  }
  var WARD = [[-43, -52], [-26, -66], [26, -66], [43, -52], [49, 25], [32, 41], [-32, 41], [-49, 25]];
  function wardSegments() {
    const result = [];
    for (let i = 0; i < WARD.length; i++) {
      const a = WARD[i], b = WARD[(i + 1) % WARD.length], parts = Math.hypot(b[0] - a[0], b[1] - a[1]) > 60 ? 2 : 1;
      for (let j = 0; j < parts; j++) result.push([[mix(a[0], b[0], j / parts), mix(a[1], b[1], j / parts)], [mix(a[0], b[0], (j + 1) / parts), mix(a[1], b[1], (j + 1) / parts)]]);
    }
    return result;
  }
  var WARD_SEGMENTS = wardSegments();
  function taxPose(row, model2, tick) {
    const actor2 = model2.entitiesById?.[row.sourceEntityId], p = actor2?.position ?? row.currentPosition ?? row.sourcePosition ?? row.position, pose = actor2 ? gildedAttackPose(actor2, tick) : { bodyX: 0, bodyY: -42, rotation: 0, jaw: 0.88 };
    return { actor: actor2, p, pose };
  }
  function taxWard(c, row, tick, model2) {
    const active = row.outcome === "channeling", age = row.resolvedTick == null ? 0 : tick - row.resolvedTick;
    if (!active && (age < 0 || age >= 36 || !["completed", "broken", "cancelled", "defeated"].includes(row.outcome))) return;
    const { p, pose } = taxPose(row, model2, tick), ratio = fraction(row.shieldUnits, row.maxShieldUnits), enter = ease((tick - row.startedTick) / 12), fade = active ? 1 : 1 - ease(age / 36);
    c.save();
    c.translate(p.x + pose.bodyX, p.y + pose.bodyY);
    c.globalAlpha *= fade;
    if (active) {
      c.save();
      c.globalAlpha *= 0.22;
      path(c, WARD, true);
      c.strokeStyle = GOLD;
      c.lineWidth = 0.8;
      c.stroke();
      c.restore();
      for (const [i, [a, b]] of WARD_SEGMENTS.entries()) {
        const health = clamp(ratio * WARD_SEGMENTS.length - i);
        if (health <= 0) continue;
        const from = [mix(a[0], b[0], 0.05), mix(a[1], b[1], 0.05)], to = [mix(a[0], b[0], 0.05 + 0.9 * health), mix(a[1], b[1], 0.05 + 0.9 * health)];
        line(c, [from, to], INK, 5.6);
        line(c, [from, to], BRASS, 3.1);
        line(c, [[from[0] - 0.6, from[1] - 0.7], [to[0] - 0.6, to[1] - 0.7]], LIGHT, 1.05);
      }
      c.save();
      c.globalAlpha *= enter * 0.45;
      for (const x of [-36, 36]) line(c, [[x, -43], [x, -12]], PALE, 0.75);
      c.restore();
      const hitAge = row.lastShieldHit ? tick - row.lastShieldHit.tick : Infinity;
      if (hitAge >= 0 && hitAge < 7) {
        c.save();
        c.globalAlpha *= 1 - ease(hitAge / 7);
        path(c, WARD, true);
        c.strokeStyle = PALE;
        c.lineWidth = 1.6;
        c.stroke();
        c.restore();
      }
      const cracks = Math.floor((1 - ratio) * 5);
      for (let i = 0; i < cracks; i++) {
        const side = i % 2 ? 1 : -1, y = -37 + Math.floor(i / 2) * 22;
        line(c, [[side * 43, y - 5], [side * 47, y], [side * 42, y + 3]], PALE, 0.9);
      }
    } else if (row.outcome === "broken") {
      for (const [i, [a, b]] of WARD_SEGMENTS.entries()) {
        const cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2, d = unit(cx, cy), move = age * (0.55 + i % 3 * 0.1);
        c.save();
        c.translate(cx + d.x * move, cy + d.y * move + age * age * 0.026);
        c.rotate((i % 2 ? 1 : -1) * age * 0.027);
        line(c, [[a[0] - cx, a[1] - cy], [b[0] - cx, b[1] - cy]], INK, 4.6);
        line(c, [[a[0] - cx, a[1] - cy], [b[0] - cx, b[1] - cy]], GOLD, 2.4);
        c.restore();
      }
    } else {
      const shrink = 1 - ease(age / 30);
      path(c, WARD.map(([x, y]) => [x * shrink, y * shrink]), true);
      c.strokeStyle = LIGHT;
      c.lineWidth = 1.3;
      c.stroke();
    }
    c.restore();
  }
  function siphon(c, row, tick, model2) {
    const last = row.lastSiphon;
    if (!last || !positive(last.amount) || tick < last.tick || tick - last.tick >= 24 || !row.targetPosition) return;
    const { p, pose } = taxPose(row, model2, tick), gap = 6 + 22 * pose.jaw, mouth2 = rotate(0, -gap * 0.48, pose.rotation), to = point2(p.x + pose.bodyX + mouth2.x, p.y + pose.bodyY + mouth2.y), from = point2(row.targetPosition.x, row.targetPosition.y - 12), middle = point2(mix(from.x, to.x, 0.48), Math.min(from.y, to.y) - 24);
    const base = last.tick - (last.tick - row.startedTick) % 3, budget = Math.min(8, Math.ceil(boundedAmount(row.stolen, 240) / 30));
    c.save();
    for (let i = 0; i < budget; i++) {
      const born = base - i * 3, age = tick - born;
      if (born < row.startedTick || age < 0 || age >= 24) continue;
      const q = age / 24, u = 1 - q, x = u * u * from.x + 2 * u * q * middle.x + q * q * to.x, y = u * u * from.y + 2 * u * q * middle.y + q * q * to.y;
      c.save();
      c.globalAlpha *= Math.sin(Math.PI * q) * 0.9;
      coin(c, x, y, 2.5 + Math.sin(q * Math.PI) * 0.7, 1.65, q * TAU + i * 0.4);
      c.restore();
    }
    c.restore();
  }
  function payoutCount(row) {
    return Math.max(1, boundedAmount(row.amount, 18));
  }
  function payoutOrigin(row) {
    const lift = row.sourceActionState === "taxation" ? 55 : row.sourceActionState === "dazed" ? 47 : 44;
    return point2(row.originPosition.x, row.originPosition.y - lift);
  }
  var PAYOUT_SLOTS = [[-6, 1], [1, 2], [7, 0], [-3, -2], [4, -3], [-8, -2], [8, -3], [-1, -5], [2, -6]];
  function payoutSlot(index, count, seed) {
    if (index === count - 1 && count >= 6) return { x: -0.5, y: -8.5 - Math.floor(count / 9) * 0.6, rx: 3.6, ry: 3.7, angle: -0.13 };
    const p = PAYOUT_SLOTS[index % PAYOUT_SLOTS.length], layer = Math.floor(index / PAYOUT_SLOTS.length);
    return { x: p[0] + Math.sin(seed * 0.01 + index * 1.9) * 0.8, y: p[1] - layer * 0.9, rx: 3.3 + index % 3 * 0.22, ry: 1.55 + index % 2 * 0.14, angle: Math.sin(index * 1.8 + seed * 0.03) * 0.13 };
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
  function payoutPile(c, row, tick) {
    const count = payoutCount(row), seed = hash(row.id), age = tick - row.landsTick, bounce = age >= 0 && age < 8 ? Math.sin(Math.PI * age / 8) * (1 - age / 8) * 2 : 0;
    c.save();
    c.translate(row.position.x, row.position.y - bounce);
    for (let i = 0; i < count; i++) {
      const s = payoutSlot(i, count, seed);
      coin(c, s.x, s.y, s.rx, s.ry, s.angle);
    }
    if (age >= 0 && age < 9) {
      c.save();
      c.globalAlpha *= 1 - ease(age / 9);
      for (const side of [-1, 1]) line(c, [[side * 9, 1], [side * (12 + age * 0.35), -2 - age * 0.3]], LIGHT, 0.8);
      c.restore();
    }
    const twinkle = (tick + seed % 83) % 83;
    if (twinkle < 16) {
      const a = Math.sin(Math.PI * twinkle / 16);
      c.save();
      c.globalAlpha *= a;
      line(c, [[3, -15], [3, -9]], PALE, 0.85);
      line(c, [[0.7, -12], [5.3, -12]], PALE, 0.85);
      c.restore();
    }
    c.restore();
  }
  function payoutFan(c, row, tick) {
    const age = tick - row.createdTick, q = clamp(age / Math.max(1, row.landsTick - row.createdTick)), from = payoutOrigin(row), to = row.position, count = payoutCount(row), seed = hash(row.id);
    const d = unit(to.x - row.originPosition.x, to.y - row.originPosition.y), n = point2(-d.y, d.x), arc = Math.sin(Math.PI * q), travel = 1 - Math.pow(1 - q, 1.18);
    c.save();
    if (age < 6) {
      c.save();
      c.globalAlpha *= 1 - ease(age / 6);
      glow(c, from.x, from.y, 11, "#ffdc7959");
      for (const side of [-1, 1]) line(c, [[from.x + side * 2, from.y - 2], [from.x + side * 7, from.y - 5]], PALE, 1);
      c.restore();
    }
    const coins = [];
    for (let i = 0; i < count; i++) {
      const s = payoutSlot(i, count, seed), fan = count === 1 ? 0 : (i / (count - 1) - 0.5) * 31 * arc;
      const x = mix(from.x, to.x + s.x, travel) + n.x * fan, y = mix(from.y, to.y + s.y, travel) + n.y * fan * 0.6 - arc * (10 + i % 5 * 4);
      coins.push({ x, y, s, i });
    }
    coins.sort((a, b) => a.y - b.y);
    for (const { x, y, s, i } of coins) {
      const settle = ease((q - 0.65) / 0.35), ry = mix(0.8 + Math.abs(Math.cos(q * TAU * 1.4 + i)) * (s.ry + 0.45), s.ry, settle);
      coin(c, x, y, s.rx, ry, s.angle + TAU * (1 - q) * (1 + i % 2));
    }
    c.restore();
  }
  function payoutPickup(c, row, tick) {
    const age = tick - row.collectedTick;
    if (age < 0 || age >= 30 || !row.collectionPosition) return;
    const count = payoutCount(row), seed = hash(row.id), to = point2(row.collectionPosition.x, row.collectionPosition.y - 14);
    c.save();
    for (let i = 0; i < count; i++) {
      const s = payoutSlot(i, count, seed), delay = i % 6 * 1.1, q = clamp((age - delay) / (22 - delay)), u = 1 - q, from = point2(row.position.x + s.x, row.position.y + s.y), middle = point2(mix(from.x, to.x, 0.48), Math.min(from.y, to.y) - 17 - i % 3 * 3);
      if (q >= 1) continue;
      const x = u * u * from.x + 2 * u * q * middle.x + q * q * to.x, y = u * u * from.y + 2 * u * q * middle.y + q * q * to.y;
      c.save();
      c.globalAlpha *= 1 - ease((q - 0.82) / 0.18);
      if (q > 0.15 && q < 0.9) {
        const back = Math.max(0, q - 0.07), v = 1 - back, bx = v * v * from.x + 2 * v * back * middle.x + back * back * to.x, by = v * v * from.y + 2 * v * back * middle.y + back * back * to.y;
        line(c, [[bx, by], [x, y]], "#fff0b45c", 0.85);
      }
      coin(c, x, y, s.rx * (1 - q * 0.27), s.ry * (1 - q * 0.27), s.angle + q * TAU);
      c.restore();
    }
    if (age >= 10) {
      const pop = clamp((age - 10) / 20), alpha = 1 - ease(pop);
      c.save();
      c.globalAlpha *= alpha;
      for (let i = 0; i < 4; i++) {
        const a = i * TAU / 4 + 0.35, r = 4 + 8 * ease(pop);
        line(c, [[to.x + Math.cos(a) * r, to.y + Math.sin(a) * r], [to.x + Math.cos(a) * (r + 3), to.y + Math.sin(a) * (r + 3)]], i % 2 ? LIGHT : PALE, 0.9);
      }
      const amount2 = asCombatAmount(row.amount), digits = (BigInt(amount2.n) / BigInt(amount2.d)).toString(), label = digits.length <= 7 ? "+" + digits + " G" : "+ GOLD";
      c.font = "bold 8px sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.lineJoin = "round";
      c.strokeStyle = "#201a13";
      c.lineWidth = 2.3;
      c.strokeText(label, to.x, to.y - 13 - pop * 7);
      c.fillStyle = PALE;
      c.fillText(label, to.x, to.y - 13 - pop * 7);
      c.restore();
    }
    c.restore();
  }
  function payout(c, row, tick) {
    if (!positive(row.amount) || tick < row.createdTick) return;
    if (row.collectedTick != null && tick >= row.collectedTick) payoutPickup(c, row, tick);
    else if (tick < row.landsTick) payoutFan(c, row, tick);
    else payoutPile(c, row, tick);
  }
  function strikeSpark(c, row, tick) {
    const age = tick - row.resolvedTick;
    if (age < 0 || age >= 15) return;
    const p = row.targetPosition, d = unit(p.x - row.originPosition.x, p.y - row.originPosition.y);
    c.save();
    c.translate(p.x, p.y - 17);
    c.rotate(Math.atan2(d.y, d.x));
    c.globalAlpha *= 1 - ease(age / 15);
    for (const side of [-1, 1]) line(c, [[-5, side * 3], [5 + age * 0.3, side * (5 + age * 0.12)]], side < 0 ? LIGHT : PALE, 1.1);
    c.restore();
  }
  function gildedDepthItems(model2, tick, viewport = null) {
    const h = model2.bossHazards ?? {}, items = [];
    const visible = (p, r) => !viewport || p.x + r >= (viewport.x ?? viewport.left ?? -Infinity) && p.x - r <= (viewport.right ?? (viewport.x ?? 0) + (viewport.width ?? Infinity)) && p.y + r >= (viewport.y ?? viewport.top ?? -Infinity) && p.y - r <= (viewport.bottom ?? (viewport.y ?? 0) + (viewport.height ?? Infinity));
    const add = (id, p, r, dy, draw) => {
      if (p && visible(p, r)) items.push(Object.freeze({ id: "gilded-vfx/" + id, anchorX: p.x, anchorY: p.y + dy, draw }));
    };
    for (const row of h.gildedTelegraphs ?? []) {
      if (tick < row.startedTick || tick > row.resolvesTick) continue;
      const id = row.id ?? row.bossId + "/" + row.sequence;
      if (row.ability === "vault_crush") add(id + "/stamp", row.position ?? row.targetPosition, 110, 1, (c) => stamp(c, row, tick, true));
      else if (row.ability === "gold_fall") for (const [index, p] of targetRows(row).entries()) add(id + "/fall/" + index, p, 105, 1, (c) => fallingGold(c, row, index, tick, true));
    }
    for (const row of h.gildedImpacts ?? []) {
      const age = tick - row.resolvedTick;
      if (age < 0 || age >= 40) continue;
      const id = row.id ?? row.bossId + "/" + row.sequence;
      if (row.ability === "vault_crush") add(id + "/stamp", row.targetPosition, 110, 1, (c) => stamp(c, row, tick, false));
      else if (row.ability === "gold_fall") for (const [index, p] of targetRows(row).entries()) add(id + "/fall/" + index, p, 80, 1, (c) => fallingGold(c, row, index, tick, false));
      else if (row.ability === "strike") add(id + "/strike", row.targetPosition, 35, 1, (c) => strikeSpark(c, row, tick));
    }
    for (const row of h.gildedTaxations ?? []) {
      const { p } = taxPose(row, model2, tick), id = row.id ?? row.bossId + "/taxation/" + row.sequence;
      add(id + "/ward", p, 150, -1, (c) => taxWard(c, row, tick, model2));
      if (row.targetPosition) {
        const middle = point2((p.x + row.targetPosition.x) / 2, (p.y + row.targetPosition.y) / 2);
        add(id + "/siphon", middle, Math.hypot(p.x - row.targetPosition.x, p.y - row.targetPosition.y) / 2 + 100, 1, (c) => siphon(c, row, tick, model2));
      }
    }
    for (const row of h.gildedGoldDrops ?? []) {
      if (!positive(row.amount) || tick < row.createdTick || row.collectedTick != null && tick - row.collectedTick >= 30) continue;
      const collected = row.collectedTick != null && tick >= row.collectedTick, airborne = !collected && tick < row.landsTick;
      const from = collected ? row.position : row.originPosition, to = collected ? row.collectionPosition : row.position;
      if (!to) continue;
      const q = airborne ? clamp((tick - row.createdTick) / Math.max(1, row.landsTick - row.createdTick)) : 1, anchor = airborne ? point2(mix(from.x, to.x, q), Math.max(from.y, mix(from.y, to.y, q))) : collected ? point2((from.x + to.x) / 2, Math.max(from.y, to.y)) : to;
      add("return/" + row.id, anchor, airborne || collected ? Math.hypot(to.x - from.x, to.y - from.y) + 85 : 25, 2, (c) => payout(c, row, tick));
    }
    return items;
  }

export {gildedAttackPose,drawGildedVaultKeeper,drawGildedGround,gildedDepthItems};