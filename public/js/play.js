import { CRACKERS, LOUDNESS_LABEL } from "./catalog.js";
import { Sound } from "./audio.js";
import { Show } from "./show.js";

const $ = (s) => document.querySelector(s);
const tray = $("#tray");
const canvas = $("#sky");
const hint = $("#hint");
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="];

if ("audioSession" in navigator) {
  // iOS: play through the silent switch, like a video would.
  try { navigator.audioSession.type = "playback"; } catch {}
}

const sound = new Sound();
let selected = localStorage.getItem("gp.sel") || "anar";
if (!CRACKERS.some((c) => c.id === selected)) selected = "anar";

// ---------- counters ----------

const mineEl = $("#mine");
const allEl = $("#all");
const fmt = new Intl.NumberFormat("en-IN");
let mine = Number(localStorage.getItem("gp.mine") || 0);
let everyone = null;
let pending = {};
mineEl.textContent = fmt.format(mine);

function onFire(id) {
  mine++;
  pending[id] = (pending[id] || 0) + 1;
  mineEl.textContent = fmt.format(mine);
  if (everyone !== null) allEl.textContent = fmt.format(++everyone);
  localStorage.setItem("gp.mine", String(mine));
}

function flush(beacon = false) {
  if (!Object.keys(pending).length) return;
  const body = JSON.stringify({ counts: pending });
  pending = {};
  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon("/api/v1/fires", new Blob([body], { type: "application/json" }));
    return;
  }
  fetch("/api/v1/fires", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (d?.total != null) {
        everyone = d.total;
        allEl.textContent = fmt.format(everyone);
      }
    })
    .catch(() => {});
}

function refreshStats() {
  fetch("/api/v1/stats")
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (d?.total != null) {
        everyone = Math.max(everyone ?? 0, d.total);
        allEl.textContent = fmt.format(everyone);
      }
    })
    .catch(() => { allEl.textContent = "—"; });
}

setInterval(() => flush(), 5000);
setInterval(refreshStats, 30000);
refreshStats();
addEventListener("pagehide", () => flush(true));
document.addEventListener("visibilitychange", () => document.hidden && flush(true));

// ---------- show ----------

const show = new Show(canvas, sound, { bottomInset: tray.offsetHeight, onFire });
const fitTray = () => {
  show.bottomInset = tray.offsetHeight;
  document.documentElement.style.setProperty("--tray", `${tray.offsetHeight}px`);
};
fitTray();
new ResizeObserver(fitTray).observe(tray);

// ---------- Sutli Bhai ----------

const mascot = $("#mascot");
const say = $("#say");
let bhai = null;
let poseTimer = 0;
let sayTimer = 0;
const restPose = () => (sound.muted ? "sleep" : autoTimer ? "hyped" : "idle");
function pose(p, ms = 0, line = "") {
  if (!bhai) return;
  bhai.setAttribute("data-pose", p);
  clearTimeout(poseTimer);
  if (ms) poseTimer = setTimeout(() => bhai.setAttribute("data-pose", restPose()), ms);
  if (line) {
    say.textContent = line;
    say.classList.add("on");
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => say.classList.remove("on"), 1800);
  }
}
fetch("/mascot.svg")
  .then((r) => (r.ok ? r.text() : Promise.reject()))
  .then((svg) => {
    mascot.insertAdjacentHTML("afterbegin", svg);
    bhai = mascot.querySelector("svg");
    if (autoTimer) pose("hyped", 0, "Mela shuru!");
    else pose("wave", 2600, "Diwali mubarak! Chalo phodte hain.");
  })
  .catch(() => {});

const playSample = sound.sample.bind(sound);
sound.sample = (set, o = {}) => {
  if (set === "boom" && !sound.muted) setTimeout(() => pose("boom", 1100, "Kya awaaz hai!"), (o.delay || 0) * 1000);
  return playSample(set, o);
};
const isLoud = (id) => CRACKERS.find((c) => c.id === id)?.loudness === 3;
const brace = (id) => isLoud(id) && !sound.muted && pose("ears", 3500, "Kaan band karo!");

const gentleBtn = $("#gentle");
const savedGentle = localStorage.getItem("gp.gentle");
if (savedGentle !== null) show.gentle = savedGentle === "1";
gentleBtn.setAttribute("aria-pressed", String(show.gentle));
gentleBtn.addEventListener("click", () => {
  show.gentle = !show.gentle;
  gentleBtn.setAttribute("aria-pressed", String(show.gentle));
  localStorage.setItem("gp.gentle", show.gentle ? "1" : "0");
});

// ---------- tray ----------

