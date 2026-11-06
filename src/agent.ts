import { getStats, listCrackers } from "./actions";
import { ERRORS } from "./pages/docs";
import type { Platform } from "./platform";
import { CHECKED, COMPETITORS, SRC } from "./sources";

export function llmsTxt(origin: string, repo: string) {
  return `# Green Patakha

> Free, open-source website for bursting Indian Diwali crackers in the browser with real recorded sound, your own volume and zero smoke. No login. MIT licensed.

Green Patakha is for families and anyone who wants Diwali crackers without smoke or too much noise. It costs ₹0. It differs from other virtual cracker sites in three ways: bangs are real field recordings (CC0 / public domain), volume is a 0–100 slider rather than just mute, and the source code is public under MIT.

## Use it
- [Burst crackers](${origin}/play): pick one of 15 crackers and tap the street
- [The 15 crackers](${origin}/api/v1/crackers): JSON list with Hindi names

## Docs
- [Getting started and REST API](${origin}/docs)
- [MCP server](${origin}/docs/mcp): ${origin}/mcp, tools list_crackers and get_stats
- [Self-host](${origin}/docs/self-host): Docker or your own Cloudflare account
- [OpenAPI](${origin}/api/v1/openapi.json)

## More
- [Compare with other virtual cracker sites](${origin}/compare)
- [Full text for LLMs](${origin}/llms-full.txt)
- [Source code](${repo})
`;
}

export function llmsFull(origin: string, repo: string) {
  const crackers = listCrackers()
    .map((c) => `- **${c.name}** (${c.hindi}, ${c.english}). ${c.kind}, ${c.loudness.toLowerCase()}, about ${c.seconds} s. ${c.about}`)
    .join("\n");
  const cmp = COMPETITORS.map(
    (c) => `- **${c.name}** (${c.src.url}): price ${c.price}; crackers ${c.crackers}; sound ${c.sound}; volume ${c.volume}; open source ${c.openSource}; ahead on: ${c.extra}.`,
  ).join("\n");
  const errs = ERRORS.map(([c, s, m]) => `- \`${c}\` (${s}): ${m}`).join("\n");
  return `${llmsTxt(origin, repo)}
---

## What it is
A website at ${origin}. Open /play, pick a cracker from the tray, tap the street to light it. Sound starts on the first tap. A slider sets volume from 0 to 100 and is remembered. "Auto mela" fires crackers on its own. "Jhaadu" sweeps paper and scorch marks off the street. "Gentle flashes" dims flashes and stops screen shake, and turns on by itself when the device asks for reduced motion.

Price: ₹0. No ads, no login, no purchases. No cookies or analytics. The site stores only total counts per cracker.

## The 15 crackers
${crackers}

## Sound
Bangs, booms and sky bursts are single bangs cut from CC0 and public-domain firecracker field recordings on Wikimedia Commons (${SRC.sounds.url}). Each blast picks a clip, varies its pitch slightly and pans it to the cracker's position. Fountain hiss, fuse sizzle, crackle and rocket whoosh are shaped noise generated in the browser.

## Compared with other sites (checked ${CHECKED})
${cmp}

## Real crackers in India
- Noise limit for a single cracker: 125 dB(AI) or 145 dB(C)pk at 4 m (${SRC.noiseRule.url}).
- Delhi-NCR, Diwali 2025: only NEERI-approved green crackers, used 6–7 am and 8–10 pm on two days; laris (joined crackers) could not be made or sold (${SRC.scOrder.url}).

## REST API
Base ${origin}/api/v1. No auth.
- GET /crackers → { crackers: [...] }
- GET /stats → { total, by_cracker, updated_at }
- POST /fires with {"counts": {"anar": 2}} → stats. Each count 1–60, max 240 per request, 30 writes/min per address.

Errors are { "error": { "code", "message" } }:
${errs}

## MCP
Streamable HTTP, stateless, at ${origin}/mcp. Tools: list_crackers, get_stats. Both read-only.

## Self-host
Docker: clone ${repo}, copy .env.example to .env, docker compose up -d, open port 8080.
Cloudflare: npm install, wrangler d1 create, wrangler d1 migrations apply --remote, wrangler deploy.
`;
}

