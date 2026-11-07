import { CRACKERS, LOUDNESS_LABEL } from "../../public/js/catalog.js";
import { CHECKED, SRC } from "../sources";
import { esc, page } from "./layout";

const FAQ: [string, string][] = [
  [
    "Is it really free?",
    "<b>Yes. ₹0, no login, no ads, nothing to buy.</b> It runs on one Cloudflare Worker that costs very little to keep online. The code is MIT, so it stays free even if this site goes away.",
  ],
  [
    "Are the sounds real?",
    "<b>Yes, every bang and boom is a real recording.</b> We cut single bangs out of CC0 and public-domain field recordings of firecrackers on Wikimedia Commons. Each blast picks a clip, shifts its pitch a little and pans it to where the cracker is, so no two sound the same. The hiss of an anar and the whoosh of a rocket are shaped noise, because that is what those sounds are.",
  ],
  [
    "How do I set the volume?",
    "<b>Drag the slider at the top, from 0 to 100.</b> Press M to mute and the arrow keys to nudge it. Your setting is saved for next time. A limiter stops ten bombs at once from clipping your speakers.",
  ],
  [
    "Is it OK for pets, babies and people sensitive to flashes?",
    "<b>Turn the volume down and switch on Gentle flashes.</b> Gentle flashes dims every flash and stops the screen shake. It switches on by itself when your phone or computer asks for reduced motion.",
  ],
  [
    "Does it work on my phone?",
    "<b>Yes, in any modern browser on Android or iPhone.</b> Tap once to start the sound. Hold the phone sideways for a wider street. Slower phones get fewer sparks so it stays smooth.",
  ],
  [
    "Which crackers are there?",
    `<b>15 crackers you'd find at an Indian patakha shop.</b> ${CRACKERS.map((c) => `${esc(c.name)} (${c.hindi})`).join(", ")}.`,
  ],
  [
    "Can I host it myself?",
    'Yes. <b>The code is MIT licensed and runs on your own server with one Docker command, or on your own Cloudflare account.</b> See <a href="/docs/self-host">self-host docs</a> and the GitHub repo linked below.',
  ],
  [
    "Do you track me?",
    "<b>No cookies, no analytics, no accounts.</b> We count how many of each cracker were fired, in total, so the page can show the number. Your IP address is used for a minute to rate-limit that counter and is never stored.",
  ],
  [
    "Can an AI assistant use it?",
    '<b>Yes, over MCP or plain REST.</b> Point your assistant at <code>/mcp</code> and it can list the crackers and read the live count. See <a href="/docs/mcp">MCP docs</a>.',
  ],
];

