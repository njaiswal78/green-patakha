import { CRACKERS, LOUDNESS_LABEL, cleanWish } from "./catalog.js";
import { openWish, sealWish } from "./seal.js";
import { Sound } from "./audio.js";
import { Show } from "./show.js";

const $ = (s) => document.querySelector(s);
const tray = $("#tray");
const canvas = $("#sky");
const hint = $("#hint");
const intro = $("#intro");
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "q", "w", "e"];

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
  if (MILESTONES.has(mine)) say(`${fmt.format(mine)} patakhe!`, true);
  else if (mine % 15 === 0) greet();
  if (++played === 12) nudgeWish();
}
let played = 0;

// ---------- sky messages ----------

const GREETINGS = ["Happy Diwali", "शुभ दीपावली", "Happy Diwali", "दीपावली मुबारक", "Shubh Deepavali", "Aur phodo!", "Roshan raho"];
const MILESTONES = new Set([10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]);
// Old links carried the wish in plain text as ?wish=; new ones seal it in the fragment.
let wish = cleanWish(new URLSearchParams(location.search).get("wish")) || cleanWish(await openWish(new URLSearchParams(location.hash.slice(1)).get("w")));
let lastSay = -1e9;
function say(text, force = false) {
  const now = performance.now();
  if (!force && now - lastSay < 7000) return;
  lastSay = now;
  show.skyText(text);
}
const greet = () => say(wish && Math.random() < 0.5 ? wish : GREETINGS[(Math.random() * GREETINGS.length) | 0]);

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

const gentleBtn = $("#gentle");
const savedGentle = localStorage.getItem("gp.gentle");
if (savedGentle !== null) show.gentle = savedGentle === "1";
gentleBtn.setAttribute("aria-pressed", String(show.gentle));
gentleBtn.addEventListener("click", () => {
  show.gentle = !show.gentle;
  gentleBtn.setAttribute("aria-pressed", String(show.gentle));
  localStorage.setItem("gp.gentle", show.gentle ? "1" : "0");
});

const powerBtn = $("#power");
function setPower(n) {
  show.power = n;
  sound.setPower(n);
  powerBtn.textContent = `${n}×`;
  powerBtn.setAttribute("aria-pressed", String(n > 1));
  localStorage.setItem("gp.power", String(n));
}
const cyclePower = () => setPower({ 2: 4, 4: 1 }[show.power] ?? 2);
setPower([1, 2, 4].includes(Number(localStorage.getItem("gp.power"))) ? Number(localStorage.getItem("gp.power")) : 1);
powerBtn.addEventListener("click", cyclePower);

// ---------- tray ----------

