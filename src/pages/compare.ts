import { CHECKED, COMPETITORS, SRC } from "../sources";
import { esc, page } from "./layout";

export function comparePage(origin: string, repo: string) {
  const rows: [string, string, (c: (typeof COMPETITORS)[number]) => string][] = [
    ["Price", "Free. No ads, no purchase.", (c) => c.price],
    ["Crackers", "15, all unlocked", (c) => c.crackers],
    ["Sound", "Real recorded bangs (CC0 and public-domain field recordings), shaped noise for hiss and whoosh", (c) => c.sound],
    ["Volume", "Slider 0 to 100, remembered, plus mute", (c) => c.volume],
    ["How you fire", "Pick any cracker, tap anywhere, as often as you like", (c) => c.freedom],
    ["Open source", "Yes, MIT. Docker and Cloudflare self-host guides", (c) => c.openSource],
    ["Where they're ahead", "No 3D world, no greeting link, no score", (c) => c.extra],
  ];
  const head = `<tr><th></th><th class="us">Green Patakha</th>${COMPETITORS.map((c) => `<th><a href="${c.src.url}" rel="noopener">${esc(c.name)}</a></th>`).join("")}</tr>`;
  const body = rows
    .map(([label, us, f]) => `<tr><th>${esc(label)}</th><td class="us">${esc(us)}</td>${COMPETITORS.map((c) => `<td>${esc(f(c))}</td>`).join("")}</tr>`)
    .join("\n");

  const html = `
<section>
  <div class="wrap">
    <p class="eyebrow">Compare</p>
    <h1>Virtual Diwali crackers, compared.</h1>
    <p class="lead">Green Patakha is a free, open-source website where you burst 15 Indian crackers with real recorded sound and your own volume. Below is how it stacks up against four other browser cracker sites, using only what each site says about itself.</p>
    <p class="muted"><b>Scenario:</b> one family, one phone, Diwali night, wanting to burst crackers without smoke, with someone at home who'd rather it wasn't too loud.</p>
    <div class="cmp-wrap" style="margin-top:24px">
      <table class="cmp">
        <thead>${head}</thead>
        <tbody>
${body}
        </tbody>
      </table>
    </div>
    <p class="note">Checked ${CHECKED} from each site's own page: ${COMPETITORS.map((c) => `<a href="${c.src.url}" rel="noopener">${esc(c.src.label)}</a>`).join(", ")}. “Not listed” means the page we read doesn't say. Tell us if something changed and we'll fix it.</p>
  </div>
</section>

<section>
  <div class="wrap narrow">
    <h2>Where others are better</h2>
    <p><b>Virtual Diwali</b> is a full 3D night: you walk a mohalla to the ghat, light 108 diyas and send a lantern into a shared sky. Green Patakha is one street and the crackers.</p>
    <p><b>Faris Farooq Rah's simulator</b> lets you write a wish in light with the phuljhadi and send it as a link. We don't have sharing yet.</p>
    <p><b>ShareMyInvite</b> makes a personalised greeting with your family's name and photo. That's a paid product; we don't make greetings.</p>
    <p><b>OXAAM</b> is a timing game with a score and combos. If you want a challenge, that's the one.</p>
    <h2 style="margin-top:36px">Versus real crackers</h2>
    <p>The legal limit for a single cracker in India is 125 dB(AI) at 4 metres (<a href="${SRC.noiseRule.url}" rel="noopener">source</a>). In Delhi-NCR for Diwali 2025, green crackers were allowed 6–7 am and 8–10 pm on two days, and laris could not be made or sold (<a href="${SRC.scOrder.url}" rel="noopener">Supreme Court, 15 October 2025</a>). Green Patakha has no smoke, no time window and a volume knob. It doesn't replace the smell of the real thing, and it doesn't try to.</p>
    <p style="margin-top:28px"><a class="btn big" href="/play">Start bursting</a> <a class="btn big ghost" href="/about#pricing">See price: ₹0</a></p>
  </div>
</section>`;

  return page({
    title: "Virtual Diwali crackers compared: Green Patakha vs Virtual Diwali, OXAAM and others",
    description:
      "Green Patakha vs Virtual Diwali, the Faris Farooq Rah simulator, ShareMyInvite and OXAAM: price, crackers, real sound, volume control and open source, from each site's own page.",
    path: "/compare",
    body: html,
    origin,
    repo,
  });
}