export function homePage(origin: string, repo: string) {
  const tray = CRACKERS.slice(0, 11)
    .map((c) => `<a href="/play"><img src="/crackers/${c.id}.svg" alt="" width="40" height="40"><b>${c.hindi}</b>${esc(c.name)}</a>`)
    .join("");

  const cards = CRACKERS.map(
    (c) => `<a class="cracker" href="/play">
  <div class="img"><img src="/crackers/${c.id}.svg" alt="${esc(c.name)} (${esc(c.english)})" width="120" height="120" loading="lazy"></div>
  <span class="hi">${c.hindi}</span>
  <span>${esc(c.name)}</span>
  <span class="en">${esc(c.english)}</span>
  <span class="lv">${LOUDNESS_LABEL[c.loudness]}</span>
</a>`,
  ).join("\n");

  const faq = FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${a}</p></details>`).join("\n");

  const body = `
<section class="hero">
  <div class="wrap">
    <img src="/crackers/sutli.svg" alt="A sutli bomb" width="110" height="128">
    <p class="eyebrow">Diwali 2026 · Sunday, 8 November</p>
    <h1>Burst 15 Indian patakhe with real sound.<br>0 grams of smoke.</h1>
    <p class="lead">Pick a phuljhadi, anar, sutli bomb or 1000 wala ladi and tap the street. The bangs are real recordings, not synthesised beeps, and you set the volume. Free, no login, open source.</p>
    <a class="btn big" href="/play">Start bursting</a>
    <p class="sub">Works on phones. Nothing to install.</p>
    <div class="frame">
      <div class="frame-bar"><i></i><i></i><i></i><span class="url">${esc(new URL(origin).host)}/play</span><span class="tag">Live preview · sound off</span></div>
      <div class="preview"><canvas id="preview" aria-label="A live preview of crackers going off"></canvas></div>
      <div class="preview-tray">${tray}</div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="eyebrow">What the real thing costs</p>
    <h2>Real crackers come with limits. These don't.</h2>
    <div class="grid3" style="margin-top:28px">
      <div class="card soft">
        <div class="muted">Legal noise ceiling, one cracker</div>
        <div class="stat">125 dB(AI)</div>
        <div class="muted">measured 4 metres away. A string of joined crackers gets a lower limit.</div>
      </div>
      <div class="card soft">
        <div class="muted">Hours you could burst green crackers in Delhi-NCR, Diwali 2025</div>
        <div class="stat">3 a day</div>
        <div class="muted">6–7 am and 8–10 pm, on two days only. Laris (joined strings) could not be made or sold at all.</div>
      </div>
      <div class="card">
        <div class="muted">Here</div>
        <div class="stat good">0 g smoke</div>
        <div class="muted">Any hour. Volume from 0 to 100, your choice. The 1000 wala ladi is one tap.</div>
      </div>
    </div>
    <p class="note">Sources, checked ${CHECKED}: <a href="${SRC.noiseRule.url}" rel="noopener">${esc(SRC.noiseRule.label)}</a>; <a href="${SRC.scOrder.url}" rel="noopener">${esc(SRC.scOrder.label)}</a>, directions E and I. Rules for 2026 may differ in your city.</p>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="eyebrow">Why this one</p>
    <h2>Other virtual crackers are fine. Here's what's different.</h2>
    <div class="why" style="margin-top:28px">
      <div class="card"><div class="n">1</div><div>
        <h3>Real recorded bangs.</h3>
        <p>Every sutli bomb, bijli and ladi pop plays a field recording of a real firecracker, pitched and panned per blast. The Faris Farooq Rah simulator says its sounds are built in the browser: “There are no recordings.”</p>
        <p class="src">Source: <a href="${SRC.faris.url}" rel="noopener">${esc(SRC.faris.label)}</a>, checked ${CHECKED}.</p>
      </div></div>
      <div class="card"><div class="n">2</div><div>
        <h3>A volume slider, not just a mute button.</h3>
        <p>Set it anywhere from 0 to 100 and it's remembered. Good for a sleeping baby, a nervous dog or a 2 am urge. Virtual Diwali says you “can mute it from the top corner”. OXAAM says “use the sound button to switch it off”.</p>
        <p class="src">Sources: <a href="${SRC.virtualDiwali.url}" rel="noopener">${esc(SRC.virtualDiwali.label)}</a>, <a href="${SRC.oxaam.url}" rel="noopener">${esc(SRC.oxaam.label)}</a>, checked ${CHECKED}.</p>
      </div></div>
      <div class="card"><div class="n">3</div><div>
        <h3>Fire at will, and read the code.</h3>
        <p>All 15 crackers from the first tap: no boxes to find, no 20-cracker rounds, no paid greeting. The whole thing is MIT open source, so you can run it yourself. None of the four sites we checked lists its source code.</p>
        <p class="src">Sources: <a href="${SRC.virtualDiwali.url}" rel="noopener">Virtual Diwali</a> (16 hidden boxes), <a href="${SRC.oxaam.url}" rel="noopener">OXAAM</a> (rounds of 20), <a href="${SRC.shareMyInvite.url}" rel="noopener">ShareMyInvite</a> (“One payment”), checked ${CHECKED}. <a href="/compare">Full comparison</a>.</p>
      </div></div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="eyebrow">How it works</p>
    <h2>Pick. Tap. Turn it up.</h2>
    <div class="steps" style="margin-top:28px">
      <div class="card step"><span class="num">STEP 1</span><div class="pic"><img src="/crackers/sutli.svg" alt="" width="69" height="80"></div><h3>Pick</h3><p class="muted">Choose a patakha from the tray. Keys 1 to 9 work too.</p></div>
      <div class="card step"><span class="num">STEP 2</span><div class="pic"><span class="tap"></span></div><h3>Tap</h3><p class="muted">Tap the street where you want it. The fuse catches, so step back.</p></div>
      <div class="card step"><span class="num">STEP 3</span><div class="pic"><div class="slider-mock"><span>Volume 70</span><div class="track"><div class="fill"></div><div class="knob"></div></div></div></div><h3>Turn it up</h3><p class="muted">Or down. Set the volume, or hit Auto mela and watch.</p></div>
    </div>
    <p style="text-align:center;margin-top:28px"><a class="btn big" href="/play">Start bursting</a></p>
  </div>
</section>

<section id="crackers">
  <div class="wrap">
    <p class="eyebrow">The cracker shop</p>
    <h2>15 crackers from every Indian childhood.</h2>
    <p class="lead">Each one burns the way the real one does: the anar sputters out, the chakri wanders toward your feet, the ladi jumps as it pops.</p>
    <div class="crackers" style="margin-top:28px">
${cards}
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="eyebrow">Details</p>
    <h2>Small things that make it feel real.</h2>
    <div class="scenes" style="margin-top:28px">
      <div class="card scene"><div class="ui"><span class="pill on">1000 wala</span><div class="pops">${'<i class="gone"></i>'.repeat(26)}${"<i></i>".repeat(30)}</div></div><h3>The ladi</h3><p class="muted">90 pops along one fuse, each a real bang. It leaves red paper all over the street.</p></div>
      <div class="card scene"><div class="ui"><span class="pill">Jhaadu</span><span>Paper, scorch marks and ash stay where they land until you sweep.</span></div><h3>Jhaadu</h3><p class="muted">One button clears the street, like the morning after.</p></div>
      <div class="card scene"><div class="ui"><span class="pill">Peony</span><span class="pill">Willow</span><span class="pill">Ring</span><span class="pill">Crackle</span></div><h3>Sky shots</h3><p class="muted">The 12 shot fires 12 shells. The boom arrives a moment after the flash, as it does outside.</p></div>
      <div class="card scene"><div class="ui"><span class="pill on">Gentle flashes</span><span>Dimmer flashes. No shake.</span></div><h3>Gentle mode</h3><p class="muted">On by itself if your device asks for reduced motion.</p></div>
      <div class="card scene"><div class="ui"><span class="pill on">Auto mela</span><span>Rockets, anars and bombs on their own, every second or two.</span></div><h3>Auto mela</h3><p class="muted">Leave it running on the TV while the family eats.</p></div>
      <div class="card scene"><div class="ui"><img src="/crackers/phuljhadi.svg" alt="" width="40" height="47"><span>Drag a lit phuljhadi to wave it.</span></div><h3>Phuljhadi in hand</h3><p class="muted">Grab a burning sparkler and draw circles in the dark.</p></div>
    </div>
  </div>
</section>

<section>
  <div class="wrap narrow">
    <p class="eyebrow">For agents</p>
    <h2>Your assistant can read the cracker shop.</h2>
    <div class="agent">
<span class="you">You:</span> Which Diwali crackers are on Green Patakha?<br>
<span class="tool">→ list_crackers</span><br>
Assistant: ${CRACKERS.length}. ${CRACKERS.map((c) => esc(c.name)).join(", ")}.<br>
<span class="you">You:</span> How many have people burst so far?<br>
<span class="tool">→ get_stats</span><br>
Assistant: Here's the live total, by cracker.
    </div>
    <p class="muted" style="margin-top:14px">Stateless MCP at <code>/mcp</code>, REST at <code>/api/v1</code>, and <a href="/llms.txt">llms.txt</a>. <a href="/docs/mcp">Read the MCP docs</a>.</p>
  </div>
</section>

<section>
  <div class="wrap founder">
    <p class="eyebrow">Why I built it</p>
    <h2>Hi, I'm Natrajan.</h2>
    <p>Diwali night in an Indian city is loud, bright and very smoky. I love the countdown before a sutli bomb as much as anyone. The morning air after it, less so. And every year someone at home is hiding from the noise: a dog, a newborn, a grandparent.</p>
    <p>So I built the cracker shop I wanted, with three rules:</p>
    <ol>
      <li><b>It has to sound real.</b> Recorded bangs, not beeps.</li>
      <li><b>Everyone sets their own volume.</b> The bang should be a choice.</li>
      <li><b>It's open source.</b> Read the code, fix a cracker, add your city's favourite, or <a href="/docs/self-host">run it on your own server</a>.</li>
    </ol>
    <p>Happy Diwali. Burst as many as you like.</p>
  </div>
</section>

<section id="pricing">
  <div class="wrap">
    <div class="price card">
      <p class="eyebrow">Price</p>
      <div class="amount">₹0</div>
      <p class="muted">Forever. No ads, no login, no in-app purchase.</p>
      <ul>
        <li>All 15 crackers, unlimited</li>
        <li>Real recorded sound, volume 0 to 100</li>
        <li>Auto mela, Jhaadu, Gentle flashes</li>
        <li>Phones, tablets, laptops and TVs</li>
        <li>MIT licensed source code</li>
      </ul>
      <a class="btn big" href="/play">Start bursting</a>
      <p class="note">The code is free to run yourself, with Docker or your own Cloudflare account.</p>
    </div>
  </div>
</section>

<section id="faq">
  <div class="wrap narrow faq">
    <h2>Questions</h2>
${faq}
  </div>
</section>

<section class="close">
  <div class="wrap">
    <h2>Burst all 15 tonight. 0 grams of smoke.</h2>
    <p class="lead" style="margin:0 auto 24px">Real sound at your volume, in your browser, free.</p>
    <a class="btn big" href="/play">Start bursting</a>
  </div>
</section>`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Green Patakha",
      applicationCategory: "GameApplication",
      operatingSystem: "Any modern web browser",
      url: origin,
      description: "Burst 15 Indian Diwali crackers in the browser with real recorded sound and zero smoke. Free and open source.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      license: "https://opensource.org/licenses/MIT",
      codeRepository: repo,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map(([q, a]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a.replace(/<[^>]+>/g, "") },
      })),
    },
  ];

  return page({
    title: "Green Patakha: burst Indian Diwali crackers online with real sound, zero smoke",
    description:
      "Free virtual Diwali crackers: phuljhadi, anar, chakri, sutli bomb, 1000 wala ladi, rockets and more. Real recorded sound, your own volume, no login. Open source.",
    path: "/about",
    body,
    origin,
    repo,
    jsonLd,
    scripts: ["/js/preview.js"],
  });
}
