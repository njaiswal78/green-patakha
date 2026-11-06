// Sound engine. Bangs and booms are real recordings (CC0 / public domain,
// see public/sounds/CREDITS.md). Hiss, whoosh, fuse sizzle and crackle are
// shaped noise, because that is what those sounds physically are.

const SETS = {
  boom: ["boom-1", "boom-2", "boom-3", "boom-4"],
  bang: ["bang-1", "bang-2", "bang-3", "bang-4", "bang-5", "bang-6"],
  sky: ["sky-1", "sky-2", "sky-3", "sky-4"],
};

const STORE_KEY = "gp.sound";

export class Sound {
  constructor() {
    this.ctx = null;
    this.buffers = {};
    const saved = readSaved();
    this.volume = saved.volume;
    this.muted = saved.muted;
    /** User's 1x / 2x / 4x: drives the bus harder and stacks each bang this many deep. */
    this.power = 1;
    this.listeners = new Set();
  }

  get ready() {
    return !!this.ctx && this.ctx.state === "running";
  }

  /** Must be called from a user gesture (tap, click, key). */
  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx({ latencyHint: "interactive" });
      // Chain: power drive -> bass shelf -> peak limiter -> soft clip -> volume. 1x leaves 6 dB of
      // headroom so each cracker keeps its real loudness relative to the others (a bomb peaks near
      // -6 dBFS, a phuljhadi stays a fizz); 2x and 4x spend that headroom and then push into the
      // limiter. Volume sits last so the slider scales real output.
      const c = this.ctx;
      this.bus = c.createGain();
      this.bus.gain.value = this.power / 2;
      this.master = c.createGain();
      const bass = c.createBiquadFilter();
      bass.type = "lowshelf";
      bass.frequency.value = 110;
      bass.gain.value = 4;
      this.limiter = c.createDynamicsCompressor();
      this.limiter.threshold.value = -6;
      this.limiter.knee.value = 3;
      this.limiter.ratio.value = 20;
      this.limiter.attack.value = 0.002;
      this.limiter.release.value = 0.25;
      const clip = (this.clip = c.createWaveShaper());
      const curve = new Float32Array(2048);
      for (let i = 0; i < curve.length; i++) curve[i] = (0.92 * Math.tanh(2.5 * (i / 1023.5 - 1))) / Math.tanh(2.5); // 0.92: 4x oversampling overshoots
      clip.curve = curve;
      clip.oversample = "4x";
      this.bus.connect(bass);
      bass.connect(this.limiter);
      this.limiter.connect(clip);
      clip.connect(this.master);
      this.master.connect(c.destination);
      this.applyVolume(true);
      this.noise = makeNoise(this.ctx, 2.5);
      this.load();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  async load() {
    const names = Object.values(SETS).flat();
    await Promise.all(
      names.map(async (name) => {
        try {
          const res = await fetch(`/sounds/${name}.mp3`);
          const data = await res.arrayBuffer();
          this.buffers[name] = await this.ctx.decodeAudioData(data);
        } catch {
          // A missing clip falls back to the synthesised bang.
        }
      }),
    );
  }

