# 14-day launch set

Written in Natrajan's first person. Diwali is Sunday 8 November 2026, so the set runs 6–19 November.

Replace `{SITE}` with the production URL before posting: https://diwali.click. Every link carries `utm_source={network}&utm_medium=social&utm_campaign=launch`.

Post only after `{SITE}/play` works on the production URL. None of these are scheduled; the accounts aren't connected.

| Day | Date | Network | Post |
| --- | --- | --- | --- |
| 1 | Fri 6 Nov | X | Day 1: the gap |
| 1 | Fri 6 Nov | LinkedIn | Day 1: the gap, longer |
| 2 | Sat 7 Nov | X | Build in public: the sound |
| 3 | Sun 8 Nov | X, Instagram, YouTube Shorts | Diwali night video (see video-script.md) |
| 3 | Sun 8 Nov | WhatsApp status | Diwali night |
| 4 | Mon 9 Nov | X | Build in public: the volume slider |
| 5 | Tue 10 Nov | LinkedIn | Positioning fact: what the others do well |
| 6 | Wed 11 Nov | X | The ladi |
| 7 | Thu 12 Nov | X | Open source line |
| 8 | Fri 13 Nov | LinkedIn | Open source, longer |
| 9 | Sat 14 Nov | X | Jhaadu |
| 10 | Sun 15 Nov | X | MCP for developers |
| 11 | Mon 16 Nov | X | Self-host in one command |
| 12 | Tue 17 Nov | Reddit r/developersIndia | Show-and-tell |
| 13 | Wed 18 Nov | X | Gentle mode |
| 14 | Thu 19 Nov | X, LinkedIn | What I'd add next year |

---

## Day 1 · X

The legal limit for one Indian firecracker is 125 dB(AI) at 4 metres.

I built a cracker shop where the limit is a slider you control. 15 patakhe, real recorded bangs, 0 grams of smoke, ₹0.

{SITE}/?utm_source=x&utm_medium=social&utm_campaign=launch

## Day 1 · LinkedIn

Two numbers from Diwali 2025 in Delhi-NCR:

125 dB(AI): the legal noise ceiling for a single cracker, measured 4 metres away.
3 hours a day: the window for green crackers, on two days only. Laris (the joined strings) couldn't be made or sold at all.

This year I built Green Patakha. You pick a phuljhadi, anar, sutli bomb or 1000 wala ladi and tap the street. The bangs are cut from real field recordings. The volume goes from 0 to 100, so the dog, the newborn and the neighbours get a say.

It's free, there's no login, and it's MIT open source.

{SITE}/?utm_source=linkedin&utm_medium=social&utm_campaign=launch

Sources: PIB noise standards (Environment Protection Rules, Schedule I No. 89); Supreme Court order of 15 Oct 2025, directions E and I.

## Day 2 · X (build in public)

Most browser crackers make their bangs from synthesised noise. One even says "There are no recordings."

Mine cut 14 single bangs out of CC0 field recordings, then pitch and pan each blast so no two sound alike. The boom of a sky shot arrives after the flash, like outside.

{SITE}/play?utm_source=x&utm_medium=social&utm_campaign=launch

## Day 3 · X / Instagram / Shorts caption

Happy Diwali. 15 patakhe, real sound, 0 grams of smoke. Turn it up.

{SITE}/play?utm_source=instagram&utm_medium=social&utm_campaign=launch

(Use utm_source=x or utm_source=youtube on those networks.)

## Day 3 · WhatsApp status

Bursting crackers on my phone tonight. Real sound, no smoke, free: {SITE}/play?utm_source=whatsapp&utm_medium=social&utm_campaign=launch

## Day 4 · X (build in public)

The volume slider is volume squared, not linear, because ears hear loudness that way. 30 feels like a quiet bang, not a whisper.

There's also a limiter on the master bus, so 15 hydrogen bombs at once don't clip your speakers. Someone tested that on day one.

{SITE}/play?utm_source=x&utm_medium=social&utm_campaign=launch

## Day 5 · LinkedIn (positioning fact)

Before building Green Patakha I opened every virtual cracker site I could find. Some are better than mine at things I didn't try to do:

Virtual Diwali is a full 3D night: walk the mohalla to the ghat, light 108 diyas, send a lantern into a shared sky.
Faris Farooq Rah's simulator lets you write a wish with the phuljhadi and share it.
OXAAM is a timing game with a score.

What I wanted was narrower: every cracker unlocked from the first tap, real recorded bangs, and a volume slider instead of only a mute button. The comparison, with sources, is here:

{SITE}/compare?utm_source=linkedin&utm_medium=social&utm_campaign=launch

## Day 6 · X

The 1000 wala ladi: 90 pops along one fuse, each a real bang, and the string jumps as it goes. It leaves red paper all over the street.

Delhi banned laris in 2025. This one is one tap.

{SITE}/play?utm_source=x&utm_medium=social&utm_campaign=launch

## Day 7 · X (open source)

Green Patakha is MIT licensed. Fork it, add your city's favourite cracker, run it on your own server.

One file lists all 15 crackers; the browser and the server both read it.

https://github.com/njaiswal78/green-patakha?utm_source=x&utm_medium=social&utm_campaign=launch

## Day 8 · LinkedIn (open source)

I open-sourced the Diwali cracker site I built this year.

What's inside: a Web Audio engine (recorded bangs, synthesised fuse hiss and rocket whistle, a limiter), a canvas particle engine (drag, gravity, bouncing sparks, glitter that splits, smoke, paper that stays on the street), and one Hono app that serves the pages, a REST API and an MCP server.

It runs on one Cloudflare Worker, or with `docker compose up -d` on any server.

https://github.com/njaiswal78/green-patakha?utm_source=linkedin&utm_medium=social&utm_campaign=launch

## Day 9 · X

The morning after Diwali, the street is red paper and scorch marks.

Green Patakha keeps all of it where it landed until you press Jhaadu.

{SITE}/play?utm_source=x&utm_medium=social&utm_campaign=launch

## Day 10 · X (developers)

Your AI assistant can read the cracker shop. Point it at {SITE}/mcp: two tools, list_crackers and get_stats.

Docs: {SITE}/docs/mcp?utm_source=x&utm_medium=social&utm_campaign=launch

## Day 11 · X

Run your own green Diwali site:

git clone https://github.com/njaiswal78/green-patakha
cp .env.example .env
docker compose up -d

{SITE}/docs/self-host?utm_source=x&utm_medium=social&utm_campaign=launch

## Day 12 · Reddit r/developersIndia

Title: I built a Diwali cracker site with real recorded sound and open-sourced it

Body: 15 Indian crackers (phuljhadi to hydrogen bomb) on a canvas, with bangs cut from CC0 field recordings and a volume slider. No login, no ads. Stack is vanilla JS + Web Audio in the browser, Hono on one Cloudflare Worker with D1 for a shared counter, and a Node + SQLite path for Docker. Happy to answer questions about the particle or audio side.

Play: {SITE}/play?utm_source=reddit&utm_medium=social&utm_campaign=launch
Code: https://github.com/njaiswal78/green-patakha

## Day 13 · X

If flashes bother you, switch on Gentle flashes: dimmer bursts, no screen shake. It turns on by itself when your device asks for reduced motion.

{SITE}/play?utm_source=x&utm_medium=social&utm_campaign=launch

## Day 14 · X / LinkedIn

What I'd add to Green Patakha next year: sharing a show as a link, more regional crackers, and a "quiet hours" mode.

The repo takes pull requests. Which cracker is missing from your childhood?

https://github.com/njaiswal78/green-patakha?utm_source=x&utm_medium=social&utm_campaign=launch