CRACKERS.forEach((c, i) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "card";
  b.dataset.id = c.id;
  b.setAttribute("role", "radio");
  b.title = `${c.name} (${c.english}). ${LOUDNESS_LABEL[c.loudness]}. ${c.about}`;
  const img = document.createElement("img");
  img.src = `/photos/${c.id}.jpg`;
  img.alt = "";
  img.width = 52;
  img.height = 52;
  const key = document.createElement("span");
  key.className = "key";
  key.textContent = KEYS[i]?.toUpperCase() ?? "";
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

function select(id) {
  selected = id;
  localStorage.setItem("gp.sel", id);
  for (const b of tray.children) b.setAttribute("aria-checked", String(b.dataset.id === id));
  tray.querySelector(`[data-id="${id}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  sound.unlock();
}
select(selected);

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
  show.fire(selected, x, y);
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
const AUTO_POOL = ["anar", "chakri", "rocket", "rocket", "skyshot", "bijli", "sutli", "ladi", "phuljhadi", "pencil", "rocket", "anar", "hydrogen", "multirocket", "bullet", "ladi100"];
function autoTick() {
  fireRandom(AUTO_POOL[(Math.random() * AUTO_POOL.length) | 0]);
  if (Math.random() < 0.08) greet();
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
}
autoBtn.addEventListener("click", toggleAuto);
$("#sweep").addEventListener("click", () => show.sweep());

// ---------- volume ----------

const vol = $("#volume");
const volNum = $("#volnum");
const muteBtn = $("#mute");
const SPEAKER_ON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>';
const SPEAKER_OFF = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
sound.onChange((s) => {
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
  if (e.target instanceof HTMLInputElement && (e.target.type !== "range" || e.key !== " ")) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const i = KEYS.indexOf(e.key.toLowerCase());
  if (i >= 0 && CRACKERS[i]) {
    select(CRACKERS[i].id);
    return;
  }
  const k = e.key.toLowerCase();
  if (e.key === " " || e.key === "Enter") {
    if (e.target instanceof HTMLButtonElement) return;
    if (!intro.classList.contains("gone")) {
      e.preventDefault();
      enter();
      return;
    }
    e.preventDefault();
    sound.unlock();
    hint.classList.add("gone");
    fireRandom();
  } else if (k === "m") {
    sound.unlock();
    sound.toggleMute();
  } else if (k === "a") {
    toggleAuto();
  } else if (k === "f") {
    toggleFull();
  } else if (k === "p") {
    cyclePower();
  } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    if (e.target === vol) return;
    e.preventDefault();
    sound.unlock();
    sound.setVolume(sound.volume + (e.key === "ArrowUp" ? 0.05 : -0.05));
  }
});

// ---------- intro ----------

// A silent show runs behind the title screen. It does not count: onFire is swapped out until the visitor enters.
const DEMO = ["skyshot", "rocket", "rocket", "anar", "chakri", "anar", "phuljhadi", "skyshot", "pencil", "multirocket"];
let demoTimer = 0;
function demoTick() {
  show.fire(DEMO[(Math.random() * DEMO.length) | 0], 60 + Math.random() * (show.W - 120));
  if (Math.random() < 0.12) say(wish || "Happy Diwali");
  demoTimer = setTimeout(demoTick, 600 + Math.random() * 700);
}
function enter() {
  if (intro.classList.contains("gone")) return;
  clearTimeout(demoTimer);
  show.onFire = onFire;
  show.sweep();
  intro.classList.add("gone");
  hint.classList.remove("gone");
  sound.unlock();
  show.fire("sutli", show.W / 2, show.groundY + (show.H - show.groundY) * 0.45);
  setTimeout(() => say(wish || "Happy Diwali", true), 3600);
}
intro.addEventListener("click", (e) => { if (!e.target.closest("a")) enter(); });

const sender = cleanWish(new URLSearchParams(location.search).get("from"), 20);

const wishBox = $("#wishbox");
const wishInput = $("#wish");
const fromInput = $("#wishfrom");
const shareBtn = $("#wishshare");
const waLink = $("#wishwa");
// Sent from the sender's own chat, so first person and no wish text: it should be a surprise in the sky.
const WISH_TEXT = "Happy Diwali! 🪔 I wrote you a wish in fireworks. Open it with sound on 🔊";
// Sealed ahead of time on every edit: share sheets only open from a tap, so the link must be ready synchronously.
let shareUrl = location.origin + "/";
let sealing = 0;
let sealed = 0;
const wishShare = () => ({ url: shareUrl, text: WISH_TEXT });
const syncWa = async () => {
  const bad = (i, max) => i.value.trim() && !cleanWish(i.value, max) ? "Links, emails and phone numbers can't go in the sky." : "";
  wishInput.setCustomValidity(bad(wishInput, 24));
  fromInput.setCustomValidity(bad(fromInput, 20));
  try { localStorage.setItem("gp.from", fromInput.value.trim()); } catch {}
  const n = ++sealing;
  const w = cleanWish(wishInput.value) || "Happy Diwali";
  const f = cleanWish(fromInput.value, 20);
  const u = new URL("/", location.href);
  if (f) u.searchParams.set("from", f);
  try {
    u.hash = `w=${await sealWish(w)}`;
  } catch {
    u.searchParams.set("wish", w); // no Web Crypto (plain http on a LAN self-host): fall back to the readable link
  }
  if (n !== sealing) return;
  sealed = n;
  shareUrl = u.href;
  waLink.href = `https://wa.me/?text=${encodeURIComponent(`${WISH_TEXT} ${shareUrl}`)}`;
};
wishInput.addEventListener("input", syncWa);
fromInput.addEventListener("input", syncWa);
const shareable = () => [wishInput, fromInput].every((i) => i.reportValidity()) && sealed === sealing;
waLink.addEventListener("click", (e) => shareable() || e.preventDefault());
function openWishBox() {
  nudge.hidden = true;
  wishInput.value = wish;
  try { fromInput.value = localStorage.getItem("gp.from") || ""; } catch {}
  wishBox.returnValue = "";
  shareBtn.textContent = "Share link";
  syncWa();
  wishBox.showModal();
}
$("#wishbtn").addEventListener("click", openWishBox);
// The intro's own click handler enters the game as this click bubbles; the box opens on top.
$("#introwish").addEventListener("click", openWishBox);
// Once per visit, a dozen crackers in, remind people they can send their own wish.
const nudge = $("#wishnudge");
nudge.addEventListener("click", openWishBox);
function nudgeWish() {
  if (!vidReady.hidden || !$("#soundtap").hidden || wishBox.open) return;
  nudge.hidden = false;
  setTimeout(() => (nudge.hidden = true), 9000);
}
wishBox.addEventListener("close", () => {
  const w = cleanWish(wishInput.value);
  if (wishBox.returnValue !== "fire" || !w) return;
  wish = w;
  const q = new URLSearchParams(location.search);
  q.delete("wish");
  q.delete("from");
  sealWish(w).then((s) => history.replaceState(null, "", `${q.size ? `?${q}` : location.pathname}#w=${s}`), () => {});
  sound.unlock();
  hint.classList.add("gone");
  say(wish, true);
});
shareBtn.addEventListener("click", async () => {
  if (!shareable()) return;
  const { url, text } = wishShare();
  try {
    if (navigator.share) await navigator.share({ text, url });
    else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      shareBtn.textContent = "Link copied";
    }
  } catch {}
});

// ---------- status video ----------
// Records the sky canvas plus the game's own audio, then hands the clip to the share sheet (WhatsApp Status, Stories) or downloads it.
const vidBtn = $("#wishvideo");
const vidReady = $("#vidready");
let video = null;
if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream || !(window.AudioContext || window.webkitAudioContext)) vidBtn.hidden = true;
vidBtn.addEventListener("click", () => {
  if (!shareable()) return;
  if (vidReady.disabled) return;
  wishBox.close("fire");
  sound.unlock();
  const stream = show.canvas.captureStream(30);
  const dest = sound.ctx.createMediaStreamDestination();
  // Tap before the volume stage so the clip has full sound even if the player turned their speaker down.
  sound.clip.connect(dest);
  stream.addTrack(dest.stream.getAudioTracks()[0]);
  const type = ["video/mp4;codecs=avc1,mp4a.40.2", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm"].find((t) => MediaRecorder.isTypeSupported(t)) || "";
  const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 5e6 });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.onstop = () => {
    sound.clip.disconnect(dest);
    stream.getTracks().forEach((t) => t.stop());
    show.mark = "";
    const mime = rec.mimeType.split(";")[0] || "video/webm";
    video = new File(chunks, `diwali-wish.${mime.includes("mp4") ? "mp4" : "webm"}`, { type: mime });
    vidReady.disabled = false;
    vidReady.textContent = "📲 Share your Diwali video";
  };
  show.mark = `${location.host} · write your own wish in the sky`;
  vidReady.disabled = true;
  vidReady.textContent = "🔴 Recording your wish…";
  vidReady.hidden = false;
  rec.start(500);
  [["rocket", 0.25], ["skyshot", 0.8], ["multirocket", 3.5], ["skyshot", 5.5]].forEach(([id, t]) =>
    setTimeout(() => show.fire(id, show.W * (0.2 + Math.random() * 0.6)), t * 1000));
  const w = cleanWish(wishInput.value);
  setTimeout(() => say(w, true), 5000);
  setTimeout(() => rec.stop(), 10000);
});
vidReady.addEventListener("click", async () => {
  if (!video) return;
  const { text, url } = wishShare();
  try {
    if (navigator.canShare?.({ files: [video] })) await navigator.share({ files: [video], text: `${text} ${url}` });
    else {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(video);
      a.download = video.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    }
    vidReady.hidden = true;
    video = null;
  } catch {}
});