  setPower(n) {
    this.power = n;
    if (this.bus) this.bus.gain.setTargetAtTime(n / 2, this.ctx.currentTime, 0.03);
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.volume > 0) this.muted = false;
    this.applyVolume();
  }

  toggleMute() {
    this.muted = !this.muted;
    this.applyVolume();
  }

  applyVolume(instant = false) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ volume: this.volume, muted: this.muted }));
    } catch {}
    this.listeners.forEach((fn) => fn(this));
    if (!this.ctx) return;
    const target = this.muted ? 0 : this.volume * this.volume;
    if (instant) this.master.gain.value = target;
    else this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.03);
  }

  onChange(fn) {
    this.listeners.add(fn);
    fn(this);
  }

  out(pan = 0, gain = 1) {
    const g = this.ctx.createGain();
    g.gain.value = gain;
    if (this.ctx.createStereoPanner) {
      const p = this.ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      g.connect(p);
      p.connect(this.bus);
    } else {
      g.connect(this.bus);
    }
    return g;
  }

  now(offset = 0) {
    return this.ctx.currentTime + Math.max(0, offset);
  }

  /** Play one of the recorded clips from a set. */
  sample(set, { gain = 1, rate = 1, pan = 0, delay = 0 } = {}) {
    if (!this.ctx) return;
    const names = SETS[set];
    for (let k = 0; k < this.power; k++) {
      const buf = this.buffers[names[(Math.random() * names.length) | 0]];
      // Layer 0 is the hit itself; extra power layers thicken it a few ms later, detuned and spread.
      const g = k ? gain * 0.6 : gain;
      const d = delay + (k ? Math.random() * 0.035 : 0);
      const pn = pan + (k ? (Math.random() - 0.5) * 0.5 : 0);
      if (!buf) {
        this.synthBang({ gain: g, pan: pn, delay: d, size: set === "boom" ? 1.6 : set === "sky" ? 1.2 : 0.8 });
        continue;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = rate * (k ? 0.82 + Math.random() * 0.3 : 0.94 + Math.random() * 0.12);
      src.connect(this.out(pn, g));
      src.start(this.now(d));
    }
  }

  /** Low body under big bombs: a falling sine plus a short lowpassed noise. */
  thump({ gain = 1, pan = 0, delay = 0, freq = 70, dur = 0.6 } = {}) {
    if (!this.ctx) return;
    const t = this.now(delay);
    const o = this.ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.42, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.out(pan, 1));
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  synthBang({ gain = 1, pan = 0, delay = 0, size = 1 } = {}) {
    if (!this.ctx) return;
    const t = this.now(delay);
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(9000, t);
    f.frequency.exponentialRampToValueAtTime(180, t + 0.25 * size);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35 * size);
    src.connect(f);
    f.connect(g);
    g.connect(this.out(pan, 1));
    src.start(t, Math.random() * 1.5);
    src.stop(t + 0.4 * size);
    this.thump({ gain: gain * 0.6, pan, delay, freq: 90 / size, dur: 0.3 * size });
  }

  /**
   * Continuous shaped noise (anar hiss, chakri, sparkler, fuse).
   * Returns a handle with stop() and set(gain).
   */
  hiss({ gain = 0.3, pan = 0, low = 1500, high = 7000, dur = 4, attack = 0.2, release = 0.6, flutter = 0 } = {}) {
    if (!this.ctx) return { stop() {}, set() {}, pitch() {} };
    const t = this.now();
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = low;
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = high;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    if (flutter > 0) {
      // Random amplitude steps make the hiss crackle like burning powder.
      let k = t + attack;
      while (k < t + dur) {
        g.gain.setValueAtTime(gain * (1 - flutter + Math.random() * flutter * 1.6), k);
        k += 0.012 + Math.random() * 0.03;
      }
    }
    g.gain.setValueAtTime(gain, t + Math.max(attack, dur - release));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(hp);
    hp.connect(lp);
    lp.connect(g);
    g.connect(this.out(pan, 1));
    src.start(t, Math.random() * 2);
    src.stop(t + dur + 0.1);
    const ctx = this.ctx;
    return {
      stop() {
        const n = ctx.currentTime;
        g.gain.cancelScheduledValues(n);
        g.gain.setTargetAtTime(0.0001, n, 0.08);
        src.stop(n + 0.5);
      },
      set(v) {
        g.gain.cancelScheduledValues(ctx.currentTime);
        g.gain.setTargetAtTime(Math.max(0.0001, v), ctx.currentTime, 0.05);
      },
      pitch(hz) {
        lp.frequency.setTargetAtTime(hz, ctx.currentTime, 0.05);
      },
    };
  }

  /** Short, dry pops scattered in time: glitter crackle, sparkler spits. */
  crackle({ gain = 0.4, pan = 0, delay = 0, dur = 1.2, count = 40 } = {}) {
    if (!this.ctx) return;
    const t = this.now(delay);
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2400;
    bp.Q.value = 0.7;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    for (let i = 0; i < count; i++) {
      const k = t + Math.random() * dur;
      const a = gain * (0.3 + Math.random() * 0.7);
      g.gain.setValueAtTime(a, k);
      g.gain.setValueAtTime(0, k + 0.004 + Math.random() * 0.01);
    }
    src.connect(bp);
    bp.connect(g);
    g.connect(this.out(pan, 1));
    src.start(t, Math.random());
    src.stop(t + dur + 0.1);
  }

  /** Rocket lift-off: bandpassed noise sweeping up, with an optional whistle. */
  whoosh({ gain = 0.5, pan = 0, dur = 1.2, whistle = false } = {}) {
    if (!this.ctx) return;
    const t = this.now();
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(500, t);
    bp.frequency.exponentialRampToValueAtTime(3800, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.05);
    g.gain.exponentialRampToValueAtTime(gain * 0.3, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.out(pan, 1));
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
    if (whistle) {
      const o = this.ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(1400, t);
      o.frequency.exponentialRampToValueAtTime(2600, t + dur);
      const og = this.ctx.createGain();
      og.gain.setValueAtTime(0.0001, t);
      og.gain.exponentialRampToValueAtTime(gain * 0.12, t + 0.1);
      og.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(og);
      og.connect(this.out(pan, 1));
      o.start(t);
      o.stop(t + dur + 0.05);
    }
  }
}

function makeNoise(ctx, seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function readSaved() {
  try {
    const v = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (v && typeof v.volume === "number") return { volume: v.volume, muted: !!v.muted };
  } catch {}
  return { volume: 0.7, muted: false };
}
