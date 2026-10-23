// Recovered verbatim from the original Oct 2026 playable preview esbuild bundle.
// src/client/boss_presentation_cinderhart_v1.js
  var ID = "cinderhart";
  var BUNNY_ID = "cinder_bunny";
  var TAU = Math.PI * 2;
  var INK = "#101318";
  var COAL = "#25272d";
  var DARK = "#191c23";
  var EDGE = "#59504b";
  var RED = "#ba442a";
  var FIRE = "#f27632";
  var GOLD = "#ffc36b";
  var HOT = "#fff0b5";
  var clamp = (x) => Math.max(0, Math.min(1, x));
  var ease = (x) => {
    x = clamp(x);
    return x * x * (3 - 2 * x);
  };
  function hash(value) {
    let h = 2166136261;
    for (const ch of String(value)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return h >>> 0;
  }
  function path(c, points, closed = false) {
    c.beginPath();
    for (const [i, p] of points.entries()) i ? c.lineTo(...p) : c.moveTo(...p);
    if (closed) c.closePath();
  }
  function polygon(c, points, fill, edge = INK, width = 1.15) {
    path(c, points, true);
    c.fillStyle = fill;
    c.fill();
    if (edge) {
      c.strokeStyle = edge;
      c.lineWidth = width;
      c.stroke();
    }
  }
  function line(c, points, color8, width = 1) {
    path(c, points);
    c.strokeStyle = color8;
    c.lineWidth = width;
    c.stroke();
  }
  function ellipse(c, x, y, rx, ry, color8, edge = null, width = 1) {
    c.beginPath();
    c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), 0, 0, TAU);
    c.fillStyle = color8;
    c.fill();
    if (edge) {
      c.strokeStyle = edge;
      c.lineWidth = width;
      c.stroke();
    }
  }
  function ring(c, x, y, r, color8, width = 1) {
    c.beginPath();
    c.arc(x, y, Math.max(0.01, r), 0, TAU);
    c.strokeStyle = color8;
    c.lineWidth = width;
    c.stroke();
  }
  function progress(row, tick) {
    return clamp((tick - row.startedTick) / Math.max(1, row.resolvesTick - row.startedTick));
  }
  function tongue(c, x, y, width, height, tick, seed = 0, heat = 1) {
    const bend = Math.sin(tick * 0.16 + seed) * width * 0.35;
    c.save();
    c.translate(x, y);
    c.beginPath();
    c.moveTo(-width * 0.68, 0);
    c.bezierCurveTo(-width, -height * 0.25, -width * 0.16, -height * 0.4, -width * 0.38, -height * 0.67);
    c.quadraticCurveTo(width * 0.04, -height * 0.54, bend, -height);
    c.quadraticCurveTo(width * 0.85, -height * 0.53, width * 0.52, -height * 0.33);
    c.quadraticCurveTo(width, -height * 0.12, width * 0.65, 0);
    c.closePath();
    c.fillStyle = heat > 0.35 ? RED : "#9a392b";
    c.fill();
    c.beginPath();
    c.moveTo(-width * 0.43, 0);
    c.quadraticCurveTo(-width * 0.72, -height * 0.21, -width * 0.18, -height * 0.48);
    c.quadraticCurveTo(width * 0.07, -height * 0.27, bend * 0.75, -height * 0.83);
    c.quadraticCurveTo(width * 0.64, -height * 0.39, width * 0.3, -height * 0.2);
    c.quadraticCurveTo(width * 0.62, -height * 0.1, width * 0.38, 0);
    c.closePath();
    c.fillStyle = heat > 0.35 ? FIRE : "#d15b2f";
    c.fill();
    c.beginPath();
    c.moveTo(-width * 0.19, 0);
    c.quadraticCurveTo(-width * 0.33, -height * 0.14, width * 0.03, -height * 0.3);
    c.quadraticCurveTo(width * 0.25, -height * 0.14, width * 0.2, 0);
    c.closePath();
    c.fillStyle = heat > 0.6 ? HOT : GOLD;
    c.fill();
    c.restore();
  }
  function cinderhartAttackPose(actor2, tick) {
    const b = actor2.boss ?? {}, alive = actor2.alive !== false, pending = alive ? b.pendingAction : null, rush = alive ? b.rush : null, last = alive ? b.lastAction : null;
    const age = last ? tick - last.resolvedTick : Infinity, q = pending ? progress(pending, tick) : 0;
    const p = {
      facing: (pending?.facing ?? b.facing ?? 1) < 0 ? -1 : 1,
      ability: pending?.ability ?? (rush ? "cinder_rush" : age >= 0 && age < 48 ? last?.ability : null),
      q,
      age,
      rush: !!rush,
      bodyY: Math.sin(tick * 0.055) * 0.8,
      bodyAngle: Math.sin(tick * 0.035) * 0.012,
      headAngle: Math.sin(tick * 0.041) * 0.025,
      headDrop: 0,
      rear: 0,
      heat: b.phase === 2 ? 0.36 : 0.12,
      pulse: 0,
      stride: actor2.movedLastTick ? Math.sin(tick * 0.42) : Math.sin(tick * 0.034) * 0.15,
      stretch: 0,
      callRelease: 0
    };
    if (pending?.ability === "warren_call") {
      p.rear = ease(q / 0.7);
      p.bodyY -= 8 * p.rear;
      p.bodyAngle -= 0.11 * p.rear;
      p.headAngle -= 0.32 * p.rear;
      p.heat = 0.2 + 0.8 * ease(q);
      p.pulse = Math.sin(Math.PI * clamp((q - 0.8) / 0.2));
    } else if (pending?.ability === "cinder_rush") {
      const u = ease(q / 0.65);
      p.bodyY += 5 * u;
      p.bodyAngle += 0.06 * u;
      p.headDrop = 15 * u;
      p.headAngle = 0.63 * u;
      p.heat = 0.35 + 0.65 * q;
      p.stride = Math.sin(tick * 0.75) * q * 0.35;
      p.stretch = 0.15 * u;
      p.pulse = Math.sin(Math.PI * clamp((q - 0.82) / 0.18));
    } else if (rush) {
      p.bodyY = 3 + Math.sin(tick * 0.8) * 2;
      p.bodyAngle = 0.09;
      p.headDrop = 13;
      p.headAngle = 0.64;
      p.stride = Math.sin(tick * 0.8);
      p.stretch = 0.3;
      p.heat = 1;
    } else if (last?.ability === "warren_call" && age >= 0 && age < 48) {
      const u = 1 - ease(age / 35);
      p.rear = u;
      p.bodyY -= 8 * u;
      p.bodyAngle -= 0.11 * u;
      p.headAngle -= 0.32 * u;
      p.heat = 0.2 + 0.8 * u;
      p.callRelease = 1 - ease(age / 28);
    } else if (last?.ability === "cinder_rush" && age >= 24 && age < 48) {
      const u = 1 - ease((age - 24) / 24);
      p.bodyY = 5 * u;
      p.bodyAngle = 0.06 * u;
      p.headDrop = 15 * u;
      p.headAngle = 0.63 * u;
      p.stride = 0.3 * u;
      p.heat = 0.2 + 0.65 * u;
    }
    return p;
  }
  function leg(c, hip, knee, ankle, foot, far, flash) {
    const shade = flash ? HOT : far ? DARK : COAL, lit = flash ? HOT : far ? "#3a3738" : EDGE;
    line(c, [hip, knee, ankle, foot], INK, 8);
    line(c, [hip, knee], shade, 6);
    line(c, [knee, ankle], shade, 4.8);
    line(c, [ankle, foot], shade, 3.5);
    line(c, [[hip[0] - 1, hip[1]], [knee[0] - 1, knee[1]], [ankle[0] - 1, ankle[1]]], lit, 1.15);
    ellipse(c, knee[0], knee[1], 3.6, 3.2, shade, INK, 0.8);
    if (!flash) {
      line(c, [[knee[0] - 1.8, knee[1] - 0.7], [knee[0] + 1, knee[1] + 1.6]], far ? RED : FIRE, 0.85);
    }
    polygon(c, [[foot[0] - 4, foot[1] - 2.8], [foot[0] + 3.4, foot[1] - 3.2], [foot[0] + 6, foot[1] + 1.5], [foot[0] - 5, foot[1] + 1.5]], flash ? HOT : "#17191f", INK, 1);
    if (!flash) {
      line(c, [[foot[0] + 1, foot[1] - 1.6], [foot[0] + 0.7, foot[1] + 1.5]], "#8c704f", 0.65);
      line(c, [[foot[0] - 3, foot[1] - 2.6], [foot[0] + 2, foot[1] - 2.6]], "#b4663b", 0.65);
    }
  }
  function antler(c, far, heat, tick, flash) {
    c.save();
    c.translate(far ? 3 : -6, far ? -10 : -9);
    c.scale(far ? 0.86 : 1, far ? 0.9 : 1);
    c.rotate(far ? 0.2 : -0.06);
    const branches = [
      [[0, 0], [-1, -14], [-10, -26], [-14, -42], [-24, -54]],
      [[-1, -14], [10, -22], [13, -34]],
      [[-10, -26], [-24, -27], [-36, -36], [-39, -46]],
      [[-14, -40], [-1, -44], [4, -55]],
      [[-24, -54], [-23, -66]],
      [[-25, -28], [-29, -42]],
      [[-36, -36], [-49, -35], [-57, -41]]
    ];
    for (let i = 0; i < branches.length; i++) {
      const points = branches[i], width = i ? 2.9 : 5.6;
      line(c, points, INK, width + 2.3);
      line(c, points, flash ? HOT : far ? "#49413c" : "#75604b", width);
      if (!flash) line(c, points, heat > 0.65 ? "#ffc277" : far ? "#945234" : "#c4763d", i ? 0.7 : 1.35);
    }
    if (!flash) {
      for (const [i, branch] of branches.entries()) {
        const end = branch.at(-1);
        ellipse(c, end[0], end[1], 0.9 + 0.8 * heat, 1.3 + heat, heat > 0.7 ? HOT : FIRE);
        if (heat > 0.35 && i % 2 === 0) tongue(c, end[0], end[1] + 0.4, 1.6 + heat, 5 + heat * 6, tick, i, heat);
      }
    }
    c.restore();
  }
  function stagHead(c, p, tick, flash) {
    c.save();
    c.translate(28, -64 + p.headDrop);
    c.rotate(p.headAngle);
    antler(c, true, p.heat, tick, flash);
    polygon(c, [[-4, -9], [-20, -16], [-15, -4], [-4, 0]], flash ? HOT : COAL, INK, 1.1);
    if (!flash) polygon(c, [[-6, -8], [-16, -12], [-12, -6], [-6, -3]], "#aa633e", null);
    polygon(c, [[3, -10], [16, -20], [15, -8], [7, -2]], flash ? HOT : DARK, INK, 1.1);
    if (!flash) polygon(c, [[7, -9], [13, -16], [12, -8], [7, -5]], "#b46d42", null);
    polygon(c, [[-7, -10], [6, -13], [16, -5], [27, 4], [27, 12], [15, 14], [5, 9], [-8, 5], [-12, -3]], flash ? HOT : COAL, INK, 1.3);
    if (!flash) {
      polygon(c, [[-7, -10], [5, -11], [11, -4], [1, 4], [-8, 3], [-10, -2]], "#57504a", null);
      polygon(c, [[8, -3], [17, 1], [25, 6], [24, 10], [14, 8], [7, 5]], "#373335", null);
      polygon(c, [[5, 7], [15, 11], [24, 10], [24, 13], [15, 14], [6, 10]], "#935439", null);
      line(c, [[-6, -3], [-1, -0.7], [3, -4], [6, -1]], FIRE, 1.1);
      ellipse(c, 9, -2, 3.7, 2.25, "#0e1118");
      ellipse(c, 10, -2, 2.35, 1.65, p.pulse > 0.15 ? HOT : GOLD);
      ellipse(c, 11, -2.3, 0.7, 0.8, "#fff8d8");
      polygon(c, [[22, 3], [28, 5], [28, 11], [24, 12], [21, 9]], "#10141b", null);
      line(c, [[13, 9], [20, 11], [26, 10]], "#0c1017", 0.8);
      line(c, [[-7, -8], [-1, -9], [5, -8]], "#a18a69", 0.7);
    }
    antler(c, false, p.heat, tick + 5, flash);
    c.restore();
  }
  function stagBody(c, p, tick, flash) {
    const fill = (color8) => flash ? HOT : color8;
    c.save();
    c.translate(-35, -39);
    c.rotate(-0.15 + Math.sin(tick * 0.08) * 0.12);
    polygon(c, [[0, 2], [-12, -2], [-18, -12], [-8, -7], [2, -5]], fill(DARK), INK, 1.1);
    if (!flash) {
      polygon(c, [[-5, -2], [-13, -7], [-15, -10], [-7, -6]], FIRE, null);
    }
    c.restore();
    c.beginPath();
    c.moveTo(-35, -44);
    c.quadraticCurveTo(-26, -54, -8, -52);
    c.quadraticCurveTo(13, -53, 23, -43);
    c.quadraticCurveTo(31, -29, 17, -20);
    c.quadraticCurveTo(-4, -19, -25, -25);
    c.quadraticCurveTo(-39, -29, -35, -44);
    c.closePath();
    c.fillStyle = fill(COAL);
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 1.5;
    c.stroke();
    if (!flash) {
      polygon(c, [[-33, -43], [-19, -51], [-3, -50], [9, -43], [1, -36], [-22, -36]], "#4d4843", null);
      polygon(c, [[-32, -35], [-17, -38], [-7, -32], [-10, -23], [-25, -26]], "#343238", null);
      polygon(c, [[5, -49], [22, -43], [26, -30], [17, -21], [4, -22], [9, -34]], "#181c25", null);
      line(c, [[-28, -43], [-20, -42], [-18, -33], [-12, -29]], "#c36235", 1.3);
      line(c, [[-15, -49], [-11, -40], [-3, -35], [-4, -28]], p.heat > 0.6 ? GOLD : FIRE, 1.4);
      line(c, [[-10, -40], [-2, -44], [4, -42]], RED, 1);
      line(c, [[-30, -42], [-25, -46], [-20, -47]], "#84715c", 0.8);
    }
    polygon(c, [[10, -27], [12, -49], [18, -66], [27, -74], [35, -69], [37, -55], [30, -38], [26, -23], [16, -19]], fill(COAL), INK, 1.4);
    if (!flash) {
      polygon(c, [[16, -49], [20, -64], [26, -69], [31, -66], [30, -55], [25, -46], [23, -30], [16, -26]], "#121720", null);
      polygon(c, [[21, -60], [27, -65], [28, -55], [24, -46], [22, -32], [18, -29], [18, -43]], RED, null);
      polygon(c, [[23, -57], [26, -59], [25, -49], [22, -40], [20, -33], [21, -48]], FIRE, null);
      polygon(c, [[23, -52], [25, -55], [23, -44], [21, -40]], p.pulse > 0.1 ? HOT : GOLD, null);
      for (const [y, x] of [[-58, 17], [-49, 14], [-39, 13], [-29, 14]]) polygon(c, [[x, y], [x + 8, y + 3], [x + 10, y + 6], [x + 1, y + 4]], "#5b4b42", null);
      line(c, [[30, -67], [33, -59], [28, -43], [26, -28]], "#9c7048", 1);
    }
    if (!flash) {
      for (let i = 0; i < 5; i++) tongue(c, 13 + i * 2.3, -46 - i * 4.6, 3.2 + p.heat * 0.5, 10 + p.heat * 10 + i % 2 * 3, tick + i * 5, i, p.heat + 0.3);
    }
    stagHead(c, p, tick, flash);
  }
  function drawCinderhart(c, actor2, tick, flash = false) {
    if (actor2.boss?.bossDefinitionId !== ID) return false;
    const p = cinderhartAttackPose(actor2, tick), death = actor2.alive === false ? ease((actor2.deathAge ?? 0) / 48) : 0;
    c.save();
    c.translate(actor2.position.x, actor2.position.y);
    c.lineCap = "round";
    c.lineJoin = "round";
    c.globalAlpha *= 1 - death;
    ellipse(c, -4, 5, 45, 11, "#0b10194d");
    c.scale(p.facing, 1);
    c.translate(0, p.bodyY + death * 14);
    c.rotate(p.bodyAngle);
    const gait = p.stride * (p.rush ? 15 : 4), rear = p.rear, stretch = p.stretch;
    const foot = (x, y, lift = 0) => [x, (y - lift - p.bodyY - Math.sin(p.bodyAngle) * x) / Math.cos(p.bodyAngle)];
    const frontLift = p.rush ? Math.max(0, p.stride) * 7 : 0, rearLift = p.rush ? Math.max(0, -p.stride) * 7 : 0;
    leg(c, [-25, -35], [-28 + gait * 0.4, -22], [-24 - gait * 0.5, -9], foot(-26 - gait, 1, rearLift), true, flash);
    leg(c, [18, -36], [20 - gait * 0.5, -20 - 12 * rear], [24 + gait * 0.6, -9 - 24 * rear], foot(27 + gait, 1 - 28 * rear, frontLift), true, flash);
    stagBody(c, p, tick, flash);
    leg(c, [-18, -31], [-12 - gait * 0.45, -18], [-24 + gait * 0.65, -9], foot(-23 + gait, 4, frontLift), false, flash);
    leg(c, [22, -35], [16 + gait * 0.48 + stretch * 8, -18 - 10 * rear], [21 - gait * 0.7 + stretch * 10, -7 - 23 * rear], foot(26 - gait + stretch * 14, 4 - 27 * rear, rearLift), false, flash);
    if (!flash && actor2.alive !== false) {
      for (let i = 0; i < 5; i++) {
        const u = (tick + i * 17) % 77 / 77, x = 9 + i * 5 + Math.sin(u * 8 + i) * 3, y = -48 - i * 2 - u * 27;
        c.save();
        c.globalAlpha *= Math.sin(u * Math.PI) * (0.28 + p.heat * 0.5);
        ellipse(c, x, y, 0.7 + i % 2 * 0.3, 1.1, i % 2 ? GOLD : FIRE);
        c.restore();
      }
      if (p.callRelease > 0) {
        for (let i = 0; i < 7; i++) {
          const u = 1 - p.callRelease, a = i * 2.3999, r = 18 + u * 48;
          c.save();
          c.globalAlpha *= p.callRelease * 0.8;
          ellipse(c, Math.cos(a) * r, -34 + Math.sin(a) * r * 0.4 - u * 18, 1.2, 1.7, i % 2 ? FIRE : GOLD);
          c.restore();
        }
      }
    }
    c.restore();
    return true;
  }
  function drawCinderBunny(c, actor2, tick, flash = false) {
    const b = actor2.cinderBunny;
    if (b?.summonType !== BUNNY_ID) return false;
    const dead = actor2.alive === false || b.stage === "defeated", age = dead ? Math.max(0, tick - (b.defeatedTick ?? tick)) : 0, fade = dead ? 1 - ease(age / 24) : 1;
    const hopping = !dead && b.stage === "hopping", u = hopping ? clamp((tick - b.hopStartedTick) / Math.max(1, b.landsTick - b.hopStartedTick)) : 0, arc = hopping ? Math.sin(Math.PI * u) * 24 : 0;
    const restAge = Math.max(0, tick - b.stageStartedTick), restLength = Math.max(1, (b.nextHopTick ?? tick + 18) - b.stageStartedTick), crouch = !hopping && !dead ? ease((restAge / restLength - 0.55) / 0.45) : 0;
    const recentLand = !hopping && b.hopSequence > 0 && !dead ? Math.max(0, 1 - restAge / 8) : 0, stretch = hopping ? Math.sin(Math.PI * u) : 0, sign = (b.facing ?? 1) < 0 ? -1 : 1;
    const seed = hash(actor2.entityId) % 31;
    c.save();
    c.translate(actor2.position.x, actor2.position.y);
    c.lineCap = "round";
    c.lineJoin = "round";
    c.globalAlpha *= fade;
    ellipse(c, 0, 3, 10 - arc * 0.09, 3.4 - arc * 0.035, "#080e1868");
    c.translate(0, -arc + 2 * crouch + recentLand * 2 + age * 0.1);
    c.scale(sign, 1);
    c.rotate(hopping ? -0.14 * Math.cos(Math.PI * u) : -0.035 * crouch);
    const sx = 1 + stretch * 0.13 + recentLand * 0.1, sy = 1 - crouch * 0.17 - recentLand * 0.13;
    c.scale(sx, sy);
    const kick = hopping ? Math.sin(Math.PI * u) * 4 : 0;
    polygon(c, [[-8, -2], [-10 - kick, 1], [-12 - kick, 3], [-5, 3], [0, -1]], flash ? HOT : "#51423b", INK, 0.8);
    polygon(c, [[4, -2], [6 + kick * 0.4, 2], [10 + kick * 0.6, 3], [10, -0.4], [7, -4]], flash ? HOT : "#5b473a", INK, 0.8);
    ellipse(c, -1, -5, 11, 7.8, flash ? HOT : COAL, INK, 1.1);
    if (!flash) {
      ellipse(c, -4, -5, 6.8, 5.4, "#54453b");
      polygon(c, [[-8, -6], [-3, -4], [-4, 0], [0, 1]], FIRE, null);
      polygon(c, [[-3, -11], [2, -9], [4, -5], [1, -6]], "#ad4e2d", null);
    }
    ellipse(c, -11, -5, 3.7, 3.6, flash ? HOT : "#bf905e", INK, 0.8);
    if (!flash) ellipse(c, -12, -5.8, 1.8, 1.9, "#ffe0a0");
    const earLean = hopping ? 0.3 + 0.3 * stretch : 0.1 + Math.sin((tick + seed) * 0.12) * 0.06;
    c.save();
    c.translate(5, -10);
    c.rotate(-earLean);
    ellipse(c, -1, -6, 2.5, 8.6, flash ? HOT : DARK, INK, 0.8);
    if (!flash) ellipse(c, -1.1, -6, 1.05, 6.1, "#ec8f42");
    c.restore();
    c.save();
    c.translate(8, -10);
    c.rotate(-earLean + 0.24);
    ellipse(c, 0, -7, 2.8, 9.6, flash ? HOT : COAL, INK, 0.8);
    if (!flash) ellipse(c, 0.1, -7.2, 1.15, 6.8, GOLD);
    c.restore();
    ellipse(c, 7, -7.5, 6.3, 5.8, flash ? HOT : COAL, INK, 1);
    if (!flash) {
      ellipse(c, 10.8, -5.4, 3.9, 2.8, "#806048");
      ellipse(c, 13, -5.1, 1.1, 0.8, "#f9b365");
      ellipse(c, 8.8, -8.8, 2, 2, "#10151e");
      ellipse(c, 9.3, -9, 1.05, 1.25, HOT);
      line(c, [[10.5, -3.7], [12.3, -3.5]], "#302d30", 0.65);
    }
    if (!flash && !dead) {
      tongue(c, -4, -11, 4, 10 + Math.sin((tick + seed) * 0.17) * 2, tick, seed, 0.8);
      tongue(c, -10, -8, 1.9, 5, tick + 8, seed + 2, 0.7);
    }
    if (dead && !flash) {
      for (let i = 0; i < 6; i++) {
        const a = i * 2.3999, r = age * 0.52;
        c.save();
        c.globalAlpha *= 1 - clamp(age / 24);
        ellipse(c, Math.cos(a) * r, -6 + Math.sin(a) * r * 0.6 - age * 0.35, 0.8, 1.1, i % 2 ? GOLD : FIRE);
        c.restore();
      }
    }
    c.restore();
    return true;
  }
  function fireGround(c, row, tick) {
    const age = tick - row.createdTick, left = row.expiresTick - tick;
    if (age < 0 || left <= 0) return;
    const r = row.radius, ignite = clamp((tick - row.createdTick) / Math.max(1, row.ignitesTick - row.createdTick)), active = tick >= row.ignitesTick, fade = 0.2 + 0.8 * clamp(left / 60), seed = hash(row.id) % 31;
    c.save();
    c.translate(row.position.x, row.position.y);
    ellipse(c, 0, 0, r, r, `rgba(22,19,24,${active ? 0.44 * fade : 0.22 * ignite})`);
    if (active) {
      ellipse(c, 0, 0, r * 0.88, r * 0.79, `rgba(171,52,27,${0.17 * fade})`);
      ring(c, 0, 0, r, "#e3803c66", 0.7 * fade + 0.3);
    } else {
      c.setLineDash([2, 3]);
      ring(c, 0, 0, r, "#e7ae62b8", 0.9);
      c.setLineDash([]);
    }
    for (let i = 0; i < 4; i++) {
      const a = i * 2.3999 + seed, rr = r * (0.33 + i * 0.11), x = Math.cos(a) * rr, y = Math.sin(a) * rr;
      c.globalAlpha = fade * (active ? 0.75 : ignite * 0.5);
      line(c, [[x - 2, y], [x + 1, y - 1], [x + 2, y + 1]], active ? FIRE : GOLD, 0.8);
    }
    c.restore();
  }
  function fireTongues(c, row, tick) {
    const age = tick - row.createdTick, left = row.expiresTick - tick;
    if (age < 0 || left <= 0) return;
    const active = tick >= row.ignitesTick, seed = hash(row.id) % 47, ignite = ease(age / 12), fade = clamp(left / 60), heat = active ? Math.max(0.18, fade) : 0.25;
    c.save();
    c.translate(row.position.x, row.position.y);
    if (!active) {
      c.globalAlpha *= ignite * 0.6;
      for (let i = 0; i < 3; i++) {
        const a = i * 2.3999 + seed;
        ellipse(c, Math.cos(a) * 8, Math.sin(a) * 5 - 1, 1, 1.6, GOLD);
      }
      c.restore();
      return;
    }
    c.globalAlpha *= 0.76 + 0.24 * fade;
    const h = (10 + 11 * ease((tick - row.ignitesTick) / 14)) * (0.24 + 0.76 * fade);
    tongue(c, -8, 3, 6.7, h * 0.76, tick, seed, heat);
    tongue(c, 7, 4, 6.1, h * 0.89, tick + 6, seed + 2, heat);
    tongue(c, -0.7, 0, 7, h * 1.18, tick + 11, seed + 4, heat);
    for (let i = 0; i < 2; i++) {
      const u = (tick + seed * 3 + i * 19) % 53 / 53;
      c.save();
      c.globalAlpha *= (1 - u) * fade * 0.6;
      ellipse(c, Math.sin(u * 8 + seed + i) * 9, -5 - u * (h + 7), 0.65, 0.95, i ? GOLD : FIRE);
      c.restore();
    }
    c.restore();
  }
  function landingWarning(c, row, tick) {
    if (tick < row.startedTick || tick > row.landsTick) return;
    const u = clamp((tick - row.startedTick) / Math.max(1, row.landsTick - row.startedTick)), r = row.radius;
    c.save();
    c.translate(row.position.x, row.position.y);
    c.globalAlpha *= 0.25 + 0.6 * ease(u);
    c.setLineDash([2, 4]);
    ring(c, 0, 0, r, "#f8b766", 0.7);
    c.setLineDash([]);
    for (let i = 0; i < 3; i++) {
      const a = i * TAU / 3 - Math.PI / 2, rr = r * (0.5 + 0.32 * (1 - u));
      line(c, [[Math.cos(a) * rr, Math.sin(a) * rr], [Math.cos(a) * (rr + 3), Math.sin(a) * (rr + 3)]], GOLD, 0.8);
    }
    c.restore();
  }
  function rushWarning(c, row, tick) {
    const end = row.rushEndPosition;
    if (!end) return;
    const from = row.originPosition, q = progress(row, tick), r = row.radius;
    c.save();
    c.lineCap = "round";
    line(c, [[from.x, from.y], [end.x, end.y]], `rgba(212,79,35,${0.06 + 0.07 * q})`, r * 2);
    const dx = end.x - from.x, dy = end.y - from.y, n = Math.hypot(dx, dy) || 1, nx = -dy / n, ny = dx / n;
    for (const s of [-1, 1]) line(c, [[from.x + nx * r * s, from.y + ny * r * s], [end.x + nx * r * s, end.y + ny * r * s]], q > 0.84 ? GOLD : "#e7894b", 0.85);
    c.beginPath();
    c.arc(end.x, end.y, r, Math.atan2(dy, dx) - Math.PI / 2, Math.atan2(dy, dx) + Math.PI / 2);
    c.strokeStyle = "#e7894b";
    c.lineWidth = 0.85;
    c.stroke();
    const a = Math.atan2(dy, dx);
    c.translate(end.x, end.y);
    c.rotate(a);
    for (let i = 0; i < 3; i++) {
      c.globalAlpha = 0.2 + 0.6 * q;
      line(c, [[-13 - i * 17, -5], [-7 - i * 17, 0], [-13 - i * 17, 5]], GOLD, 1);
    }
    c.restore();
  }
  function callWarning(c, row, tick) {
    const p = row.originPosition, q = progress(row, tick), r = row.radius;
    c.save();
    c.globalAlpha *= 0.35 + 0.5 * q;
    ring(c, p.x, p.y, r, "#e8974e", 0.85);
    for (let i = 0; i < row.spawnCount; i++) {
      const a = i * TAU / row.spawnCount + 0.6, x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r;
      c.save();
      c.translate(x, y);
      c.rotate(a);
      line(c, [[-2, -4], [1, 0], [-2, 4]], GOLD, 1);
      c.restore();
    }
    c.restore();
  }
  function drawCinderhartGround(c, model2, tick) {
    const h = model2.bossHazards ?? {};
    c.save();
    for (const row of h.cinderhartFires ?? []) fireGround(c, row, tick);
    for (const row of h.cinderhartLandings ?? []) landingWarning(c, row, tick);
    for (const row of h.cinderhartTelegraphs ?? []) {
      if (tick < row.startedTick || tick > row.resolvesTick) continue;
      if (row.ability === "cinder_rush") rushWarning(c, row, tick);
      else if (row.ability === "warren_call") callWarning(c, row, tick);
    }
    for (const row of h.cinderhartImpacts ?? []) {
      const age = tick - row.resolvedTick;
      if (row.ability !== "warren_call" || age < 0 || age >= 24) continue;
      const p = row.originPosition;
      c.save();
      c.globalAlpha *= 0.6 * (1 - ease(age / 24));
      ring(c, p.x, p.y, 20 + 38 * ease(age / 24), FIRE, 1.3);
      c.restore();
    }
    for (const actor2 of Object.values(model2.entitiesById ?? {})) {
      if (actor2.boss?.bossDefinitionId !== ID) continue;
      const age = tick - (actor2.boss.phaseStartedTick ?? -1e3);
      if (age >= 0 && age < 36) {
        c.save();
        c.globalAlpha *= (1 - ease(age / 36)) * 0.75;
        ring(c, actor2.position.x, actor2.position.y, 27 + 62 * ease(age / 36), "#ee8b43", 1.4);
        c.restore();
      }
    }
    c.restore();
  }
  function rushWake(c, actor2, tick) {
    const rush = actor2.boss.rush;
    if (!rush) return;
    const dx = rush.endPosition.x - rush.originPosition.x, dy = rush.endPosition.y - rush.originPosition.y, n = Math.hypot(dx, dy) || 1, nx = dx / n, ny = dy / n;
    c.save();
    c.translate(actor2.position.x, actor2.position.y);
    for (let i = 0; i < 7; i++) {
      const u = (tick + i * 5) % 23 / 23, spread = (i % 3 - 1) * 8, x = -nx * (10 + u * 33) - ny * spread, y = -ny * (10 + u * 33) + nx * spread - 2 - u * 7;
      c.save();
      c.globalAlpha *= (1 - u) * 0.65;
      line(c, [[x - nx * 5, y - ny * 5], [x, y]], i % 2 ? GOLD : "#ba593a", 1.1);
      c.restore();
    }
    c.restore();
  }
  function cinderhartDepthItems(model2, tick, viewport = null) {
    const h = model2.bossHazards ?? {}, items = [];
    const visible = (p, r) => !viewport || p.x + r >= (viewport.x ?? viewport.left ?? -Infinity) && p.x - r <= (viewport.right ?? (viewport.x ?? 0) + (viewport.width ?? Infinity)) && p.y + r >= (viewport.y ?? viewport.top ?? -Infinity) && p.y - r <= (viewport.bottom ?? (viewport.y ?? 0) + (viewport.height ?? Infinity));
    for (const row of h.cinderhartFires ?? []) if (visible(row.position, row.radius + 24)) items.push(Object.freeze({ id: "cinderhart-fire/" + row.id, anchorX: row.position.x, anchorY: row.position.y + 2, draw: (c) => fireTongues(c, row, tick) }));
    for (const actor2 of Object.values(model2.entitiesById ?? {})) if (actor2.boss?.bossDefinitionId === ID && actor2.boss.rush && visible(actor2.position, 70)) items.push(Object.freeze({ id: "cinderhart-rush/" + actor2.entityId, anchorX: actor2.position.x, anchorY: actor2.position.y - 1, draw: (c) => rushWake(c, actor2, tick) }));
    return items;
  }

export {cinderhartAttackPose,drawCinderhart,drawCinderBunny,drawCinderhartGround,cinderhartDepthItems};