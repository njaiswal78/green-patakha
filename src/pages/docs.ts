import { esc, page } from "./layout";

export const ERRORS: [string, number, string][] = [
  ["invalid_body", 400, "The body is not JSON, or it has no counts object."],
  ["unknown_cracker", 400, "A key in counts is not a cracker id from GET /api/v1/crackers."],
  ["invalid_count", 400, "A count is not a whole number from 1 to 60."],
  ["too_many", 400, "More than 240 crackers in one request."],
  ["payload_too_large", 413, "Body over 4 KB."],
  ["forbidden_origin", 403, "A browser on another website tried to write the counter."],
  ["rate_limited", 429, "Over 30 writes a minute from one address. Wait for Retry-After seconds."],
  ["not_found", 404, "No such route."],
  ["method_not_allowed", 405, "Wrong HTTP method for this route."],
  ["internal", 500, "Something broke on our side. It is logged; try again."],
];

const NAV = [
  ["/docs", "Getting started"],
  ["/docs#api", "API reference"],
  ["/docs#errors", "Errors"],
  ["/docs/mcp", "MCP"],
  ["/docs/self-host", "Self-host"],
  ["/llms.txt", "llms.txt"],
  ["/api/v1/openapi.json", "openapi.json"],
];

function docs(path: string, title: string, description: string, article: string, origin: string, repo: string) {
  const nav = NAV.map(([href, label]) => `<a href="${href}"${href === path ? ' class="on"' : ""}>${label}</a>`).join("");
  return page({
    title: `${title} · Green Patakha docs`,
    description,
    path,
    origin,
    repo,
    body: `<div class="wrap docs"><nav>${nav}</nav><article>${article}</article></div>`,
  });
}

export function docsHome(origin: string, repo: string) {
  const errors = ERRORS.map(([c, s, m]) => `<tr><td><code>${c}</code></td><td>${s}</td><td>${esc(m)}</td></tr>`).join("");
  return docs(
    "/docs",
    "Getting started",
    "How Green Patakha works, the public REST API for the cracker list and the live counter, and error codes.",
    `
<h1>Getting started</h1>
<p>Green Patakha is a website where you burst Indian Diwali crackers with real recorded sound. Open <a href="/play">/play</a>, pick a cracker, tap the street. There is no account.</p>
<h2>Keyboard</h2>
<table class="cmp"><tbody>
<tr><td><code>1</code> to <code>9</code>, <code>0</code>, <code>-</code>, <code>=</code>, <code>Q</code>, <code>W</code>, <code>E</code></td><td>Pick one of the 15 crackers</td></tr>
<tr><td><code>P</code></td><td>Cycle lights and sound power: 1×, 2×, 4×</td></tr>
<tr><td><code>Space</code></td><td>Light the picked cracker at a random spot</td></tr>
<tr><td><code>M</code></td><td>Mute or unmute</td></tr>
<tr><td><code>↑</code> <code>↓</code></td><td>Volume up or down by 5</td></tr>
<tr><td><code>A</code></td><td>Auto mela on or off</td></tr>
<tr><td><code>F</code></td><td>Full screen</td></tr>
</tbody></table>
<p>Add <code>?auto</code> to the URL (<a href="/play?auto">/play?auto</a>) to start Auto mela on load, for a TV.</p>

<h2>Authentication</h2>
<p>None. Every endpoint is public. Reads are cached for a few seconds. Writes to the counter are rate-limited to 30 a minute per address and must come from this site when sent by a browser.</p>

<h2 id="api">API reference</h2>
<p>Base URL: <code>${origin}/api/v1</code>. JSON in, JSON out. Machine-readable spec: <a href="/api/v1/openapi.json">openapi.json</a>.</p>

<h3>GET /crackers</h3>
<p>The 15 crackers with id, names (English and Hindi), kind, loudness, burn time and image.</p>
<pre>curl ${origin}/api/v1/crackers</pre>
<pre>{
  "crackers": [
    { "id": "anar", "name": "Anar", "hindi": "अनार", "english": "Flower pot",
      "kind": "ground", "loudness": "Medium", "seconds": 8,
      "about": "A clay cone that throws a fountain…", "image": "/crackers/anar.svg" }
  ]
}</pre>

<h3>GET /stats</h3>
<p>How many crackers everyone has burst, in total and per cracker.</p>
<pre>curl ${origin}/api/v1/stats</pre>
<pre>{ "total": 1520, "by_cracker": { "anar": 210, "rocket": 380, … }, "updated_at": "2026-11-08T14:31:09.120Z" }</pre>

<h3>POST /fires</h3>
<p>Add to the counter. The play page batches its taps and sends them every few seconds. Returns the new stats.</p>
<pre>curl -X POST ${origin}/api/v1/fires \\
  -H 'content-type: application/json' \\
  -d '{"counts": {"anar": 2, "rocket": 1}}'</pre>
<p>Limits: ids from <code>/crackers</code>, each count 1 to 60, at most 240 per request, body under 4 KB.</p>

<h2 id="errors">Errors</h2>
<p>Every error has the same shape, with a stable <code>code</code>:</p>
<pre>{ "error": { "code": "unknown_cracker", "message": "Unknown cracker \\"diya\\". See GET /api/v1/crackers." } }</pre>
<table class="cmp"><thead><tr><th>code</th><th>HTTP</th><th>Meaning</th></tr></thead><tbody>${errors}</tbody></table>
`,
    origin,
    repo,
  );
}

