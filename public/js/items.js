// How each cracker behaves once it is placed and lit.

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

const SCALE = {
  phuljhadi: 1.25, anar: 1, chakri: 1, pencil: 1.15, bijli: 0.8, sutli: 0.9, hydrogen: 1.05,
  ladi: 1, rocket: 1.15, skyshot: 1.05, saanp: 0.75, tikli: 0.9,
};

const PAPER = {
  bijli: ["#d62828", "#ef233c", "#fcbf49", "#9d0208"],
  sutli: ["#b98f4f", "#8a6a3a", "#d4b483", "#d62828"],
  hydrogen: ["#1f9d55", "#0b4f2a", "#ffd166", "#d62828"],
  ladi: ["#d62828", "#ef233c", "#9d0208", "#f4d58d"],
};

class Item {
  constructor(show, def, x, y) {
    this.show = show;
    this.def = def;
    this.sound = show.sound;
    this.x = x;
    this.y = y;
    this.t = 0;
    this.dead = false;
    this.finished = false;
    this.s = show.depth(y);
    this.u = show.unit * this.s;
    this.h = 76 * this.u * (SCALE[def.id] || 1);
    this.w = (this.h * 120) / 140;
    this.pan = show.pan(x);
  }

  /** Map a point in the 120x140 SVG artwork to world coordinates. */
  pt(fx, fy) {
    return [this.x + ((fx - 60) / 120) * this.w, this.y - ((140 - fy) / 140) * this.h];
  }

  drawSprite(ctx, alpha = 1, dx = 0) {
    const sp = this.show.sprites[this.def.id];
    if (!sp) return;
    ctx.globalAlpha = alpha;
    ctx.drawImage(sp, this.x - this.w / 2 + dx, this.y - this.h, this.w, this.h);
    ctx.globalAlpha = 1;
  }

  startFuse(dur) {
    this.fuseSound = this.sound.hiss({ gain: 0.07, low: 2500, high: 9000, dur, attack: 0.04, release: 0.08, flutter: 0.85 });
  }

  fuseTick(from, to, k) {
    const x = from[0] + (to[0] - from[0]) * k;
    const y = from[1] + (to[1] - from[1]) * k;
    const u = this.u;
    for (let i = 0; i < 3; i++) {
      this.show.emit({ x, y, vx: rand(-70, 70) * u, vy: rand(-110, 10) * u, g: 0.6, drag: 3, life: rand(0.08, 0.28), size: 0.9 * u, hue: 32, light: 58, floor: this.y });
    }
    this.show.flash(x, y, 22 * u, 0.45, 30, 0.05);
  }

  puff(x, y, { r = 6, grow = 30, alpha = 0.3, life = 3, vy = -40 } = {}) {
    const u = this.u;
    this.show.emit({ kind: "smoke", x, y, vx: rand(-15, 15) * u, vy: vy * u * rand(0.6, 1.2), r: r * u, grow: grow * u, alpha, life: life * rand(0.8, 1.2) });
  }

  finish(after = 20) {
    this.finished = true;
    this.deadAt = this.t + after;
  }

  tickDeath() {
    if (this.finished && this.t > this.deadAt) this.dead = true;
  }

  draw(ctx) {
    this.drawSprite(ctx);
  }
}

/** A cracker going off: flash, sparks, flying paper, smoke and a scorch mark. */
export function blast(show, x, y, power, s, colors, opts = {}) {
  const u = show.unit * s;
  const sp = Math.sqrt(power);
  show.flash(x, y - 8 * u, 190 * u * sp, Math.min(1.6, 1.1 * power + 0.3), 38, 0.1 + 0.09 * power);
  show.flash(x, y - 4 * u, 55 * u * sp, 1.4, 50, 0.06);
  show.addShake(5 * power);
  const n = Math.round(42 * power + 6);
  for (let i = 0; i < n; i++) {
    const a = Math.random() < 0.75 ? rand(Math.PI * 1.03, Math.PI * 1.97) : rand(0, TAU);
    const v = rand(200, 820) * u * sp;
    show.emit({ x, y: y - 3 * u, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0.5, drag: 5, life: rand(0.07, 0.3), size: rand(1, 2.3) * u, hue: 46, light: 62, floor: y + 3 * u, bounce: 0.4 });
  }
  const m = Math.round((opts.debris ?? 1) * (26 * power + 4));
  for (let i = 0; i < m; i++) {
    show.emit({
      kind: "debris", x: x + rand(-4, 4) * u, y: y - 4 * u,
      vx: rand(-1, 1) * 280 * u * sp, vy: rand(-650, -110) * u * sp, g: 0.55, drag: 1.8, life: 8,
      w: rand(3, 8) * u, h: rand(2, 5) * u, rot: rand(0, TAU), vr: rand(-14, 14),
      color: colors[(Math.random() * colors.length) | 0],
      floor: Math.max(show.groundY + 3, y + rand(-12, 16) * u),
    });
  }
  const k = Math.round((opts.smoke ?? 1) * (4 + 6 * power));
  for (let i = 0; i < k; i++) {
    show.emit({
      kind: "smoke", x: x + rand(-8, 8) * u, y: y - rand(0, 14) * u,
      vx: rand(-60, 60) * u * sp, vy: rand(-80, -15) * u, r: rand(8, 16) * u * sp,
      grow: 75 * u * sp, life: rand(2.5, 5), alpha: rand(0.3, 0.55),
    });
  }
  if (opts.scorch !== false) show.scorch(x, y, 26 * u * sp);
}

