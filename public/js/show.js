import { CRACKERS } from "./catalog.js";
import { makeItem } from "./items.js";

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/** Every cracker throws this many times the sparks and light of the base design. */
const BOOST = 5;

/**
 * The night sky, the street, and everything burning on it.
 * One Show per canvas. The play page and the landing preview both use it.
 */
export class Show {
  constructor(canvas, sound, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.sound = sound;
    this.demo = !!opts.demo;
    this.bottomInset = opts.bottomInset || 0;
    this.onFire = opts.onFire || (() => {});
    this.gentle = opts.gentle ?? window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.particles = [];
    this.pool = [];
    this.items = [];
    this.lights = [];
    this.shake = 0;
    this.time = 0;
    this.wind = rand(-14, 18);
    this.sprites = {};
    this.glowCache = new Map();
    this.running = true;
    this.loadSprites();
    this.makeSmokeSprite();
    this.resize();
    new ResizeObserver(() => this.resize()).observe(canvas);
    document.addEventListener("visibilitychange", () => {
      this.last = performance.now();
    });
    this.last = performance.now();
    requestAnimationFrame((t) => this.frame(t));
  }

  // ---------- setup ----------

  loadSprites() {
    for (const c of CRACKERS) {
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement("canvas");
        cv.width = 240;
        cv.height = 280;
        cv.getContext("2d").drawImage(img, 0, 0, 240, 280);
        this.sprites[c.id] = cv;
      };
      img.src = `/crackers/${c.id}.svg`;
    }
  }

  makeSmokeSprite() {
    const s = 128;
    const cv = document.createElement("canvas");
    cv.width = cv.height = s;
    const g = cv.getContext("2d");
    for (let i = 0; i < 14; i++) {
      const x = rand(s * 0.3, s * 0.7);
      const y = rand(s * 0.3, s * 0.7);
      const r = rand(s * 0.18, s * 0.34);
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, "rgba(200,200,210,0.22)");
      grad.addColorStop(1, "rgba(200,200,210,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, s, s);
    }
    this.smokeSprite = cv;
  }

  glow(hue, sat = 100) {
    const key = `${Math.round(hue / 15) * 15}:${sat}`;
    let cv = this.glowCache.get(key);
    if (!cv) {
      cv = document.createElement("canvas");
      cv.width = cv.height = 128;
      const g = cv.getContext("2d");
      const h = Math.round(hue / 15) * 15;
      const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, `hsla(${h},${sat}%,92%,1)`);
      grad.addColorStop(0.18, `hsla(${h},${sat}%,70%,0.55)`);
      grad.addColorStop(0.5, `hsla(${h},${sat}%,50%,0.16)`);
      grad.addColorStop(1, `hsla(${h},${sat}%,40%,0)`);
      g.fillStyle = grad;
      g.fillRect(0, 0, 128, 128);
      this.glowCache.set(key, cv);
    }
    return cv;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.max(320, this.canvas.clientWidth);
    const H = Math.max(240, this.canvas.clientHeight);
    if (W === this.W && H === this.H) return;
    this.W = W;
    this.H = H;
    this.dpr = dpr;
    this.canvas.width = Math.round(W * dpr);
    this.canvas.height = Math.round(H * dpr);
    this.unit = clamp(Math.min(H / 820, W / 700), 0.45, 1.4);
    this.groundY = Math.round(H * 0.66);
    // ponytail: fixed cap; slow GPUs drop frames near it. Upgrade path: adapt the cap to measured frame time.
    this.maxParticles = (W * H < 500000 ? 2600 : 5200) * BOOST;
    this.buildBackground();
    const old = this.litter;
    this.litter = document.createElement("canvas");
    this.litter.width = this.canvas.width;
    this.litter.height = this.canvas.height;
    if (old) this.litter.getContext("2d").drawImage(old, 0, 0, this.litter.width, this.litter.height);
  }

  buildBackground() {
    const { W, H, dpr, groundY: gy } = this;
    const cv = document.createElement("canvas");
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    const g = cv.getContext("2d");
    g.scale(dpr, dpr);

    // Amavasya: Diwali falls on the new moon, so there is no moon in this sky.
    const sky = g.createLinearGradient(0, 0, 0, gy);
    sky.addColorStop(0, "#03040c");
    sky.addColorStop(0.55, "#0a0d26");
    sky.addColorStop(0.85, "#24163a");
    sky.addColorStop(1, "#4a2630");
    g.fillStyle = sky;
    g.fillRect(0, 0, W, gy);

    this.stars = [];
    for (let i = 0; i < (W * gy) / 5000; i++) {
      this.stars.push({ x: rand(0, W), y: rand(0, gy * 0.75), r: rand(0.3, 1.2), p: rand(0, TAU), a: rand(0.25, 0.9) });
    }

    // Far skyline
    let x = -10;
    g.fillStyle = "#0e1028";
    const far = [];
    while (x < W + 10) {
      const w = rand(30, 80) * this.unit;
      const h = rand(0.06, 0.16) * H;
      far.push({ x, w, h });
      g.fillRect(x, gy - h, w + 1, h);
      x += w;
    }
    this.windows(g, far, "#0e1028", 0.18);

    // Near skyline with rooftop string lights
    x = -20;
    const near = [];
    this.chains = [];
    while (x < W + 20) {
      const w = rand(70, 150) * this.unit;
      const h = rand(0.1, 0.22) * H;
      near.push({ x, w, h });
      x += w + rand(4, 30) * this.unit;
    }
    g.fillStyle = "#070818";
    for (const b of near) {
      g.fillRect(b.x, gy - b.h, b.w, b.h);
      g.fillRect(b.x + b.w * 0.1, gy - b.h - 4 * this.unit, b.w * 0.8, 4 * this.unit);
      if (Math.random() < 0.3) {
        const tw2 = 18 * this.unit;
        g.fillRect(b.x + b.w * 0.6, gy - b.h - 20 * this.unit, tw2, 16 * this.unit);
      }
      if (Math.random() < 0.75) {
        const palette = [[45, 100], [0, 90], [130, 80], [210, 90], [300, 80]];
        const [hue, sat] = palette[(Math.random() * palette.length) | 0];
        const drop = rand(4, 10) * this.unit;
        const count = Math.floor(b.w / (7 * this.unit));
        for (let i = 0; i <= count; i++) {
          const k = i / count;
          this.chains.push({
            x: b.x + k * b.w,
            y: gy - b.h + Math.sin(k * Math.PI) * drop + 2,
            hue: Math.random() < 0.15 ? (hue + 120) % 360 : hue,
            sat,
            p: rand(0, TAU),
            sp: rand(1.5, 4),
          });
        }
      }
    }
    this.windows(g, near, "#070818", 0.28);

    this.temple(g, W * 0.3, gy, H * 0.3, 52 * this.unit);

    // Street
    const ground = g.createLinearGradient(0, gy, 0, H);
    ground.addColorStop(0, "#241a1c");
    ground.addColorStop(0.25, "#17111a");
    ground.addColorStop(1, "#0b0809");
    g.fillStyle = ground;
    g.fillRect(0, gy, W, H - gy);
    for (let i = 0; i < (W * (H - gy)) / 120; i++) {
      g.fillStyle = `rgba(255,255,255,${rand(0.01, 0.05)})`;
      g.fillRect(rand(0, W), rand(gy, H), rand(0.5, 1.5), rand(0.5, 1.5));
    }

    // Diyas along the far edge of the street
    this.diyas = [];
    const step = 46 * this.unit;
    for (let dx = step / 2; dx < W; dx += step) {
      this.diyas.push({ x: dx + rand(-6, 6), y: gy + 3, p: rand(0, TAU) });
    }
    for (const d of this.diyas) {
      g.fillStyle = "#8a3b12";
      g.beginPath();
      g.ellipse(d.x, d.y, 6 * this.unit, 2.6 * this.unit, 0, 0, Math.PI);
      g.fill();
      g.fillStyle = "#b5541c";
      g.fillRect(d.x - 6 * this.unit, d.y - 1, 12 * this.unit, 1.5);
    }

    // Rangoli near the doorstep, flattened by perspective
    const rx = W * 0.84;
    const ry = gy + (H - gy) * 0.3;
    const R = 60 * this.unit;
    const colors = ["#e63946", "#ffd166", "#2a9d8f", "#f77f00", "#9b5de5", "#ffffff"];
    g.save();
    g.translate(rx, ry);
    g.scale(1, 0.32);
    g.globalAlpha = 0.75;
    for (let ring = 5; ring >= 1; ring--) {
      const rr = (R * ring) / 5;
      g.fillStyle = colors[ring % colors.length];
      const petals = 8 + ring * 2;
      g.beginPath();
      for (let i = 0; i <= petals * 2; i++) {
        const a = (i / (petals * 2)) * TAU;
        const r2 = i % 2 === 0 ? rr : rr * 0.78;
        g.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      }
      g.fill();
    }
    g.fillStyle = "#ffd166";
    g.beginPath();
    g.arc(0, 0, R * 0.12, 0, TAU);
    g.fill();
    g.restore();

    this.bg = cv;
  }

  /** A nagara temple: mandapa, curvilinear shikhara with bands, amalaka, kalash, flag. */
  temple(g, tx, gy, th, tw) {
    const u = this.unit;
    const fill = "#0a0b20";
    const band = "#16183c";
    this.chains = this.chains.filter((c) => c.x < tx - tw * 2.1 || c.x > tx + tw * 1.4);

    const tower = (cx, w, h, base) => {
      g.beginPath();
      g.moveTo(cx - w * 0.92, base);
      g.bezierCurveTo(cx - w * 0.92, base - h * 0.45, cx - w * 0.6, base - h * 0.85, cx - w * 0.32, base - h);
      g.lineTo(cx + w * 0.32, base - h);
      g.bezierCurveTo(cx + w * 0.6, base - h * 0.85, cx + w * 0.92, base - h * 0.45, cx + w * 0.92, base);
      g.closePath();
    };
    const bands = (cx, w, h, base) => {
      g.save();
      tower(cx, w, h, base);
      g.clip();
      g.strokeStyle = band;
      g.lineWidth = 1.6 * u;
      for (let y = base - h * 0.06; y > base - h; y -= h * 0.075) {
        g.beginPath();
        g.moveTo(cx - w, y);
        g.lineTo(cx + w, y);
        g.stroke();
      }
      g.beginPath();
      g.moveTo(cx, base);
      g.lineTo(cx, base - h);
      g.stroke();
      g.restore();
    };

    g.fillStyle = fill;
    g.fillRect(tx - tw * 2.1, gy - 10 * u, tw * 3.5, 10 * u);
    g.fillRect(tx - tw * 1.95, gy - 14 * u, tw * 3.2, 4 * u);

    // Mandapa with a stepped pyramid roof
    const mx = tx - tw * 1.35;
    const mw = tw * 0.6;
    const wallTop = gy - 14 * u - th * 0.2;
    g.fillRect(mx - mw, wallTop, mw * 2, th * 0.2);
    for (let i = 0; i < 4; i++) {
      const w = mw * (1.1 - i * 0.24);
      const y = wallTop - i * th * 0.045;
      g.fillRect(mx - w, y - th * 0.045, w * 2, th * 0.045);
    }
    g.beginPath();
    g.arc(mx, wallTop - th * 0.19, 5 * u, 0, TAU);
    g.fill();

    // Side shikharas and the main tower
    const base = gy - 14 * u - th * 0.18;
    g.fillRect(tx - tw, base, tw * 2, th * 0.18 + 1);
    for (const side of [-1, 1]) {
      g.fillStyle = fill;
      tower(tx + side * tw * 0.62, tw * 0.5, th * 0.38, base);
      g.fill();
      bands(tx + side * tw * 0.62, tw * 0.5, th * 0.38, base);
    }
    g.fillStyle = fill;
    tower(tx, tw, th * 0.62, base);
    g.fill();
    bands(tx, tw, th * 0.62, base);

    const top = base - th * 0.62;
    g.fillStyle = fill;
    g.beginPath();
    g.ellipse(tx, top - 3 * u, tw * 0.4, 5 * u, 0, 0, TAU);
    g.fill();
    g.strokeStyle = band;
    g.lineWidth = 1;
    for (let i = -3; i <= 3; i++) {
      g.beginPath();
      g.moveTo(tx + i * tw * 0.1, top - 7 * u);
      g.lineTo(tx + i * tw * 0.1, top + 1 * u);
      g.stroke();
    }
    g.fillStyle = fill;
    g.beginPath();
    g.arc(tx, top - 12 * u, 5 * u, 0, TAU);
    g.fill();
    g.beginPath();
    g.moveTo(tx - 2 * u, top - 16 * u);
    g.lineTo(tx, top - 24 * u);
    g.lineTo(tx + 2 * u, top - 16 * u);
    g.fill();
    g.fillRect(tx + 4 * u, top - 46 * u, 1.6 * u, 36 * u);
    g.fillStyle = "#e85d04";
    g.beginPath();
    g.moveTo(tx + 5.6 * u, top - 46 * u);
    g.quadraticCurveTo(tx + 18 * u, top - 44 * u, tx + 28 * u, top - 38 * u);
    g.lineTo(tx + 5.6 * u, top - 32 * u);
    g.fill();

    // Lamps along the plinth and the mandapa roof
    for (let x2 = tx - tw * 2; x2 <= tx + tw * 1.35; x2 += 9 * u) {
      this.chains.push({ x: x2, y: gy - 12 * u, hue: 40, sat: 100, p: rand(0, TAU), sp: rand(0.8, 1.6) });
    }
    for (let i = 0; i <= 8; i++) {
      const k = i / 8;
      this.chains.push({ x: mx - mw * 1.1 + k * mw * 2.2, y: wallTop, hue: 40, sat: 100, p: rand(0, TAU), sp: 1.2 });
    }
  }

  windows(g, blocks, base, chance) {
    for (const b of blocks) {
      const cols = Math.max(1, Math.floor(b.w / (12 * this.unit)));
      const rows = Math.max(1, Math.floor(b.h / (14 * this.unit)));
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          if (Math.random() > chance) continue;
          const warm = Math.random() < 0.8;
          g.fillStyle = warm ? `rgba(255,${rand(170, 210) | 0},110,${rand(0.35, 0.8)})` : `rgba(170,200,255,${rand(0.2, 0.5)})`;
          g.fillRect(b.x + 4 * this.unit + c * 12 * this.unit, this.groundY - b.h + 6 * this.unit + r * 14 * this.unit, 5 * this.unit, 6 * this.unit);
        }
      }
    }
  }

  // ---------- world helpers ----------

  depth(y) {
    return 0.62 + 0.6 * clamp((y - this.groundY) / (this.H - this.groundY), 0, 1);
  }

  pan(x) {
    return (x / this.W) * 1.6 - 0.8;
  }

  clampGround(y) {
    return clamp(y, this.groundY + 14 * this.unit, this.H - this.bottomInset - 10 * this.unit);
  }

  fire(id, x, y) {
    const def = CRACKERS.find((c) => c.id === id);
    if (!def) return null;
    x = clamp(x, 24, this.W - 24);
    y = this.clampGround(y ?? rand(this.groundY + 20, this.H - this.bottomInset - 20));
    const alive = this.items.filter((i) => !i.dead);
    if (alive.length > 36) alive[0].dead = true;
    const item = makeItem(def, this, x, y);
    this.items.push(item);
    this.onFire(id);
    return item;
  }

  itemAt(x, y) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (!it.dead && it.draggable && it.hit && it.hit(x, y)) return it;
    }
    return null;
  }

  /** Cracker-facing emit: sparks and stars come out BOOST times, with jittered speed and life. */
  emit(p) {
    const o = this.spawn(p);
    if (o && (o.kind === "spark" || o.kind === "star")) {
      for (let k = 1; k < BOOST; k++) {
        const j = rand(0.82, 1.12);
        this.spawn({ ...p, vx: (p.vx || 0) * j + rand(-12, 12), vy: (p.vy || 0) * j + rand(-12, 12), life: o.max * rand(0.8, 1.15) });
      }
    }
    return o;
  }

  spawn(p) {
    if (this.particles.length >= this.maxParticles) return null;
    const o = this.pool.pop() || {};
    o.kind = "spark";
    o.x = 0; o.y = 0; o.vx = 0; o.vy = 0;
    o.g = 1; o.drag = 0.6; o.life = 1; o.max = 1; o.size = 1.5;
    o.hue = 42; o.sat = 100; o.light = 60; o.trail = 1; o.glitter = 0;
    o.split = 0; o.splitAt = 0.5; o.floor = this.H + 50; o.bounce = 0.3;
    o.emitTrail = 0; o.acc = 0; o.color = null; o.rot = 0; o.vr = 0; o.w = 3; o.h = 2;
    o.r = 10; o.grow = 20; o.alpha = 0.5; o.hot = 0.15; o.strobe = 0;
    Object.assign(o, p);
    o.max = o.life;
    o.px = o.x;
    o.py = o.y;
    this.particles.push(o);
    return o;
  }

  flash(x, y, r, intensity, hue = 40, life = 0.18) {
    // BOOST x the lit area; a little extra punch, more would saturate to flat white.
    const k = this.gentle ? 0.35 : 1.5;
    this.lights.push({ x, y, r: r * (this.gentle ? 1 : Math.sqrt(BOOST)), i: intensity * k, hue, life, max: life });
  }

  addShake(v) {
    if (!this.gentle) this.shake = Math.min(32, this.shake + v * 2);
  }

  scorch(x, y, r) {
    const g = this.litter.getContext("2d");
    g.save();
    g.scale(this.dpr, this.dpr);
    g.translate(x, y);
    g.scale(1, 0.35);
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, r);
    grad.addColorStop(0, "rgba(10,8,8,0.75)");
    grad.addColorStop(0.6, "rgba(20,14,12,0.35)");
    grad.addColorStop(1, "rgba(20,14,12,0)");
    g.fillStyle = grad;
    g.beginPath();
    g.arc(0, 0, r, 0, TAU);
    g.fill();
    g.restore();
  }

  settle(p) {
    const g = this.litter.getContext("2d");
    g.save();
    g.scale(this.dpr, this.dpr);
    g.translate(p.x, p.y);
    g.rotate(p.rot);
    g.scale(1, 0.55);
    g.fillStyle = p.color;
    g.globalAlpha = 0.85;
    g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    g.restore();
  }

  sweep() {
    this.litter.getContext("2d").clearRect(0, 0, this.litter.width, this.litter.height);
    this.items = this.items.filter((i) => !i.dead && !i.finished);
  }

  // ---------- sky shells ----------

  shell(x, y, opts = {}) {
    const u = this.unit;
    const size = opts.size ?? rand(0.8, 1.2);
    const patterns = ["peony", "chrysanthemum", "willow", "ring", "crackle", "double"];
    const pattern = opts.pattern || patterns[(Math.random() * patterns.length) | 0];
    const hues = [0, 30, 50, 120, 200, 280, 320];
    const hue = opts.hue ?? hues[(Math.random() * hues.length) | 0];
    const hue2 = (hue + rand(90, 180)) % 360;
    const R = 300 * u * size;
    const pan = this.pan(x);
    const delay = clamp((this.groundY - y) / this.H, 0.05, 0.6) * 0.45;

    this.flash(x, y, 260 * u * size, 0.9 * size, pattern === "willow" ? 40 : hue, 0.3);
    this.sound?.sample("sky", { gain: 0.75 * size, rate: rand(0.85, 1.1), pan, delay });
    if (size > 1.05) this.sound?.thump({ gain: 0.3, pan, delay, freq: 55, dur: 0.6 });

    const star = (vx, vy, h, extra = {}) =>
      this.emit({ kind: "star", x, y, vx, vy, g: 0.35, drag: 1.5, life: rand(1.1, 1.7), size: rand(1.6, 2.4) * u, hue: h, sat: 100, light: 62, trail: 1.6, ...extra });

    const n = Math.round((pattern === "ring" ? 50 : 90) * size);
    if (pattern === "ring") {
      const tilt = rand(-0.6, 0.6);
      const squash = rand(0.25, 0.6);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        let vx = Math.cos(a) * R;
        let vy = Math.sin(a) * R * squash;
        const c = Math.cos(tilt), s = Math.sin(tilt);
        star(vx * c - vy * s, vx * s + vy * c, hue);
      }
      for (let i = 0; i < n / 3; i++) {
        const a = rand(0, TAU), sp = rand(0, R * 0.35);
        star(Math.cos(a) * sp, Math.sin(a) * sp, hue2, { size: 1.4 * u });
      }
      return;
    }
    for (let i = 0; i < n; i++) {
      // Uniform points on a sphere, projected: that is what makes a shell look round.
      const a = rand(0, TAU);
      const z = rand(-1, 1);
      const rr = Math.sqrt(1 - z * z);
      const sp = R * rand(0.9, 1.05);
      const vx = Math.cos(a) * rr * sp;
      const vy = Math.sin(a) * rr * sp;
      if (pattern === "willow") {
        star(vx * 0.8, vy * 0.8, 38, { kind: "spark", g: 0.55, drag: 2.2, life: rand(2.6, 3.4), sat: 90, light: 55, emitTrail: 26, trail: 1, size: 1.6 * u });
      } else if (pattern === "chrysanthemum") {
        star(vx, vy, hue, { emitTrail: 30 });
      } else if (pattern === "crackle") {
        star(vx, vy, 45, { split: 3, splitAt: 0.45, sat: 60, light: 75 });
      } else if (pattern === "double") {
        star(vx, vy, hue);
        if (i % 2 === 0) star(vx * 0.5, vy * 0.5, hue2, { size: 1.6 * u });
      } else {
        star(vx, vy, hue);
      }
    }
    if (pattern === "crackle") this.sound?.crackle({ gain: 0.35 * size, pan, delay: delay + 0.6, dur: 0.9, count: 70 });
    if (pattern === "willow") this.sound?.hiss({ gain: 0.05, low: 4000, high: 9000, dur: 2.6, attack: 0.4, release: 1.5, flutter: 0.7 });
  }

  // ---------- loop ----------

  frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (!document.hidden) {
      this.update(dt);
      this.draw();
    }
    requestAnimationFrame((t) => this.frame(t));
  }

  update(dt) {
    this.time += dt;
    this.wind += (rand(-1, 1) * 6 - (this.wind - 6) * 0.05) * dt;
    const G = 520 * this.unit;

    for (const it of this.items) if (!it.dead) it.update(dt);
    this.items = this.items.filter((i) => !i.dead);

    const ps = this.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.kill(i);
        continue;
      }
      p.px = p.x;
      p.py = p.y;
      if (p.kind === "smoke") {
        p.vx += (this.wind * 0.8 - p.vx) * 0.4 * dt;
        p.vy *= Math.exp(-0.6 * dt);
        p.vy -= 6 * this.unit * dt;
        p.r += p.grow * dt;
        p.grow *= Math.exp(-0.5 * dt);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        continue;
      }
      const f = Math.exp(-p.drag * dt);
      p.vx = p.vx * f + (p.kind === "debris" ? this.wind * 0.6 * dt : 0);
      p.vy = p.vy * f + G * p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === "debris") {
        p.rot += p.vr * dt;
        p.vx += Math.sin(this.time * 7 + p.vr) * 30 * dt;
        if (p.y >= p.floor && p.vy > 0) {
          p.y = p.floor;
          this.settle(p);
          this.kill(i);
        }
        continue;
      }
      if (p.y > p.floor && p.vy > 0) {
        p.y = p.floor;
        p.vy *= -p.bounce;
        p.vx *= 0.7;
      }
      if (p.emitTrail > 0) {
        p.acc += p.emitTrail * dt;
        while (p.acc >= 1) {
          p.acc -= 1;
          this.spawn({ x: p.x, y: p.y, vx: p.vx * 0.1 + rand(-15, 15), vy: p.vy * 0.1 + rand(-10, 10), g: 0.25, drag: 2, life: rand(0.35, 0.8), size: 0.9 * this.unit, hue: 38, sat: 95, light: 55, trail: 0.6 });
        }
      }
      if (p.split > 0 && p.life < p.max * p.splitAt) {
        const n = p.split;
        p.split = 0;
        for (let k = 0; k < n; k++) {
          const a = rand(0, TAU);
          const sp = rand(40, 140) * this.unit;
          this.spawn({ x: p.x, y: p.y, vx: p.vx * 0.3 + Math.cos(a) * sp, vy: p.vy * 0.3 + Math.sin(a) * sp, g: 0.3, drag: 3, life: rand(0.12, 0.35), size: p.size * 0.6, hue: p.hue, sat: p.sat, light: 85, strobe: 1, trail: 0.5 });
        }
        if (p.kind === "star") this.kill(i);
      }
    }

    for (let i = this.lights.length - 1; i >= 0; i--) {
      const l = this.lights[i];
      l.life -= dt;
      if (l.life <= 0) this.lights.splice(i, 1);
    }
    this.shake *= Math.exp(-9 * dt);
  }

  kill(i) {
    const p = this.particles[i];
    const last = this.particles.pop();
    if (last !== p) this.particles[i] = last;
    this.pool.push(p);
  }

  draw() {
    const { ctx, dpr, W, H } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    if (this.shake > 0.3) ctx.translate(rand(-1, 1) * this.shake, rand(-1, 1) * this.shake);
    ctx.fillStyle = "#0b0809";
    ctx.fillRect(-20, -20, W + 40, H + 40);
    ctx.drawImage(this.bg, 0, 0, W, H);

    const t = this.time;
    for (const s of this.stars) {
      ctx.globalAlpha = s.a * (0.65 + 0.35 * Math.sin(t * 1.3 + s.p));
      ctx.fillStyle = "#e8ecff";
      ctx.fillRect(s.x, s.y, s.r * 1.6, s.r * 1.6);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "lighter";
    for (const c of this.chains) {
      const a = 0.45 + 0.55 * Math.max(0, Math.sin(t * c.sp + c.p));
      ctx.fillStyle = `hsla(${c.hue},${c.sat}%,65%,${a})`;
      ctx.fillRect(c.x - 1.2, c.y - 1.2, 2.4, 2.4);
      if (a > 0.8) {
        const gl = this.glow(c.hue);
        const r = 7 * this.unit;
        ctx.globalAlpha = 0.5;
        ctx.drawImage(gl, c.x - r, c.y - r, r * 2, r * 2);
        ctx.globalAlpha = 1;
      }
    }
    for (const d of this.diyas) {
      const fl = 0.8 + 0.2 * Math.sin(t * 13 + d.p) * Math.sin(t * 7.3 + d.p * 2);
      const r = 16 * this.unit * fl;
      ctx.globalAlpha = 0.55;
      ctx.drawImage(this.glow(35), d.x - r, d.y - 6 * this.unit - r, r * 2, r * 2);
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgba(255,${(200 + 40 * fl) | 0},120,0.95)`;
      ctx.beginPath();
      ctx.ellipse(d.x, d.y - 4.5 * this.unit, 1.6 * this.unit, 4 * this.unit * fl, 0, 0, TAU);
      ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(this.litter, 0, 0, W, H);

    // Smoke behind the fire
    const ps = this.particles;
    for (const p of ps) {
      if (p.kind !== "smoke") continue;
      ctx.globalAlpha = p.alpha * Math.min(1, (p.life / p.max) * 1.6) * Math.min(1, (p.max - p.life) * 6 + 0.2);
      ctx.drawImage(this.smokeSprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    ctx.globalAlpha = 1;

    const sorted = this.items.slice().sort((a, b) => a.y - b.y);
    for (const it of sorted) it.draw(ctx);

    for (const p of ps) {
      if (p.kind !== "debris") continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.abs(Math.cos(p.rot * 1.7)) * 0.9 + 0.1);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    // Light: ground glow and flashes
    ctx.globalCompositeOperation = "lighter";
    let sky = 0;
    for (const l of this.lights) {
      const k = l.life / l.max;
      const a = l.i * k * k;
      sky += a * Math.min(1, l.r / (300 * this.unit));
      const gl = this.glow(l.hue, 90);
      ctx.globalAlpha = Math.min(1, a);
      ctx.drawImage(gl, l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    if (sky > 0.02) {
      ctx.globalAlpha = Math.min(this.gentle ? 0.05 : 0.32, sky * 0.12);
      ctx.fillStyle = "#ffcf9a";
      ctx.fillRect(-20, -20, W + 40, H + 40);
    }
    ctx.globalAlpha = 1;

    // Sparks and stars
    ctx.lineCap = "round";
    for (const p of ps) {
      if (p.kind === "smoke" || p.kind === "debris") continue;
      const k = p.life / p.max;
      let a = Math.min(1, k * 2.5);
      if (p.strobe && Math.random() < 0.5) a *= 0.15;
      if (p.glitter && Math.random() < p.glitter) a *= 0.2;
      let light;
      let hue = p.hue;
      if (p.kind === "star") {
        light = k > 0.85 ? 92 : p.light;
      } else {
        hue = p.hue - (1 - k) * 22;
        light = p.light + 35 * k * k;
      }
      ctx.strokeStyle = `hsla(${hue | 0},${p.sat}%,${light | 0}%,${a.toFixed(2)})`;
      ctx.lineWidth = p.size;
      const tx = p.x - (p.x - p.px) * 2.2 * p.trail;
      const ty = p.y - (p.y - p.py) * 2.2 * p.trail;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(p.x + 0.01, p.y + 0.01);
      ctx.stroke();
      if (p.kind === "star" && k > 0.25 && Math.random() < 0.5) {
        const r = p.size * 4;
        ctx.globalAlpha = a * 0.6;
        ctx.drawImage(this.glow(p.hue), p.x - r, p.y - r, r * 2, r * 2);
        ctx.globalAlpha = 1;
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }
}