if (new URLSearchParams(location.search).has("auto")) {
  intro.classList.add("gone");
  toggleAuto();
} else if (wish) {
  // Browsers keep audio locked until a gesture, so a shared wish opens straight into a silent show and the first tap brings sound.
  intro.classList.add("gone");
  show.onFire = () => {};
  demoTick();
  setTimeout(() => say(wish, true), 400);
  const tap = $("#soundtap");
  tap.textContent = `🔊 ${sender ? `${sender} sent you a wish. ` : ""}Tap for sound`;
  tap.hidden = false;
  const start = (e) => {
    if (e.type === "keydown" && e.key !== " " && e.key !== "Enter") return;
    removeEventListener("pointerdown", start, true);
    removeEventListener("keydown", start, true);
    tap.hidden = true;
    clearTimeout(demoTimer);
    show.onFire = onFire;
    sound.unlock();
    say(wish, true);
    // Let the tap's own click land first, so tapping Auto mela or pressing A doesn't toggle it straight back off.
    setTimeout(() => { if (!autoTimer) toggleAuto(); }, 400);
  };
  addEventListener("pointerdown", start, true);
  addEventListener("keydown", start, true);
} else {
  show.onFire = () => {};
  demoTick();
  $("#start").focus();
}

window.greenPatakha = { show, sound, fire: (id, x, y) => show.fire(id, x, y), select };