// ---------- bombs ----------

class Bomb extends Item {
  constructor(show, def, x, y, cfg) {
    super(show, def, x, y);
    this.cfg = cfg;
  }

  update(dt) {
    this.t += dt;
    const c = this.cfg;
    if (!this.started) {
      this.started = true;
      this.startFuse(c.fuse);
    }
    if (this.t < c.fuse) {
      this.fuseTick(this.pt(...c.tip), this.pt(60, c.body), this.t / c.fuse);
      return;
    }
    blast(this.show, this.x, this.y, c.power, this.s, PAPER[this.def.id]);
    c.boom(this.sound, this.pan);
    this.dead = true;
  }
}

// ---------- fountains and spinners ----------

class Anar extends Item {
  constructor(...a) {
    super(...a);
    this.fuse = 1.1;
    this.dur = 7.5;
    this.acc = 0;
    this.smokeT = 0;
  }

  update(dt) {
    this.t += dt;
    if (!this.started) {
      this.started = true;
      this.startFuse(this.fuse);
    }
    if (this.t < this.fuse) {
      this.fuseTick(this.pt(57, 20), this.pt(60, 36), this.t / this.fuse);
      return;
    }
    const bt = this.t - this.fuse;
    if (bt > this.dur) {
      if (!this.finished) this.finish();
      this.tickDeath();
      return;
    }
    if (!this.hiss) {
      this.hiss = this.sound.hiss({ gain: 0.3, low: 900, high: 7500, dur: this.dur, attack: 0.5, release: 1.4, flutter: 0.3 });
    }
    let e = bt < 0.6 ? bt / 0.6 : bt > this.dur - 1.6 ? Math.max(0, (this.dur - bt) / 1.6) : 1;
    e *= 0.85 + 0.15 * Math.sin(bt * 31) * Math.sin(bt * 17);
    const [mx, my] = this.pt(60, 36);
    const u = this.u;
    this.acc += 330 * e * dt;
    while (this.acc >= 1) {
      this.acc -= 1;
      const a = -Math.PI / 2 + gauss() * 0.2;
      const v = rand(0.55, 1) * 640 * u * Math.sqrt(e + 0.12);
      const silver = Math.random() < 0.25;
      this.show.emit({
        x: mx, y: my, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 1, drag: 0.9, life: rand(0.8, 1.5),
        size: rand(1.1, 2) * u, hue: silver ? 50 : 40, sat: silver ? 15 : 100, light: silver ? 70 : 55,
        floor: this.y + rand(-4, 8) * u, bounce: 0.25, split: Math.random() < 0.06 ? 4 : 0, splitAt: rand(0.2, 0.5),
      });
    }
    this.show.flash(mx, my - 40 * u, 170 * u * e, 0.55 * e, 40, 0.05);
    this.smokeT -= dt;
    if (this.smokeT <= 0) {
      this.smokeT = 0.22;
      this.puff(mx, my - 10 * u, { r: 8, grow: 40, alpha: 0.22, vy: -70 });
    }
    if (Math.random() < dt * 2.5) this.sound.crackle({ gain: 0.12, pan: this.pan, dur: 0.25, count: 6 });
  }

  draw(ctx) {
    this.drawSprite(ctx, this.finished ? 0.65 : 1);
  }
}

class Chakri extends Item {
  constructor(...a) {
    super(...a);
    this.fuse = 0.9;
    this.dur = 6.5;
    this.ang = 0;
    this.spin = 0;
    this.vx = 0;
    this.vy = 0;
    this.acc = 0;
    this.green = Math.random() < 0.6;
  }

