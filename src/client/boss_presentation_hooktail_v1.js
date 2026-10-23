// Recovered verbatim from the original Oct 2026 playable preview esbuild bundle.
// src/client/boss_presentation_hooktail_v1.js
  var ID = "hooktail";
  var TAU = Math.PI * 2;
  var INK = "#100e17";
  var BLACK = "#19151e";
  var SCARLET = "#74242d";
  var RIDGE = "#aa3d38";
  var BELLY = "#ab513e";
  var HORN = "#d77a3a";
  var PALE = "#ffe7a5";
  var FIRE = "#ff6031";
  var clamp = (x) => Math.max(0, Math.min(1, x));
  var ease = (x) => {
    x = clamp(x);
    return x * x * (3 - 2 * x);
  };
  var mix = (a, b, u) => a + (b - a) * u;
  var point2 = (x, y) => ({ x, y });
  var progress = (row, tick) => clamp((tick - row.startedTick) / Math.max(1, row.resolvesTick - row.startedTick));
  function hash(s) {
    let h = 2166136261;
    for (const x of String(s)) h = Math.imul(h ^ x.charCodeAt(0), 16777619);
    return h >>> 0;
  }
  function path(c, points, closed = false) {
    c.beginPath();
    for (const [i, p] of points.entries()) i ? c.lineTo(...p) : c.moveTo(...p);
    if (closed) c.closePath();
  }
  function polygon(c, p, fill, outline = true, width = 1.3) {
    path(c, p, true);
    c.fillStyle = fill;
    c.fill();
    if (outline) {
      c.strokeStyle = INK;
      c.lineWidth = width;
      c.stroke();
    }
  }
  function line(c, p, color8, width = 1) {
    path(c, p);
    c.strokeStyle = color8;
    c.lineWidth = width;
    c.stroke();
  }
  function ellipse(c, x, y, rx, ry, fill, outline = false, width = 1.3) {
    c.beginPath();
    c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), 0, 0, TAU);
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
    c.arc(x, y, Math.max(0.01, r), 0, TAU);
    c.strokeStyle = color8;
    c.lineWidth = width;
    c.stroke();
  }
  function glow(c, x, y, r, color8) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color8);
    g.addColorStop(1, "#00000000");
    ellipse(c, x, y, r, r, g);
  }
  function rotate(x, y, a) {
    return point2(x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a));
  }
  function hooktailAttackPose(actor2, tick) {
    const b = actor2.boss ?? {}, alive = actor2.alive !== false, pending = alive ? b.pendingAction : null, last = alive ? b.lastAction : null, age = last ? tick - last.resolvedTick : Infinity, recent = age >= 0 && age < 42 ? last : null, row = pending ?? recent, q = pending ? progress(pending, tick) : 0;
    const facing = (pending?.facing ?? recent?.facing ?? b.facing ?? -1) < 0 ? -1 : 1, seed = hash(actor2.entityId ?? ID) % 193, hover = Math.sin((tick + seed) / 13) * 1.65;
    const p = { ability: row?.ability ?? null, p: q, age, facing, orientation: -facing, bodyX: 22, bodyY: -14 + hover, neckX: 0, neckY: 0, headAngle: 0.025 * Math.sin(tick / 23), jaw: 0.07 + 0.025 * Math.sin(tick / 17), heat: 0, pulse: 0, wing: 0.1 * Math.sin(tick / 12), coil: 0, compression: 0, tailDrive: 0, tailReturn: 0, target: row?.targetPosition ?? actor2.position };
    if (pending?.ability === "scarlet_fire") {
      const u = ease(q / 0.86);
      p.bodyX += 3 * u;
      p.neckX = 4 * u;
      p.neckY = -4 * u;
      p.headAngle = -0.04 * u;
      p.jaw += 0.36 * u;
      p.heat = ease(q);
      p.pulse = Math.sin(Math.PI * clamp((q - 0.8) / 0.2));
      p.wing -= 0.12 * u;
      p.coil = 0.3 * u;
    } else if (recent?.ability === "scarlet_fire") {
      const u = 1 - ease(age / 34), kick = Math.sin(Math.PI * clamp(age / 11));
      p.bodyX += (3 + 2 * kick) * u;
      p.neckX = (4 + 2 * kick) * u;
      p.neckY = -4 * u;
      p.headAngle = -0.04 * u;
      p.jaw += 0.36 * u;
      p.heat = 1 - ease(age / 24);
      p.wing -= 0.12 * u;
      p.coil = 0.3 * u;
    } else if (pending?.ability === "slam") {
      const rise = ease(q / 0.61), drive = ease((q - 0.72) / 0.28);
      p.bodyY += -14 * rise + 17 * drive;
      p.neckY = -3 * rise + 5 * drive;
      p.headAngle = -0.13 * rise + 0.18 * drive;
      p.jaw += 0.1 * rise + 0.1 * drive;
      p.wing += 0.42 * rise - 0.4 * drive;
      p.coil = rise;
      p.tailDrive = drive;
      p.compression = 0.12 * drive;
    } else if (recent?.ability === "slam") {
      const u = 1 - ease(age / 38);
      p.bodyY += 3 * u;
      p.neckY = 2 * u;
      p.headAngle = 0.05 * u;
      p.jaw += 0.2 * u;
      p.wing += 0.02 * u;
      p.coil = u;
      p.tailDrive = 1;
      p.tailReturn = ease(age / 38);
      p.compression = 0.12 * u;
    } else if (pending?.ability === "calamity_slam") {
      const rise = ease(q / 0.63), drive = ease((q - 0.81) / 0.19);
      p.bodyY += -22 * rise + 25 * drive;
      p.neckY = -7 * rise + 10 * drive;
      p.headAngle = -0.22 * rise + 0.3 * drive;
      p.jaw += 0.2 * rise + 0.15 * drive;
      p.wing += 0.72 * rise - 0.88 * drive;
      p.coil = rise;
      p.compression = 0.18 * drive;
      p.heat = 0.48 * rise;
      p.pulse = Math.sin(Math.PI * clamp((q - 0.86) / 0.14));
    } else if (recent?.ability === "calamity_slam") {
      const u = 1 - ease(age / 42);
      p.bodyY += 3 * u;
      p.neckY = 3 * u;
      p.headAngle = 0.08 * u;
      p.jaw += 0.35 * u;
      p.wing -= 0.16 * u;
      p.coil = u;
      p.compression = 0.18 * u;
      p.heat = 0.48 * u;
    } else if (recent?.ability === "strike" && age < 20) {
      const u = 1 - ease(age / 20);
      p.neckX = -7 * u;
      p.headAngle = -0.08 * u;
      p.jaw += 0.32 * u;
      p.wing += 0.1 * u;
    }
    return p;
  }
  function idleTail(p, tick) {
    return [[18, -14, 14], [36, -11, 12.5], [54, -18, 10.2], [72, -32, 8], [89, -35, 6.1], [105, -26, 4.3], [116, -35, 2.4]].map(([x, y, r], i) => point2(x + Math.sin(tick * 0.045 - i * 0.67) * i * 0.6, y + Math.sin(tick * 0.075 - i * 0.62) * i * 0.7 - p.coil * Math.sin(i / 6 * Math.PI) * 14)).map((v, i) => ({ ...v, r: [14, 12.5, 10.2, 8, 6.1, 4.3, 2.4][i] }));
  }
  function tailNodes(actor2, p, tick) {
    const idle = idleTail(p, tick);
    if (p.ability !== "slam") return idle;
    const gathering = p.p ? ease(p.p / 0.61) : 1, drive = p.tailDrive * (1 - p.tailReturn), tip = idle.at(-1), cock = point2(53, -85), target = point2((p.target.x - actor2.position.x) / p.orientation - p.bodyX, p.target.y - actor2.position.y - p.bodyY - 2);
    const end = point2(mix(mix(tip.x, cock.x, gathering), target.x, drive), mix(mix(tip.y, cock.y, gathering), target.y, drive));
    const start2 = idle[0], control = point2(mix(95, target.x * 0.4, drive), mix(-60, -85, drive));
    return idle.map((v, i) => {
      const t = i / 6, u = 1 - t, curve = point2(u * u * start2.x + 2 * u * t * control.x + t * t * end.x, u * u * start2.y + 2 * u * t * control.y + t * t * end.y), weight = gathering * (1 - p.tailReturn);
      return { x: mix(v.x, curve.x, weight), y: mix(v.y, curve.y, weight), r: v.r };
    });
  }
  function smoothBoundary(c, nodes) {
    const sides = [];
    for (const s of [-1, 1]) {
      const out = [];
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[Math.max(0, i - 1)], b = nodes[Math.min(nodes.length - 1, i + 1)], d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        out.push([nodes[i].x - (b.y - a.y) / d * nodes[i].r * s, nodes[i].y + (b.x - a.x) / d * nodes[i].r * s]);
      }
      sides.push(out);
    }
    const points = [...sides[0], ...sides[1].reverse()];
    c.beginPath();
    c.moveTo((points[0][0] + points.at(-1)[0]) / 2, (points[0][1] + points.at(-1)[1]) / 2);
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      c.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    }
    c.closePath();
  }
  function tail(c, nodes, flash) {
    smoothBoundary(c, nodes);
    c.fillStyle = flash ? "#fff" : SCARLET;
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 1.4;
    c.stroke();
    if (!flash) {
      c.save();
      c.clip();
      for (let i = 1; i < nodes.length; i++) {
        const a = nodes[i - 1], b = nodes[i], angle2 = Math.atan2(b.y - a.y, b.x - a.x);
        c.save();
        c.translate(b.x, b.y);
        c.rotate(angle2);
        polygon(c, [[-6, -b.r], [2, -b.r], [-0.5, b.r], [-7, b.r]], i % 2 ? BLACK : "#3c1c29", false);
        line(c, [[-5, -b.r * 0.83], [-7, 0], [-5, b.r * 0.78]], RIDGE, 0.75);
        line(c, [[2, b.r * 0.56], [-2, b.r * 0.64]], BELLY, 0.7);
        c.restore();
      }
      c.restore();
    }
    for (let i = 1; i < nodes.length - 1; i++) {
      const a = nodes[i - 1], b = nodes[i], d = Math.hypot(b.x - a.x, b.y - a.y) || 1, n = point2((b.y - a.y) / d, -(b.x - a.x) / d);
      polygon(c, [[b.x + n.x * b.r, b.y + n.y * b.r], [b.x + n.x * (b.r + 5 - i * 0.45) - 3, b.y + n.y * (b.r + 5 - i * 0.45)], [b.x + n.x * b.r + 4, b.y + n.y * b.r + 1]], flash ? "#fff" : BLACK, true, 1);
    }
    const last = nodes.at(-1), prior = nodes.at(-2), angle = Math.atan2(last.y - prior.y, last.x - prior.x);
    c.save();
    c.translate(last.x, last.y);
    c.rotate(angle);
    c.beginPath();
    c.moveTo(-1, -2);
    c.quadraticCurveTo(13, -7, 15, -20);
    c.quadraticCurveTo(20, -7, 9, 3);
    c.lineTo(0, 3);
    c.closePath();
    c.fillStyle = flash ? "#fff" : HORN;
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 1.2;
    c.stroke();
    if (!flash) line(c, [[2, -1], [9, -4], [13, -12]], "#ffbb66", 0.8);
    c.restore();
  }
  function wing(c, p, flash, far = false) {
    c.save();
    c.translate(far ? 12 : 22, far ? -28 : -24);
    c.rotate((far ? -0.12 : 0.04) + p.wing * (far ? -0.48 : -0.72));
    c.scale(far ? 0.68 : 1, far ? 0.82 : 1);
    c.beginPath();
    c.moveTo(-6, 5);
    c.quadraticCurveTo(3, -29, 19, -44);
    c.lineTo(52, -60);
    c.quadraticCurveTo(35, -35, 34, -25);
    c.quadraticCurveTo(42, -33, 57, -32);
    c.quadraticCurveTo(43, -16, 41, -5);
    c.quadraticCurveTo(50, -13, 61, -6);
    c.quadraticCurveTo(44, 16, 27, 17);
    c.quadraticCurveTo(11, 2, -6, 5);
    c.closePath();
    c.fillStyle = flash ? "#fff" : far ? "#2b1723" : "#401b28";
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 1.45;
    c.stroke();
    if (!flash) {
      polygon(c, [[-4, 3], [18, -41], [36, -49], [22, -17], [27, 13], [11, 5]], far ? "#331b29" : "#5b2630", false);
      for (const end of [[51, -58], [55, -31], [58, -5], [28, 15]]) {
        c.beginPath();
        c.moveTo(-3, 3);
        c.quadraticCurveTo(16, -22, 19, -42);
        c.quadraticCurveTo(21, -25, end[0], end[1]);
        c.strokeStyle = far ? "#714037" : "#ad493e";
        c.lineWidth = 0.85;
        c.stroke();
      }
      line(c, [[2, -10], [18, -42], [43, -55]], far ? "#83523d" : "#dd7651", 0.9);
    }
    c.restore();
  }
  function head(c, p, flash) {
    const fill = (x) => flash ? "#fff" : x;
    c.save();
    c.translate(-15 + p.neckX, -31 + p.neckY);
    c.rotate(p.headAngle);
    c.beginPath();
    c.moveTo(6, -7);
    c.quadraticCurveTo(20, 0, 20, 17);
    c.quadraticCurveTo(5, 14, -4, 3);
    c.closePath();
    c.fillStyle = fill(BELLY);
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 1.2;
    c.stroke();
    if (!flash) {
      for (let i = 0; i < 4; i++) line(c, [[4 + i * 3, 3 + i * 2], [12 + i * 2, 2 + i * 3]], "#632b30", 0.8);
      if (p.heat > 0) {
        glow(c, 5, 3, 17, `rgba(255,84,24,${0.22 + 0.4 * p.heat})`);
        line(c, [[4, 0], [8, 3], [11, 8]], p.pulse > 0.35 ? PALE : "#fa8d3b", 1 + p.heat);
      }
    }
    c.save();
    c.translate(-2, 1);
    c.rotate(-p.jaw);
    polygon(c, [[-31, 0], [-28, 6], [-11, 11], [6, 7], [8, -1]], fill("#7e3435"));
    if (!flash) polygon(c, [[-27, 2], [-16, 3], [-10, 8], [-22, 6]], "#c56645", false);
    polygon(c, [[-24, 1], [-21, -4], [-18, 2]], fill(PALE), true, 0.7);
    polygon(c, [[-11, 3], [-8, -1], [-6, 4]], fill("#e5bd85"), true, 0.7);
    c.restore();
    if (!flash && p.heat > 0) {
      glow(c, -23, 2, 13 + p.pulse * 7, `rgba(255,109,32,${p.heat * 0.5 + p.pulse * 0.4})`);
      ellipse(c, -21, 2, 8 * p.heat, 2.5 + p.heat, "#ee552b");
      ellipse(c, -23, 1, 4 * p.heat, 1.4, p.pulse > 0.2 ? PALE : "#ffbc5e");
    }
    polygon(c, [[-11, -21], [-27, -16], [-34, -9], [-39, -2], [-33, 2], [-14, 1], [2, -2], [9, -13], [5, -23], [-2, -28]], fill(BLACK));
    if (!flash) {
      polygon(c, [[-28, -15], [-11, -21], [3, -23], [-3, -13], [-21, -9], [-35, -3]], "#4d2631", false);
      polygon(c, [[3, -13], [8, -13], [2, -2], [-15, 1], [-8, -6]], "#35202a", false);
      line(c, [[-32, -9], [-22, -13], [-13, -13]], "#875148", 0.8);
    }
    polygon(c, [[-32, 2], [-29, 6], [-27, 1]], fill(PALE), true, 0.7);
    polygon(c, [[-19, 1], [-16, 5], [-14, 1]], fill("#d9b18a"), true, 0.7);
    polygon(c, [[-4, -24], [2, -40], [15, -48], [10, -33], [5, -19]], fill(HORN));
    if (!flash) polygon(c, [[0, -28], [7, -38], [13, -45], [8, -31], [5, -25]], "#efaa59", false);
    polygon(c, [[-17, -20], [-17, -32], [-9, -22]], fill("#30212c"));
    ellipse(c, -15, -11, 5.7, 4.1, fill("#ad292c"), true, 1);
    if (!flash) {
      ellipse(c, -16, -11.2, 4.4, 2.8, "#ff5d3d");
      ellipse(c, -17.3, -11.1, 1.1, 2.7, "#ffd877");
      ellipse(c, -18, -12.3, 0.75, 0.65, "#fff1c5");
      line(c, [[-21, -15], [-15, -17], [-9, -14]], "#0b0a12", 1.3);
      ellipse(c, -34, -4, 0.85, 0.75, "#09080f");
    }
    c.restore();
  }
  function torso(c, p, flash) {
    c.save();
    c.translate(0, p.compression * 5);
    c.scale(1 + p.compression * 0.5, 1 - p.compression);
    c.beginPath();
    c.moveTo(-13, -34);
    c.quadraticCurveTo(11, -46, 29, -26);
    c.quadraticCurveTo(38, -8, 21, 1);
    c.quadraticCurveTo(2, 6, -15, -8);
    c.quadraticCurveTo(-23, -22, -13, -34);
    c.closePath();
    c.fillStyle = flash ? "#fff" : SCARLET;
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 1.4;
    c.stroke();
    if (!flash) {
      c.save();
      c.clip();
      polygon(c, [[-12, -32], [3, -39], [19, -30], [9, -20], [-12, -15]], "#9c3c3e", false);
      polygon(c, [[-11, -14], [8, -10], [28, -15], [25, 0], [7, 4], [-14, -7]], BELLY, false);
      for (let i = 0; i < 4; i++) line(c, [[-10 + i * 7, -11], [-7 + i * 7, -3]], "#642c32", 0.8);
      polygon(c, [[17, -34], [29, -25], [34, -10], [23, -6], [16, -18]], "#321923", false);
      c.restore();
      line(c, [[-10, -30], [-1, -34], [6, -31]], "#ca6853", 0.9);
    }
    for (const [x, y, r] of [[2, -39, 9], [15, -35, 7], [25, -27, 6]]) polygon(c, [[x - 4, y + 4], [x, y - r], [x + 4, y + 2]], flash ? "#fff" : BLACK, true, 1.1);
    c.restore();
  }
  function drawHooktail(c, actor2, tick, flash = false) {
    if (actor2.boss?.bossDefinitionId !== ID) return false;
    const p = hooktailAttackPose(actor2, tick), death = actor2.alive === false ? ease((actor2.deathAge ?? 0) / 42) : 0;
    c.save();
    c.translate(actor2.position.x, actor2.position.y);
    c.lineCap = "round";
    c.lineJoin = "round";
    c.globalAlpha *= 1 - death;
    ellipse(c, -p.facing * 38, 5, 66, 9, "#08080d55");
    c.scale(p.orientation, 1);
    c.translate(p.bodyX, p.bodyY + death * 16);
    wing(c, p, flash, true);
    tail(c, tailNodes(actor2, p, tick), flash);
    torso(c, p, flash);
    wing(c, p, flash);
    head(c, p, flash);
    if (!flash && actor2.alive !== false) {
      for (let i = 0; i < 4; i++) {
        const a = (tick + i * 17) % 83 / 83, x = 42 + i * 17 + Math.sin(a * 5 + i) * 3, y = -19 - i * 2 - a * 19;
        c.save();
        c.globalAlpha *= Math.sin(a * Math.PI) * 0.22;
        c.beginPath();
        c.moveTo(x, y);
        c.quadraticCurveTo(x - 3 - a * 4, y - 4, x + a * 3, y - 7 - a * 6);
        c.strokeStyle = i % 2 ? "#b74b39" : "#878091";
        c.lineWidth = 1 + a * 0.8;
        c.stroke();
        c.restore();
      }
    }
    c.restore();
    return true;
  }
  function mouth(actor2, p) {
    const q = rotate(-35, 5 + p.jaw * 7, p.headAngle);
    return point2(actor2.position.x + (p.bodyX - 15 + p.neckX + q.x) * p.orientation, actor2.position.y + p.bodyY - 31 + p.neckY + q.y);
  }
  function ringWarning(c, row, tick) {
    const ring = row.ring;
    if (!ring) return;
    const q = progress(row, tick), pulse = 0.7 + 0.3 * Math.sin(tick * 0.4);
    c.save();
    for (const tile of ring.tiles ?? []) {
      const seed = (tile.column * 71 + tile.row * 97) % 19, x = tile.x, y = tile.y, s2 = tile.size ?? ring.tileSize;
      c.fillStyle = `rgba(170,45,37,${0.035 + 0.09 * q})`;
      c.fillRect(x + 0.5, y + 0.5, s2 - 1, s2 - 1);
      const reach = ease((q - seed * 0.011) / 0.66), a = [[x + s2 * 0.08, y + s2 * 0.24], [x + s2 * 0.36, y + s2 * 0.48], [x + s2 * 0.52, y + s2 * 0.33], [x + s2 * 0.67, y + s2 * 0.68], [x + s2 * 0.94, y + s2 * 0.82]];
      const end = Math.max(1, Math.floor(reach * 4));
      path(c, a.slice(0, end + 1));
      c.strokeStyle = INK;
      c.lineWidth = 2.8;
      c.stroke();
      c.strokeStyle = q > 0.82 ? "#ffd097" : "#b94a3e";
      c.lineWidth = 0.65 + q * 0.35;
      c.stroke();
      if (q > 0.45) {
        c.globalAlpha = (0.2 + 0.6 * q) * pulse;
        line(c, [[x + s2 * 0.37, y + s2 * 0.48], [x + s2 * 0.28, y + s2 * 0.79]], FIRE, 0.6);
        c.globalAlpha = 1;
      }
    }
    const s = ring.tileSize, l = ring.minColumn * s, t = ring.minRow * s, r = (ring.maxColumn + 1) * s, b = (ring.maxRow + 1) * s;
    c.strokeStyle = "#e06c4b";
    c.lineWidth = 0.9;
    c.strokeRect(l + 0.4, t + 0.4, r - l - 0.8, b - t - 0.8);
    c.strokeRect(l + s - 0.4, t + s - 0.4, r - l - 2 * s + 0.8, b - t - 2 * s + 0.8);
    c.restore();
  }
  function collapsedRing(c, row, tick) {
    const ring = row.ring;
    if (!ring) return;
    const age = tick - row.createdTick;
    if (age < 0) return;
    c.save();
    for (const tile of ring.tiles ?? []) {
      const s2 = tile.size ?? ring.tileSize, x = tile.x, y = tile.y, seed = (tile.column * 71 + tile.row * 97) % 19;
      c.fillStyle = "#070810";
      c.fillRect(x - 0.2, y - 0.2, s2 + 0.4, s2 + 0.4);
      c.save();
      c.beginPath();
      c.rect(x, y, s2, s2);
      c.clip();
      const hot = 1 - ease(age / 44);
      if (hot > 0) {
        glow(c, x + s2 / 2, y + s2 * 0.6, s2 * 0.8, `rgba(191,42,35,${hot * 0.18})`);
      }
      const local3 = Math.max(0, age - seed % 6), u = clamp(local3 / 27), fall = ease(u), drop = (u * 0.45 + u * u * 0.85) * s2, shrink = 1 - fall * 0.34;
      if (fall < 1) {
        c.save();
        c.translate(x + s2 * 0.5, y + s2 * 0.5 + drop);
        c.scale((seed % 2 ? -1 : 1) * shrink, shrink);
        c.globalAlpha *= 1 - ease((fall - 0.52) / 0.48);
        const h = s2 * 0.44, split = (seed % 5 - 2) * 1.4;
        c.save();
        c.translate(-0.65 - fall * (3 + seed % 3), -fall * 2);
        c.rotate(-fall * (0.14 + seed % 3 * 0.035));
        polygon(c, [[-h, -h], [h, -h], [split + 3, -3], [split - 4, 4], [-h, h]], seed % 3 ? "#393340" : "#473a45", true, 1);
        line(c, [[-h + 2, -h + 2], [h - 3, -h + 2]], "#6a535d", 0.85);
        c.restore();
        c.save();
        c.translate(0.65 + fall * 4, fall * (7 + seed % 4));
        c.rotate(fall * (0.17 + seed % 3 * 0.04));
        polygon(c, [[h, -h + 2], [h, h], [-h + 2, h], [split - 3, 5], [split + 5, -1]], seed % 3 ? "#282636" : "#34303e", true, 1);
        line(c, [[h - 2, -h + 4], [h - 2, h - 3]], "#69505d", 0.85);
        c.restore();
        c.save();
        c.translate(split - fall * 5, 3 + fall * 20);
        c.rotate(fall * 1.8 + seed);
        polygon(c, [[-3, -3], [3, -2], [4, 1], [-1, 4]], "#78606a", true, 0.6);
        c.restore();
        c.restore();
      }
      for (let i = 0; i < 3; i++) {
        const u2 = ((tick * 0.011 + seed * 0.07 + i * 0.31) % 1 + 1) % 1;
        c.save();
        c.globalAlpha *= (0.12 + hot * 0.5) * Math.sin(Math.PI * u2);
        ellipse(c, x + 4 + (seed * 7 + i * 11) % (s2 - 8), y + s2 - 4 - u2 * s2, hot ? 1.2 : 0.65, hot ? 1.4 : 0.9, i % 2 ? "#8d4c75" : "#ce503c");
        c.restore();
      }
      c.restore();
    }
    const s = ring.tileSize, l = ring.minColumn * s, t = ring.minRow * s, r = (ring.maxColumn + 1) * s, b = (ring.maxRow + 1) * s;
    c.strokeStyle = age < 24 ? "#e48157" : "#663b53";
    c.lineWidth = age < 24 ? 1.4 : 0.9;
    c.strokeRect(l + s - 0.2, t + s - 0.2, r - l - 2 * s + 0.4, b - t - 2 * s + 0.4);
    c.restore();
  }
  function fireWarning(c, row, tick) {
    const q = progress(row, tick), p = row.originPosition, r = row.range ?? 110, a = row.facing < 0 ? Math.PI : 0, h = row.halfAngle ?? 0.8;
    c.save();
    c.translate(p.x, p.y);
    c.rotate(a);
    c.beginPath();
    c.moveTo(0, 0);
    c.arc(0, 0, r, -h, h);
    c.closePath();
    c.fillStyle = `rgba(227,67,34,${0.025 + 0.04 * q})`;
    c.fill();
    c.strokeStyle = "#aa463755";
    c.lineWidth = 0.6;
    c.stroke();
    c.beginPath();
    c.arc(0, 0, r, -h, h);
    c.strokeStyle = q > 0.83 ? "#ffc084" : "#d26346";
    c.lineWidth = 0.8;
    c.stroke();
    for (const s of [-1, 1]) line(c, [[Math.cos(s * h) * r * 0.76, Math.sin(s * h) * r * 0.76], [Math.cos(s * h) * r, Math.sin(s * h) * r]], "#d46d4f", 0.8);
    c.restore();
  }
  function slamWarning(c, row, tick) {
    const p = row.targetPosition, r = row.radius ?? 64, q = progress(row, tick);
    c.save();
    ellipse(c, p.x, p.y, r, r, "#a82f2a12");
    circle(c, p.x, p.y, r, INK, 2.8);
    circle(c, p.x, p.y, r, "#db7252", 1.1);
    c.beginPath();
    c.arc(p.x, p.y, r - 3, -Math.PI / 2, -Math.PI / 2 + TAU * q);
    c.strokeStyle = PALE;
    c.lineWidth = 1.2;
    c.stroke();
    for (let i = 0; i < 5; i++) {
      const a = i * TAU / 5 + 0.3, reach = (5 + 15 * ease(q)) * q;
      line(c, [[p.x + Math.cos(a) * 4, p.y + Math.sin(a) * 4], [p.x + Math.cos(a + 0.12) * reach, p.y + Math.sin(a + 0.12) * reach]], q > 0.85 ? "#ffd6a0" : "#813d37", 0.8);
    }
    c.restore();
  }
  function slamGround(c, row, tick) {
    const age = tick - row.resolvedTick;
    if (age < 0 || age >= 42) return;
    const p = row.targetPosition, r = row.radius ?? 64, u = ease(age / 16), fade = 1 - ease(age / 42);
    c.save();
    c.globalAlpha *= fade;
    ellipse(c, p.x, p.y, r, r, "#0e101d50");
    if (age < 12) {
      ellipse(c, p.x, p.y, r, r, `rgba(234,104,56,${(1 - ease(age / 12)) * 0.16})`);
      circle(c, p.x, p.y, r, "#f9c08b", 1.4 * (1 - ease(age / 12)) + 0.2);
    }
    for (let i = 0; i < 9; i++) {
      const a = i * TAU / 9 + 0.15, rr = r * (0.45 + i % 3 * 0.16) * (0.82 + 0.18 * u), points = [[p.x, p.y], [p.x + Math.cos(a + 0.09) * rr * 0.38, p.y + Math.sin(a + 0.09) * rr * 0.38], [p.x + Math.cos(a - 0.07) * rr * 0.68, p.y + Math.sin(a - 0.07) * rr * 0.68], [p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr]];
      line(c, points, INK, 3);
      line(c, points, age < 18 ? "#cf633d" : "#513e46", 1);
    }
    if (age < 22) circle(c, p.x, p.y, r * (0.12 + 0.88 * u), "#c67e5a", 1.3 * (1 - ease(age / 22)) + 0.1);
    c.restore();
  }
  function drawHooktailGround(c, model2, tick) {
    const h = model2.bossHazards ?? {};
    c.save();
    for (const row of h.hooktailCollapsedRings ?? []) collapsedRing(c, row, tick);
    for (const row of h.hooktailTelegraphs ?? []) {
      if (tick < row.startedTick || tick > row.resolvesTick) continue;
      if (row.ability === "slam") slamWarning(c, row, tick);
      else if (row.ability === "scarlet_fire") fireWarning(c, row, tick);
      else if (row.ability === "calamity_slam") ringWarning(c, row, tick);
    }
    for (const row of h.hooktailImpacts ?? []) if (row.ability === "slam") slamGround(c, row, tick);
    for (const actor2 of Object.values(model2.entitiesById ?? {})) {
      if (actor2.boss?.bossDefinitionId !== ID) continue;
      const age = tick - (actor2.boss.phaseStartedTick ?? -1e3);
      if (age >= 0 && age < 32) {
        c.save();
        c.globalAlpha *= 1 - ease(age / 32);
        circle(c, actor2.position.x, actor2.position.y, 24 + 72 * ease(age / 32), "#ce5142", 1.5);
        c.restore();
      }
    }
    c.restore();
  }
  function fireBurst(c, row, tick, model2) {
    const age = tick - row.resolvedTick;
    if (age < 0 || age >= 30) return;
    const actor2 = model2.entitiesById?.[row.sourceEntityId], caster = actor2 ? { ...actor2, alive: true, position: row.originPosition, boss: { ...actor2.boss, pendingAction: null, lastAction: row } } : { position: row.originPosition, boss: { lastAction: row, facing: row.facing } }, pose = hooktailAttackPose(caster, row.resolvedTick), from = mouth(caster, pose), sign = row.facing < 0 ? -1 : 1, range = row.range ?? 110, half = row.halfAngle ?? 0.8, outer = point2(row.originPosition.x + sign * range, row.originPosition.y - 13), width = range * Math.sin(half), fade = 1 - ease((age - 6) / 24), burn = 1 - ease(age / 15);
    c.save();
    c.translate(from.x, from.y);
    c.scale(sign, 1);
    const length = (outer.x - from.x) * sign, dy = outer.y - from.y;
    c.globalAlpha = fade * 0.35;
    glow(c, length * 0.54, dy * 0.54, width * 0.86, "#ed4b3180");
    for (let i = -3; i <= 3; i++) {
      const offset = i / 3 * width * 0.77, reach = length * (0.83 + 0.15 * (1 - Math.abs(i) / 3)) + Math.sin(age * 0.58 + i * 1.7) * 3, endY = dy + offset, w = (12 + 4 * (1 - Math.abs(i) / 3)) * (0.84 + 0.16 * burn), curl = Math.sin(age * 0.34 + i * 2.1) * 4;
      for (let layer = 0; layer < 3; layer++) {
        const k = [1.35, 0.94, 0.44][layer], l = reach * [1, 0.96, 0.8][layer], ey = endY * [1, 0.97, 0.89][layer], thick = w * k;
        c.beginPath();
        c.moveTo(0, -1.5 - layer);
        c.bezierCurveTo(l * 0.24, ey * 0.17 - thick * 0.25, l * 0.5, ey * 0.48 - thick * 1.05, l * 0.66, ey * 0.67 - thick * 0.82);
        c.quadraticCurveTo(l * 0.79, ey - thick * 1.24, l * 0.88, ey - thick * 0.42 + curl);
        c.quadraticCurveTo(l * 0.94, ey - thick * 0.02, l * 1.04, ey - thick * 0.52);
        c.quadraticCurveTo(l * 0.96, ey + thick * 0.68 + curl, l * 0.78, ey + thick * 0.44);
        c.quadraticCurveTo(l * 0.62, ey * 0.82 + thick * 1.12, l * 0.49, ey * 0.52 + thick * 0.49);
        c.bezierCurveTo(l * 0.34, ey * 0.31 + thick * 0.27, l * 0.12, 3.1, 0, 2);
        c.closePath();
        c.globalAlpha = fade * [0.64, 0.82, 0.85][layer];
        c.fillStyle = ["#d9452f", "#ff963d", "#ffe9a5"][layer];
        c.fill();
      }
    }
    c.globalAlpha = fade * 0.8;
    glow(c, 0, 0, 15 + 8 * burn, "#ffd070aa");
    for (let i = 0; i < 14; i++) {
      const t = (age * 0.049 + i * 0.077) % 1, a = (i % 7 - 3) / 3, px = length * t, py = dy * t + a * width * t * 0.77 + Math.sin(t * 9 + i) * 4;
      c.beginPath();
      c.moveTo(px - 5, py);
      c.quadraticCurveTo(px, py - 2, px + 4, py + a * 2);
      c.strokeStyle = i % 3 ? "#ffd475" : "#fff3c8";
      c.lineWidth = 0.8;
      c.stroke();
    }
    c.restore();
  }
  function impactDebris(c, row, tick) {
    const age = tick - row.resolvedTick;
    if (age < 0 || age >= 34) return;
    const p = row.targetPosition, seed = hash(row.id ?? row.sequence), q = age / 34;
    c.save();
    c.globalAlpha *= 1 - ease((q - 0.55) / 0.45);
    for (let i = 0; i < 13; i++) {
      const a = i * 2.39996 + seed % 13, r = 12 + age * (0.7 + i % 3 * 0.17), x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r * 0.6 - Math.sin(q * Math.PI) * (10 + i % 4 * 6), s = 1.5 + i % 3 * 0.55;
      c.save();
      c.translate(x, y);
      c.rotate(i + q * 3);
      polygon(c, [[-s, -s], [s * 0.7, -s * 0.6], [s, s * 0.5], [-s * 0.5, s]], i % 2 ? "#5b4650" : "#8d5e4e", true, 0.65);
      c.restore();
    }
    c.restore();
  }
  function hooktailDepthItems(model2, tick, viewport = null) {
    const h = model2.bossHazards ?? {}, items = [], visible = (p, r) => !viewport || p.x + r >= (viewport.x ?? viewport.left ?? -Infinity) && p.x - r <= (viewport.right ?? (viewport.x ?? 0) + (viewport.width ?? Infinity)) && p.y + r >= (viewport.y ?? viewport.top ?? -Infinity) && p.y - r <= (viewport.bottom ?? (viewport.y ?? 0) + (viewport.height ?? Infinity));
    const add = (id, p, r, draw) => {
      if (visible(p, r)) items.push(Object.freeze({ id: "hooktail-vfx/" + id, anchorX: p.x, anchorY: p.y + 1, draw }));
    };
    for (const row of h.hooktailImpacts ?? []) {
      const age = tick - row.resolvedTick;
      if (age < 0 || age >= 42) continue;
      const id = row.id ?? row.bossId + "/" + row.sequence;
      if (row.ability === "scarlet_fire") add(id + "/fire", row.originPosition, 160, (c) => fireBurst(c, row, tick, model2));
      else if (row.ability === "slam") add(id + "/debris", row.targetPosition, 90, (c) => impactDebris(c, row, tick));
      else if (row.ability === "strike" && age < 12) add(id + "/bite", row.targetPosition, 26, (c) => {
        c.save();
        c.globalAlpha *= 1 - ease(age / 12);
        for (const s of [-1, 1]) line(c, [[row.targetPosition.x - 4, row.targetPosition.y - 12 + s * 3], [row.targetPosition.x + 5, row.targetPosition.y - 12 + s * 8]], "#ffb06b", 1.2);
        c.restore();
      });
    }
    return items;
  }

export {hooktailAttackPose,drawHooktail,drawHooktailGround,hooktailDepthItems};