export function docsMcp(origin: string, repo: string) {
  return docs(
    "/docs/mcp",
    "MCP",
    "Connect an AI assistant to Green Patakha over the Model Context Protocol: list crackers and read the live counter.",
    `
<h1>MCP</h1>
<p>Green Patakha runs a stateless MCP server over Streamable HTTP at <code>${origin}/mcp</code>. No key is needed. Both tools only read, so nothing changes without you.</p>
<h2>Connect</h2>
<p>Cursor, Claude Desktop and other clients that take a URL:</p>
<pre>{
  "mcpServers": {
    "green-patakha": { "url": "${origin}/mcp" }
  }
}</pre>
<h2>Tools</h2>
<table class="cmp"><thead><tr><th>Tool</th><th>Input</th><th>Returns</th><th>Same as</th></tr></thead><tbody>
<tr><td><code>list_crackers</code></td><td>none</td><td>The 15 crackers with Hindi and English names, kind, loudness</td><td><code>GET /api/v1/crackers</code></td></tr>
<tr><td><code>get_stats</code></td><td>none</td><td>Total burst so far and the count per cracker</td><td><code>GET /api/v1/stats</code></td></tr>
</tbody></table>
<h2>Try it with curl</h2>
<pre>curl -X POST ${origin}/mcp \\
  -H 'content-type: application/json' \\
  -H 'accept: application/json, text/event-stream' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_stats","arguments":{}}}'</pre>
`,
    origin,
    repo,
  );
}

export function docsSelfHost(origin: string, repo: string) {
  return docs(
    "/docs/self-host",
    "Self-host",
    "Run Green Patakha on your own server with Docker, or on your own Cloudflare account with Wrangler.",
    `
<h1>Self-host</h1>
<p>The hosted site and the repo are the same code, MIT licensed. Pick one of two ways to run it.</p>

<h2>On your server, with Docker</h2>
<pre>git clone ${repo}.git
cd green-patakha
cp .env.example .env        # set APP_ORIGIN to the URL you will serve it on
docker compose up -d</pre>
<p>Open <code>http://your-server:8080</code> and burst a cracker. The counter lives in a SQLite file on the <code>data</code> volume. Put Caddy or your host's proxy in front for HTTPS, then set <code>APP_ORIGIN</code> to that <code>https://</code> URL and restart. The compose file only publishes port 8080.</p>

<h2>On your own Cloudflare account</h2>
<pre>git clone ${repo}.git
cd green-patakha
npm install
npx wrangler login
npx wrangler d1 create green-patakha     # paste the database_id into wrangler.jsonc
npx wrangler d1 migrations apply green-patakha --remote
npx wrangler deploy</pre>
<p>Set <code>APP_ORIGIN</code> in <code>wrangler.jsonc</code> to your domain, then add it as a Custom Domain on the Worker so DNS is proxied through Cloudflare. Rate limiting uses the Workers rate-limit binding already in the config.</p>

<h2>Just the game</h2>
<p>Everything you see on <a href="/play">/play</a> is static files in <code>public/</code>. Any static host can serve that folder; the counter will show a dash and the crackers work the same.</p>
`,
    origin,
    repo,
  );
}