  update(dt) {
    this.t += dt;
    const u = this.u;
    const rx = 22 * u;
    if (!this.started) {
      this.started = true;
      this.startFuse(this.fuse);
    }
    if (this.t < this.fuse) {
      this.fuseTick([this.x + rx + 8 * u, this.y - 8 * u], [this.x + rx, this.y - 3 * u], this.t / this.fuse);
      return;
    }
    const bt = this.t - this.fuse;
    if (bt > this.dur) {
      if (!this.finished) this.finish();
      this.spin *= Math.exp(-4 * dt);
      this.ang += this.spin * dt;
      this.tickDeath();
      return;
    }
    if (!this.hiss) {
      this.hiss = this.sound.hiss({ gain: 0.26, low: 1500, high: 5000, dur: this.dur, attack: 0.3, release: 0.8, flutter: 0.55 });
    }
    const e = bt < 0.8 ? bt / 0.8 : bt > this.dur - 1 ? Math.max(0.1, this.dur - bt) : 1;
    this.spin = 30 * e;
    this.ang += this.spin * dt;
    this.hiss.pitch?.(2500 + this.spin * 140);
    this.vx += rand(-1, 1) * 420 * u * dt;
    this.vy += rand(-1, 1) * 160 * u * dt;
    this.vx *= Math.exp(-1.6 * dt);
    this.vy *= Math.exp(-2 * dt);
    this.x = Math.max(30, Math.min(this.show.W - 30, this.x + this.vx * dt));
    this.y = this.show.clampGround(this.y + this.vy * dt);
    this.pan = this.show.pan(this.x);

    const ry = 7 * u;
    const hue = this.green && bt > this.dur * 0.45 ? 115 : 42;
    this.acc += 380 * e * dt;
    while (this.acc >= 1) {
      this.acc -= 1;
      const th = this.ang + (Math.random() < 0.5 ? 0 : Math.PI) + rand(-0.15, 0.15);
      const v = rand(260, 500) * u;
      this.show.emit({
        x: this.x + Math.cos(th) * rx, y: this.y - 4 * u + Math.sin(th) * ry,
        vx: -Math.sin(th) * v, vy: Math.cos(th) * v * 0.35 + rand(-90, -10) * u,
        g: 1, drag: 1.4, life: rand(0.25, 0.6), size: 1.3 * u, hue, sat: hue === 42 ? 100 : 90, light: 55,
        floor: this.y + rand(-3, 6) * u, bounce: 0.4,
      });
    }
    this.show.flash(this.x, this.y - 6 * u, 110 * u * e, 0.6 * e, hue, 0.05);
  }

  draw(ctx) {
    const u = this.u;
    const rx = 22 * u;
    const ry = 7 * u;
    ctx.save();
    ctx.translate(this.x, this.y - 4 * u);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 4 * u, rx * 1.1, ry * 1.2, 0, 0, TAU);
    ctx.fill();
    const burnt = this.finished;
    const cols = burnt ? ["#2a2522", "#3a302a", "#1f1b19"] : ["#2b9348", "#e63946", "#ffd166"];
    for (let k = 3; k >= 1; k--) {
      ctx.lineWidth = 2.6 * u;
      ctx.strokeStyle = cols[k % 3];
      ctx.beginPath();
      ctx.ellipse(0, 0, (rx * k) / 3, (ry * k) / 3, 0, 0, TAU);
      ctx.stroke();
    }
    if (this.spin < 8) {
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const a = this.ang + (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * rx * 0.3, Math.sin(a) * ry * 0.3);
        ctx.lineTo(Math.cos(a) * rx, Math.sin(a) * ry);
        ctx.stroke();
      }
    }
    ctx.fillStyle = burnt ? "#2a2522" : "#f4e3c1";
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.22, ry * 0.3, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

// ---------- sticks you can hold ----------

class Phuljhadi extends Item {
  constructor(...a) {
    super(...a);
    this.draggable = true;
    this.fuse = 0.35;
    this.dur = 9;
    this.acc = 0;
    this.crackT = 0;
    this.tilt = rand(-0.18, 0.18);
    this.len = 96 * this.u;
  }

  ends(frac) {
    const bx = this.x;
    const by = this.y;
    return [bx + Math.sin(this.tilt) * this.len * frac, by - Math.cos(this.tilt) * this.len * frac];
  }

