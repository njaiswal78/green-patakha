# Green Patakha

Burst 12 Indian Diwali crackers in your browser, with real recorded sound, your own volume, and zero smoke.

Phuljhadi, anar, chakri, bijli, sutli, hydrogen bomb, ladi, rocket, sky shot, saanp goli and more. Tap where you want it, pick the next one, turn the volume down when the baby is asleep.

- Play: `/` (also `/play`) · About: `/about` · Compare: `/compare` · Docs: `/docs` · MCP: `/mcp` · `llms.txt`

## Run it on your server

Needs Docker.

```sh
git clone https://github.com/njaiswal78/green-patakha.git
cd green-patakha
cp .env.example .env        # set APP_ORIGIN to the URL you will serve it on
docker compose up -d
```

Open `http://your-server:8080`. The counter is a SQLite file on the `data` volume. Put Caddy or your host's proxy in front for HTTPS, then set `APP_ORIGIN` to the `https://` URL and run `docker compose up -d` again.

Without Docker: Node 22.13 or newer, `npm ci --omit=dev && npm start`.

## Run it on your own Cloudflare account

```sh
npm install
npx wrangler login
npx wrangler d1 create green-patakha          # paste database_id into wrangler.jsonc
npx wrangler d1 migrations apply green-patakha --remote
npx wrangler deploy
```

Set `APP_ORIGIN` in `wrangler.jsonc` to your domain and add it as a Custom Domain on the Worker.

Local development: `npm run db:migrate:local && npm run dev`, then open http://localhost:8787. `npm run check` type-checks and validates text encoding.

## Just the game

Everything on `/play` is static files in `public/`. Any static host can serve that folder; the "by everyone" counter shows a dash and the crackers work the same.

## How it's built

- `public/js/audio.js`: Web Audio. Recorded bangs with random pitch and stereo pan, synthesized fuse hiss, crackle and whistle, a limiter on the master bus. Sky bursts are heard after they're seen.
- `public/js/show.js`, `public/js/items.js`: Canvas particle engine with drag, gravity, bouncing sparks, glitter that splits, smoke, paper debris that stays on the street until you sweep it.
- `public/js/catalog.js`: the 12 crackers. The browser and the Worker both read it.
- `src/`: one Hono app for pages, REST (`/api/v1`), MCP and `llms.txt`. `src/worker.ts` runs it on Cloudflare (D1, rate-limit binding, Cache API); `server/node.ts` runs the same app on Node with SQLite.

## Credits

Sound clips are cut from CC0 and public-domain field recordings on Wikimedia Commons. See [public/sounds/CREDITS.md](public/sounds/CREDITS.md). `scripts/cut-sounds.py` rebuilds them from the originals.

## License

MIT. See [LICENSE](LICENSE).