CRACKERS.forEach((c, i) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "card";
  b.dataset.id = c.id;
  b.setAttribute("role", "radio");
  b.title = `${c.name} (${c.english}). ${LOUDNESS_LABEL[c.loudness]}. ${c.about}`;
  const img = document.createElement("img");
  img.src = `/crackers/${c.id}.svg`;
  img.alt = "";
  img.width = 48;
  img.height = 56;
  const key = document.createElement("span");
  key.className = "key";
  key.textContent = KEYS[i];
  const hi = document.createElement("span");
  hi.className = "hi";
  hi.textContent = c.hindi;
  const en = document.createElement("span");
  en.className = "en";
  en.textContent = c.name;
  const loud = document.createElement("span");
  loud.className = "loud";
  loud.setAttribute("aria-label", LOUDNESS_LABEL[c.loudness]);
  for (let k = 0; k < 3; k++) {
    const d = document.createElement("i");
    if (k < c.loudness) d.className = "on";
    loud.append(d);
  }
  b.append(key, img, hi, en, loud);
  b.addEventListener("click", () => select(c.id));
  tray.append(b);
});

function select(id, quiet = false) {
  if (!quiet && id !== selected && isLoud(id)) pose("hyped", 1400, "Ye wala? Kaan sambhal ke!");
  selected = id;
  localStorage.setItem("gp.sel", id);
  for (const b of tray.children) b.setAttribute("aria-checked", String(b.dataset.id === id));
  tray.querySelector(`[data-id="${id}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  sound.unlock();
}
select(selected, true);

// ---------- firing ----------

let drag = null;

function point(e) {
  const r = canvas.getBoundingClientRect();
  return [e.clientX - r.left, e.clientY - r.top];
}

canvas.addEventListener("pointerdown", (e) => {
  sound.unlock();
  hint.classList.add("gone");
  const [x, y] = point(e);
  const held = show.itemAt(x, y);
  if (held) {
    drag = held;
    canvas.setPointerCapture(e.pointerId);
    return;
  }
  if (show.fire(selected, x, y)) brace(selected);
});
canvas.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const [x, y] = point(e);
  drag.moveTo(x, y);
});
const endDrag = () => { drag = null; };
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);

function fireRandom(id = selected) {
  show.fire(id, 40 + Math.random() * (show.W - 80));
}

// ---------- auto mela ----------

const autoBtn = $("#auto");
let autoTimer = null;
const AUTO_POOL = ["anar", "chakri", "rocket", "rocket", "skyshot", "bijli", "sutli", "ladi", "phuljhadi", "pencil", "rocket", "anar", "hydrogen"];
function autoTick() {
  fireRandom(AUTO_POOL[(Math.random() * AUTO_POOL.length) | 0]);
  autoTimer = setTimeout(autoTick, 900 + Math.random() * 1600);
}
function toggleAuto() {
  sound.unlock();
  hint.classList.add("gone");
  if (autoTimer) {
    clearTimeout(autoTimer);
    autoTimer = null;
  } else {
    autoTick();
  }
  autoBtn.setAttribute("aria-pressed", String(!!autoTimer));
  pose(restPose(), 0, autoTimer ? "Mela shuru!" : "");
}
autoBtn.addEventListener("click", toggleAuto);
$("#sweep").addEventListener("click", () => {
  show.sweep();
  pose("wave", 1500, "Safai bhi zaroori hai.");
});

// ---------- volume ----------

const vol = $("#volume");
const volNum = $("#volnum");
const muteBtn = $("#mute");
const SPEAKER_ON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>';
const SPEAKER_OFF = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
let wasMuted = sound.muted;
sound.onChange((s) => {
  if (s.muted !== wasMuted) {
    wasMuted = s.muted;
    pose(restPose(), 0, s.muted ? "Shhh… so raha hoon." : "Jaag gaya!");
  }
  const v = Math.round(s.volume * 100);
  vol.value = String(v);
  volNum.textContent = s.muted ? "0" : String(v);
  muteBtn.innerHTML = s.muted || v === 0 ? SPEAKER_OFF : SPEAKER_ON;
  muteBtn.setAttribute("aria-label", s.muted ? "Unmute (M)" : "Mute (M)");
});
vol.addEventListener("input", () => {
  sound.unlock();
  sound.setVolume(Number(vol.value) / 100);
});
muteBtn.addEventListener("click", () => {
  sound.unlock();
  sound.toggleMute();
});

$("#full").addEventListener("click", toggleFull);
function toggleFull() {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.().catch(() => {});
}

// ---------- keyboard ----------

addEventListener("keydown", (e) => {
  if (e.target instanceof HTMLInputElement && e.key !== " ") return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const i = KEYS.indexOf(e.key);
  if (i >= 0 && CRACKERS[i]) {
    select(CRACKERS[i].id);
    return;
  }
  const k = e.key.toLowerCase();
  if (e.key === " " || e.key === "Enter") {
    if (e.target instanceof HTMLButtonElement) return;
    e.preventDefault();
    sound.unlock();
    hint.classList.add("gone");
    fireRandom();
    brace(selected);
  } else if (k === "m") {
    sound.unlock();
    sound.toggleMute();
  } else if (k === "a") {
    toggleAuto();
  } else if (k === "f") {
    toggleFull();
  } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    if (e.target === vol) return;
    e.preventDefault();
    sound.unlock();
    sound.setVolume(sound.volume + (e.key === "ArrowUp" ? 0.05 : -0.05));
  }
});

if (new URLSearchParams(location.search).has("auto")) toggleAuto();

window.greenPatakha = { show, sound, fire: (id, x, y) => show.fire(id, x, y), select };