  hit(x, y) {
    const [tx, ty] = this.ends(1);
    const dx = tx - this.x, dy = ty - this.y;
    const k = Math.max(0, Math.min(1, ((x - this.x) * dx + (y - this.y) * dy) / (dx * dx + dy * dy)));
    const px = this.x + dx * k, py = this.y + dy * k;
    return Math.hypot(x - px, y - py) < 30;
  }

  moveTo(x, y) {
    this.x = Math.max(10, Math.min(this.show.W - 10, x));
    this.y = Math.max(this.len + 20, Math.min(this.show.H - this.show.bottomInset, y));
    this.pan = this.show.pan(this.x);
  }

  get burnFrac() {
    const bt = Math.max(0, this.t - this.fuse);
    return 1 - Math.min(1, bt / this.dur) * 0.72;
  }

  update(dt) {
    this.t += dt;
    const bt = this.t - this.fuse;
    if (bt < 0) return;
    if (bt > this.dur) {
      if (!this.finished) this.finish(14);
      this.tickDeath();
      return;
    }
    if (!this.hiss) {
      this.hiss = this.sound.hiss({ gain: 0.07, low: 3000, high: 9500, dur: this.dur, attack: 0.15, release: 0.6, flutter: 0.9 });
    }
    const u = this.u;
    const [bx, by] = this.ends(this.burnFrac);
    const floor = Math.max(this.y + 4 * u, this.show.groundY + 16 * u);
    this.acc += 170 * dt;
    while (this.acc >= 1) {
      this.acc -= 1;
      const a = rand(0, TAU);
      const v = rand(50, 290) * u;
      this.show.emit({
        x: bx, y: by, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0.35, drag: 3.2, life: rand(0.12, 0.42),
        size: rand(0.7, 1.3) * u, hue: 45, sat: rand(25, 100), light: 66, trail: 0.7,
        split: Math.random() < 0.45 ? 3 : 0, splitAt: rand(0.3, 0.6), floor,
      });
    }
    this.show.flash(bx, by, 80 * u, 0.95, 45, 0.05);
    this.crackT -= dt;
    if (this.crackT <= 0) {
      this.crackT = rand(0.25, 0.45);
      this.sound.crackle({ gain: 0.14, pan: this.pan, dur: 0.3, count: 9 });
    }
  }

  draw(ctx) {
    const u = this.u;
    const f = this.finished ? 0.28 : this.burnFrac;
    const [tx, ty] = this.ends(1);
    const [bx, by] = this.ends(f);
    const [cx, cy] = this.ends(0.28);
    ctx.lineCap = "round";
    ctx.strokeStyle = "#9a9a9a";
    ctx.lineWidth = 1.4 * u;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    if (f > 0.28) {
      ctx.strokeStyle = "#6f6860";
      ctx.lineWidth = 4.2 * u;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
    if (!this.finished && this.t > this.fuse) {
      ctx.strokeStyle = "#3a1d12";
      ctx.lineWidth = 1.6 * u;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.fillStyle = "#fff6d8";
      ctx.beginPath();
      ctx.arc(bx, by, 3 * u, 0, TAU);
      ctx.fill();
    }
  }
}

class Pencil extends Phuljhadi {
  constructor(...a) {
    super(...a);
    this.fuse = 0.4;
    this.dur = 8;
    this.hue = [0, 120, 285][(Math.random() * 3) | 0];
    this.smokeT = 0;
    this.len = 86 * this.u;
  }

  update(dt) {
    this.t += dt;
    const bt = this.t - this.fuse;
    if (bt < 0) return;
    if (bt > this.dur) {
      if (!this.finished) this.finish(14);
      this.tickDeath();
      return;
    }
    if (!this.hiss) {
      this.hiss = this.sound.hiss({ gain: 0.12, low: 500, high: 3200, dur: this.dur, attack: 0.3, release: 0.8, flutter: 0.4 });
    }
    const u = this.u;
    const [bx, by] = this.ends(this.burnFrac);
    this.acc += 150 * dt;
    while (this.acc >= 1) {
      this.acc -= 1;
      this.show.emit({ x: bx + rand(-2, 2) * u, y: by, vx: rand(-25, 25) * u, vy: rand(-170, -60) * u, g: -0.1, drag: 2.2, life: rand(0.18, 0.42), size: rand(3, 6) * u, hue: this.hue, sat: 100, light: 58, trail: 0.4 });
      if (Math.random() < 0.25) {
        const a = rand(0, TAU), v = rand(60, 200) * u;
        this.show.emit({ x: bx, y: by, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0.4, drag: 2.5, life: rand(0.2, 0.5), size: 1.1 * u, hue: this.hue, sat: 90, light: 70, floor: this.show.groundY + 16 * u });
      }
    }
    this.show.flash(bx, by - 10 * u, 160 * u, 0.85, this.hue, 0.05);
    this.smokeT -= dt;
    if (this.smokeT <= 0) {
      this.smokeT = 0.16;
      this.puff(bx, by - 14 * u, { r: 6, grow: 36, alpha: 0.32, vy: -60, life: 3.5 });
    }
  }