export function openapi(origin: string) {
  const err = { $ref: "#/components/schemas/Error" };
  return {
    openapi: "3.1.0",
    info: { title: "Green Patakha API", version: "1.0.0", description: "Cracker list and the live burst counter.", license: { name: "MIT" } },
    servers: [{ url: `${origin}/api/v1` }],
    paths: {
      "/crackers": {
        get: {
          operationId: "listCrackers",
          summary: "List the 15 crackers",
          responses: { "200": { description: "Crackers", content: { "application/json": { schema: { type: "object", properties: { crackers: { type: "array", items: { $ref: "#/components/schemas/Cracker" } } } } } } } },
        },
      },
      "/stats": {
        get: {
          operationId: "getStats",
          summary: "Total crackers burst, overall and per cracker",
          responses: { "200": { description: "Stats", content: { "application/json": { schema: { $ref: "#/components/schemas/Stats" } } } } },
        },
      },
      "/fires": {
        post: {
          operationId: "recordFires",
          summary: "Add to the counter",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["counts"],
                  properties: { counts: { type: "object", additionalProperties: { type: "integer", minimum: 1, maximum: 60 } } },
                },
              },
            },
          },
          responses: {
            "200": { description: "New stats", content: { "application/json": { schema: { $ref: "#/components/schemas/Stats" } } } },
            "400": { description: "Bad input", content: { "application/json": { schema: err } } },
            "403": { description: "Cross-site write", content: { "application/json": { schema: err } } },
            "413": { description: "Body too large", content: { "application/json": { schema: err } } },
            "429": { description: "Rate limited", headers: { "Retry-After": { schema: { type: "integer" } } }, content: { "application/json": { schema: err } } },
          },
        },
      },
    },
    components: {
      schemas: {
        Cracker: {
          type: "object",
          properties: {
            id: { type: "string" }, name: { type: "string" }, hindi: { type: "string" }, english: { type: "string" },
            kind: { type: "string", enum: ["ground", "sky", "hand"] }, loudness: { type: "string" }, seconds: { type: "integer" },
            about: { type: "string" }, image: { type: "string" },
          },
        },
        Stats: {
          type: "object",
          properties: { total: { type: "integer" }, by_cracker: { type: "object", additionalProperties: { type: "integer" } }, updated_at: { type: ["string", "null"] } },
        },
        Error: {
          type: "object",
          properties: { error: { type: "object", properties: { code: { type: "string", enum: ERRORS.map((e) => e[0]) }, message: { type: "string" } } } },
        },
      },
    },
  };
}

// ---------- MCP (stateless, Streamable HTTP, JSON responses) ----------

const PROTOCOL = "2025-06-18";

const TOOLS = [
  {
    name: "list_crackers",
    title: "List crackers",
    description: "List the 15 Indian Diwali crackers on Green Patakha with Hindi and English names, kind (ground, sky, hand), loudness and burn time.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "get_stats",
    title: "Get burst counter",
    description: "How many crackers everyone has burst on Green Patakha, in total and per cracker.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
];

type Rpc = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: Record<string, unknown> };

export async function mcp(p: Platform, msg: Rpc): Promise<object | null> {
  const ok = (result: unknown) => ({ jsonrpc: "2.0", id: msg.id ?? null, result });
  const fail = (code: number, message: string) => ({ jsonrpc: "2.0", id: msg.id ?? null, error: { code, message } });
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") return fail(-32600, "Invalid request");
  if (msg.id === undefined) return null;

  switch (msg.method) {
    case "initialize":
      return ok({
        protocolVersion: PROTOCOL,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "green-patakha", title: "Green Patakha", version: "1.0.0" },
        instructions: "Read-only tools for the Green Patakha virtual Diwali cracker site.",
      });
    case "ping":
      return ok({});
    case "tools/list":
      return ok({ tools: TOOLS });
    case "tools/call": {
      const name = msg.params?.name;
      let data: unknown;
      if (name === "list_crackers") data = { crackers: listCrackers() };
      else if (name === "get_stats") data = await getStats(p);
      else return fail(-32602, `Unknown tool: ${String(name)}`);
      return ok({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data, isError: false });
    }
    default:
      return fail(-32601, `Method not found: ${msg.method}`);
  }
}