  draw(ctx) {
    const u = this.u;
    const f = this.finished ? 0.12 : this.burnFrac;
    const [tx, ty] = this.ends(f);
    ctx.lineCap = "butt";
    ctx.strokeStyle = this.finished ? "#2b2523" : `hsl(${this.hue},70%,38%)`;
    ctx.lineWidth = 5 * u;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.strokeStyle = "#c8a165";
    ctx.lineWidth = 1.4 * u;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + 6 * u);
    ctx.lineTo(this.x, this.y - 4 * u);
    ctx.stroke();
  }
}

// ---------- the string ----------

class Ladi extends Item {
  constructor(...a) {
    super(...a);
    const u = this.u;
    const n = 90;
    const half = Math.min(140 * u, this.show.W * 0.35);
    this.bits = [];
    let t = 1.0;
    for (let i = n - 1; i >= 0; i--) {
      const k = i / (n - 1);
      this.bits[i] = {
        x: this.x - half + k * half * 2,
        y: this.y + Math.sin(k * Math.PI * 1.6) * 7 * u,
        a: (i % 2 ? 1 : -1) * 0.55 + rand(-0.1, 0.1),
        t: 0,
        popped: false,
      };
    }
    for (let i = n - 1; i >= 0; i--) {
      this.bits[i].t = t;
      t += rand(0.04, 0.085);
    }
    this.end = t;
    this.next = n - 1;
  }

  update(dt) {
    this.t += dt;
    if (!this.started) {
      this.started = true;
      this.startFuse(1.0);
    }
    const u = this.u;
    while (this.next >= 0 && this.bits[this.next].t <= this.t) {
      const b = this.bits[this.next];
      b.popped = true;
      const big = this.next % 13 === 0;
      blast(this.show, b.x, b.y, big ? 0.45 : rand(0.16, 0.3), this.s, PAPER.ladi, { smoke: 0.45, debris: 0.9, scorch: Math.random() < 0.5 });
      this.sound.sample("bang", { gain: big ? 0.75 : rand(0.28, 0.55), rate: big ? 0.95 : rand(1.1, 1.5), pan: this.show.pan(b.x) });
      for (let j = 1; j <= 5 && this.next - j >= 0; j++) {
        const nb = this.bits[this.next - j];
        nb.x += rand(-3, 3) * u;
        nb.y = Math.max(this.show.groundY + 6, nb.y + rand(-2.5, 2.5) * u);
      }
      this.next--;
    }
    if (this.next >= 0 && this.t < this.bits[this.bits.length - 1].t) {
      const last = this.bits[this.bits.length - 1];
      this.fuseTick([last.x + 14 * u, last.y - 4 * u], [last.x, last.y], this.t);
    }
    if (this.next < 0 && this.t > this.end + 0.5) this.dead = true;
  }

  draw(ctx) {
    const u = this.u;
    ctx.strokeStyle = "#5c4a3a";
    ctx.lineWidth = 1.2 * u;
    ctx.beginPath();
    let first = true;
    for (let i = 0; i <= this.next; i++) {
      const b = this.bits[i];
      if (first) ctx.moveTo(b.x, b.y);
      else ctx.lineTo(b.x, b.y);
      first = false;
    }
    ctx.stroke();
    for (let i = 0; i <= this.next; i++) {
      const b = this.bits[i];
      ctx.save();
      ctx.translate(b.x, b.y - 1.5 * u);
      ctx.rotate(b.a + Math.PI / 2);
      ctx.fillStyle = i % 3 === 0 ? "#b5171d" : "#e5383b";
      ctx.fillRect(-1.6 * u, 0, 3.2 * u, 9 * u);
      ctx.restore();
    }
    if (this.next === this.bits.length - 1) {
      const b = this.bits[this.next];
      ctx.strokeStyle = "#2b9348";
      ctx.lineWidth = 1.4 * u;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x + 14 * u, b.y - 4 * u);
      ctx.stroke();
    }
  }
}

// ---------- sky ----------

function launchHeight(show, startY) {
  const target = rand(0.1, 0.34) * show.H;
  const G = 520 * show.unit;
  return -Math.sqrt(2 * G * 0.92 * Math.max(60, startY - target));
}

class Rocket extends Item {
  constructor(...a) {
    super(...a);
    this.fuse = 1.1;
    this.acc = 0;
    this.smokeT = 0;
  }

  update(dt) {
    this.t += dt;
    if (!this.started) {
      this.started = true;
      this.startFuse(this.fuse);
    }
    if (this.t < this.fuse) {
      this.fuseTick(this.pt(62, 59), this.pt(60, 50), this.t / this.fuse);
      return;
    }
    const show = this.show;
    const u0 = show.unit;
    if (!this.flying && !this.finished) {
      this.flying = true;
      [this.rx, this.ry] = this.pt(60, 10);
      this.vx = rand(-70, 70) * u0;
      this.vy = launchHeight(show, this.ry);
      this.sound.whoosh({ gain: 0.42, pan: this.pan, dur: Math.abs(this.vy) / (520 * u0) + 0.1, whistle: Math.random() < 0.45 });
      this.puff(this.x, this.y - this.h * 0.6, { r: 8, grow: 50, alpha: 0.35, vy: -20 });
      show.flash(this.rx, this.ry, 60 * this.u, 0.8, 40, 0.1);
    }
    if (this.flying) {
      const G = 520 * u0;
      this.vy += G * 0.92 * dt;
      this.vx += Math.sin(this.t * 23) * 60 * u0 * dt;
      this.rx += this.vx * dt;
      this.ry += this.vy * dt;
      this.acc += 140 * dt;
      while (this.acc >= 1) {
        this.acc -= 1;
        show.emit({ x: this.rx, y: this.ry + 6 * u0, vx: -this.vx * 0.15 + rand(-35, 35) * u0, vy: rand(30, 140) * u0, g: 0.5, drag: 2, life: rand(0.2, 0.55), size: 1.2 * u0, hue: 40, light: 55 });
      }
      this.smokeT -= dt;
      if (this.smokeT <= 0) {
        this.smokeT = 0.04;
        show.emit({ kind: "smoke", x: this.rx, y: this.ry + 8 * u0, vx: rand(-5, 5), vy: 0, r: 2.5 * u0, grow: 14 * u0, alpha: 0.16, life: rand(1.4, 2.2) });
      }
      if (this.vy > -40 * u0 || this.ry < show.H * 0.06) {
        this.flying = false;
        show.shell(this.rx, this.ry, { size: rand(0.65, 0.95) });
        this.finish(18);
      }
    }
    this.tickDeath();
  }

  draw(ctx) {
    const sp = this.show.sprites.rocket;
    if (!sp) return;
    if (!this.flying && !this.finished) {
      this.drawSprite(ctx);
      return;
    }
    const cut = 92;
    ctx.drawImage(sp, 0, cut, 240, 280 - cut, this.x - this.w / 2, this.y - this.h * ((280 - cut) / 280), this.w, this.h * ((280 - cut) / 280));
    if (this.flying) {
      const u0 = this.show.unit;
      const a = Math.atan2(this.vy, this.vx);
      ctx.save();
      ctx.translate(this.rx, this.ry);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillStyle = "#e5383b";
      ctx.fillRect(-2 * u0, -8 * u0, 4 * u0, 12 * u0);
      ctx.strokeStyle = "#c8a165";
      ctx.lineWidth = 1.2 * u0;
      ctx.beginPath();
      ctx.moveTo(0, 4 * u0);
      ctx.lineTo(0, 30 * u0);
      ctx.stroke();
      ctx.restore();
    }
  }
}

class SkyShot extends Item {
  constructor(...a) {
    super(...a);
    this.fuse = 1.4;
    this.shots = 12;
    this.nextShot = this.fuse;
    this.comets = [];
  }

  update(dt) {
    this.t += dt;
    const show = this.show;
    const u0 = show.unit;
    if (!this.started) {
      this.started = true;
      this.startFuse(this.fuse);
    }
    if (this.t < this.fuse) {
      this.fuseTick(this.pt(5, 92), this.pt(14, 100), this.t / this.fuse);
    } else if (this.shots > 0 && this.t >= this.nextShot) {
      this.shots--;
      this.nextShot = this.t + rand(0.42, 0.8);
      const [tx, ty] = this.pt(60 + rand(-14, 14), 52);
      this.comets.push({ x: tx, y: ty, vx: rand(-90, 90) * u0, vy: launchHeight(show, ty), last: this.shots === 0, acc: 0 });
      this.sound.thump({ gain: 0.5, pan: this.pan, freq: 95, dur: 0.22 });
      this.sound.sample("bang", { gain: 0.22, rate: 0.55, pan: this.pan });
      show.flash(tx, ty, 50 * this.u, 0.8, 40, 0.08);
      this.puff(tx, ty, { r: 6, grow: 45, alpha: 0.35, vy: -50 });
    }
    const G = 520 * u0;
    for (let i = this.comets.length - 1; i >= 0; i--) {
      const c = this.comets[i];
      c.vy += G * 0.92 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.acc += 90 * dt;
      while (c.acc >= 1) {
        c.acc -= 1;
        show.emit({ x: c.x, y: c.y, vx: rand(-20, 20) * u0, vy: rand(10, 70) * u0, g: 0.3, drag: 2.5, life: rand(0.3, 0.7), size: 1.3 * u0, hue: 38, sat: 90, light: 58 });
      }
      if (c.vy > -30 * u0) {
        show.shell(c.x, c.y, c.last ? { size: 1.35, pattern: "crackle" } : {});
        this.comets.splice(i, 1);
      }
    }
    if (this.shots === 0 && this.comets.length === 0 && !this.finished) this.finish(18);
    this.tickDeath();
  }

  draw(ctx) {
    this.drawSprite(ctx, this.finished ? 0.7 : 1);
  }
}

// ---------- the quiet ones ----------

class Saanp extends Item {
  constructor(...a) {
    super(...a);
    this.fuse = 0.6;
    this.dur = 8.5;
    this.pts = [[this.x, this.y - 2 * this.u]];
    this.head = -Math.PI / 2 + rand(-0.3, 0.3);
    this.seed = rand(0, 10);
    this.smokeT = 0;
  }

  update(dt) {
    this.t += dt;
    const u = this.u;
    const bt = this.t - this.fuse;
    if (bt < 0) return;
    if (bt > this.dur) {
      if (!this.finished) this.finish(40);
      this.tickDeath();
      return;
    }
    if (!this.hiss) this.hiss = this.sound.hiss({ gain: 0.05, low: 400, high: 2500, dur: this.dur, attack: 0.3, release: 1, flutter: 0.6 });
    const prog = bt / this.dur;
    const speed = 15 * u * (1 - prog * 0.5);
    this.head += (Math.sin(bt * 2.1 + this.seed) * 1.7 + rand(-1, 1)) * dt;
    if (prog > 0.45) this.head += 0.35 * dt * Math.sign(Math.cos(this.head) || 1);
    const [hx, hy] = this.pts[this.pts.length - 1];
    const nx = hx + Math.cos(this.head) * speed * dt;
    const ny = Math.min(this.y - 2 * u, hy + Math.sin(this.head) * speed * dt);
    const [lx, ly] = this.pts[this.pts.length - 1];
    if (Math.hypot(nx - lx, ny - ly) > 1.5 * u || this.pts.length === 1) this.pts.push([nx, ny]);
    else this.pts[this.pts.length - 1] = [nx, ny];
    this.show.flash(this.x, this.y - 4 * u, 28 * u, 0.5, 30, 0.05);
    if (Math.random() < 0.5) this.show.emit({ x: this.x + rand(-3, 3) * u, y: this.y - 3 * u, vx: rand(-10, 10) * u, vy: rand(-60, -20) * u, g: -0.1, drag: 3, life: rand(0.1, 0.25), size: rand(2, 3.5) * u, hue: rand(20, 90), light: 55 });
    this.smokeT -= dt;
    if (this.smokeT <= 0) {
      this.smokeT = 0.15;
      this.puff(this.x, this.y - 6 * u, { r: 3, grow: 18, alpha: 0.25, vy: -35, life: 2.5 });
    }
  }

  draw(ctx) {
    const u = this.u;
    const fade = this.finished ? Math.min(1, Math.max(0, (this.deadAt - this.t) / 3)) : 1;
    ctx.globalAlpha = fade;
    if (this.t < this.fuse) {
      this.drawSprite(ctx);
      ctx.globalAlpha = 1;
      return;
    }
    ctx.fillStyle = "#151515";
    ctx.beginPath();
    ctx.ellipse(this.x, this.y - 1 * u, 6 * u, 2.6 * u, 0, 0, TAU);
    ctx.fill();
    if (this.pts.length > 1) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const path = () => {
        ctx.beginPath();
        ctx.moveTo(this.pts[0][0], this.pts[0][1]);
        for (const [x, y] of this.pts) ctx.lineTo(x, y);
      };
      path();
      ctx.strokeStyle = "#3b3b3b";
      ctx.lineWidth = 7 * u;
      ctx.stroke();
      ctx.save();
      ctx.translate(-1 * u, -1.2 * u);
      path();
      ctx.strokeStyle = "rgba(160,160,160,0.55)";
      ctx.lineWidth = 2.6 * u;
      ctx.stroke();
      ctx.restore();
      path();
      ctx.setLineDash([1.5 * u, 3 * u]);
      ctx.strokeStyle = "rgba(15,15,15,0.55)";
      ctx.lineWidth = 7 * u;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.globalAlpha = 1;
  }
}

class Tikli extends Item {
  constructor(...a) {
    super(...a);
    this.caps = 10;
    this.next = 0.35;
    this.recoil = 0;
  }

  update(dt) {
    this.t += dt;
    this.recoil *= Math.exp(-18 * dt);
    if (this.caps > 0 && this.t >= this.next) {
      this.caps--;
      this.next = this.t + rand(0.3, 0.5);
      this.recoil = 1;
      const u = this.u;
      const [mx, my] = this.pt(2, 62);
      this.show.flash(mx, my, 45 * u, 0.7, 45, 0.06);
      for (let i = 0; i < 7; i++) {
        this.show.emit({ x: mx, y: my, vx: -rand(80, 320) * u, vy: rand(-90, 40) * u, g: 0.4, drag: 5, life: rand(0.06, 0.18), size: 1 * u, hue: 46, light: 62, floor: this.y });
      }
      this.puff(mx, my, { r: 4, grow: 26, alpha: 0.38, vy: -25, life: 2.2 });
      this.sound.sample("bang", { gain: 0.32, rate: rand(1.9, 2.4), pan: this.pan });
      this.sound.crackle({ gain: 0.25, pan: this.pan, dur: 0.03, count: 3 });
    }
    if (this.caps === 0 && !this.finished) this.finish(12);
    this.tickDeath();
  }

  draw(ctx) {
    this.drawSprite(ctx, 1, this.recoil * 4 * this.u);
  }
}

// ---------- factory ----------

const BOMBS = {
  bijli: {
    fuse: 1.3, power: 0.55, tip: [62, 34], body: 70,
    boom(s, pan) {
      s.sample("bang", { gain: 0.85, rate: rand(1.02, 1.2), pan });
      s.sample("bang", { gain: 0.1, rate: 1, pan: -pan * 0.5, delay: 0.17 });
    },
  },
  sutli: {
    fuse: 3.2, power: 1.15, tip: [66, 24], body: 60,
    boom(s, pan) {
      s.sample("boom", { gain: 1, rate: rand(0.95, 1.05), pan });
      s.thump({ gain: 0.7, pan, freq: 72, dur: 0.6 });
      s.sample("boom", { gain: 0.16, rate: 0.9, pan: -pan * 0.5, delay: 0.23 });
    },
  },
  hydrogen: {
    fuse: 4, power: 1.8, tip: [66, 20], body: 56,
    boom(s, pan) {
      s.sample("boom", { gain: 1, rate: 0.78, pan });
      s.sample("boom", { gain: 0.6, rate: 0.64, pan, delay: 0.012 });
      s.thump({ gain: 1, pan, freq: 56, dur: 1.1 });
      s.sample("boom", { gain: 0.22, rate: 0.72, pan: -pan * 0.5, delay: 0.3 });
    },
  },
};

export function makeItem(def, show, x, y) {
  switch (def.id) {
    case "anar": return new Anar(show, def, x, y);
    case "chakri": return new Chakri(show, def, x, y);
    case "phuljhadi": return new Phuljhadi(show, def, x, y);
    case "pencil": return new Pencil(show, def, x, y);
    case "ladi": return new Ladi(show, def, x, y);
    case "rocket": return new Rocket(show, def, x, y);
    case "skyshot": return new SkyShot(show, def, x, y);
    case "saanp": return new Saanp(show, def, x, y);
    case "tikli": return new Tikli(show, def, x, y);
    default: return new Bomb(show, def, x, y, BOMBS[def.id] || BOMBS.bijli);
  }
}
