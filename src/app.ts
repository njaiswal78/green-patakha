import { Hono, type Context } from "hono";
import { ActionError, getStats, listCrackers, recordFires } from "./actions";
import { llmsFull, llmsTxt, mcp, openapi } from "./agent";
import { comparePage } from "./pages/compare";
import { docsHome, docsMcp, docsSelfHost } from "./pages/docs";
import { homePage } from "./pages/home";
import { esc } from "./pages/layout";
import { cleanWish } from "../public/js/catalog.js";
import type { Platform } from "./platform";

type Env = { Variables: { p: Platform } };
type C = Context<Env>;

const MAX_BODY = 4096;
const MAX_BATCH = 10;

/** Reads the body as text, or null when it is over max. Checks Content-Length first so a huge upload is never buffered. */
async function readBody(c: C, max: number) {
  if (Number(c.req.header("content-length") || 0) > max) return null;
  const raw = await c.req.text();
  return raw.length > max ? null : raw;
}

export function securityHeaders(h: Headers, https: boolean) {
  h.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "media-src 'self'",
      "connect-src 'self'",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      ...(https ? ["upgrade-insecure-requests"] : []),
    ].join("; "),
  );
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set("X-Frame-Options", "DENY");
  h.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()");
  h.set("Cross-Origin-Opener-Policy", "same-origin");
  if (https) h.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
}

export function apiError(c: C, code: string, message: string, status: number, extra?: Record<string, string>) {
  return c.json({ error: { code, message } }, status as 400, extra);
}

async function cached(c: C, ttl: number, make: () => Response | Promise<Response>) {
  const p = c.var.p;
  const url = new URL(c.req.url);
  url.search = "";
  const key = new Request(url.toString(), { method: "GET" });
  if (p.cache) {
    const hit = await p.cache.match(key);
    if (hit) return new Response(hit.body, hit);
  }
  const res = await make();
  res.headers.set("Cache-Control", `public, max-age=${ttl}`);
  if (p.cache && res.ok) p.waitUntil(p.cache.put(key, res.clone()));
  return res;
}

const html = (c: C, body: string) =>
  cached(c, 300, () => new Response(body, { headers: { "content-type": "text/html; charset=utf-8" } }));

const text = (c: C, body: string, type = "text/plain") =>
  cached(c, 300, () => new Response(body, { headers: { "content-type": `${type}; charset=utf-8` } }));

export function createApp(platform: (c: C) => Platform) {
  const app = new Hono<Env>();

  app.use("*", async (c, next) => {
    c.set("p", platform(c));
    await next();
    if (c.res.headers.get("content-type")?.includes("text/html") || c.req.path.startsWith("/api") || c.req.path === "/mcp") {
      // Responses from the cache are immutable; copy before adding headers.
      c.res = new Response(c.res.body, c.res);
      securityHeaders(c.res.headers, new URL(c.req.url).protocol === "https:");
    }
  });

  // ---------- pages ----------
  const game = async (c: C) => {
    const res = await c.var.p.fallback(new Request(new URL("/play", c.req.url), c.req.raw));
    if (!res.ok) return res;
    // Share previews need an absolute og:image; play.html stays plain static for any host.
    let body = (await res.text()).replace('content="/og.png"', `content="${c.var.p.origin}/og.png"`);
    // WhatsApp and friends show og:title. Only the sender is named; the wish stays a surprise until it bursts in the sky.
    const wish = cleanWish(c.req.query("wish"));
    if (wish) {
      const from = cleanWish(c.req.query("from"), 20);
      const title = esc(from ? `${from} sent you a Diwali wish 🎆` : "A Diwali wish for you 🎆");
      body = body
        .replace("<title>Burst crackers now · Green Patakha</title>", `<title>${title}</title>`)
        .replace('property="og:title" content="Burst crackers now · Green Patakha"', `property="og:title" content="${title}"`)
        .replace(/property="og:description" content="[^"]*"/, 'property="og:description" content="Tap to see it burst in fireworks over your street. Green Patakha, zero smoke."');
    }
    return c.html(body);
  };
  app.get("/", game);
  app.get("/play", game);
  app.get("/about", (c) => html(c, homePage(c.var.p.origin, c.var.p.repo)));
  app.get("/compare", (c) => html(c, comparePage(c.var.p.origin, c.var.p.repo)));
  app.get("/docs", (c) => html(c, docsHome(c.var.p.origin, c.var.p.repo)));
  app.get("/docs/mcp", (c) => html(c, docsMcp(c.var.p.origin, c.var.p.repo)));
  app.get("/docs/self-host", (c) => html(c, docsSelfHost(c.var.p.origin, c.var.p.repo)));

  app.get("/llms.txt", (c) => text(c, llmsTxt(c.var.p.origin, c.var.p.repo)));
  app.get("/llms-full.txt", (c) => text(c, llmsFull(c.var.p.origin, c.var.p.repo)));
  app.get("/robots.txt", (c) => {
    const o = c.var.p.origin;
    return text(c, `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /mcp\n\nSitemap: ${o}/sitemap.xml\n# LLM summary: ${o}/llms.txt\n`);
  });
  app.get("/sitemap.xml", (c) => {
    const o = c.var.p.origin;
    const urls = ["/", "/about", "/compare", "/docs", "/docs/mcp", "/docs/self-host"]
      .map((u) => `<url><loc>${o}${u}</loc></url>`)
      .join("");
    return text(c, `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, "application/xml");
  });

  // ---------- API ----------
  app.get("/api/v1/crackers", (c) => {
    c.header("Cache-Control", "public, max-age=3600");
    return c.json({ crackers: listCrackers() });
  });

  app.get("/api/v1/stats", (c) =>
    cached(c, 10, async () => Response.json(await getStats(c.var.p))),
  );

  app.get("/api/v1/openapi.json", (c) => c.json(openapi(c.var.p.origin)));

  app.post("/api/v1/fires", async (c) => {
    const p = c.var.p;
    const origin = c.req.header("origin");
    if (origin && origin !== new URL(c.req.url).origin && origin !== p.origin) {
      return apiError(c, "forbidden_origin", "Only this site's pages can write the counter from a browser.", 403);
    }
    if (!(await p.allow(p.ip))) {
      return apiError(c, "rate_limited", "Too many writes. Try again in a minute.", 429, { "Retry-After": "60" });
    }
    const raw = await readBody(c, MAX_BODY);
    if (raw === null) return apiError(c, "payload_too_large", "Body must be under 4 KB.", 413);
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return apiError(c, "invalid_body", "Body must be JSON.", 400);
    }
    return c.json(await recordFires(p, body));
  });

  app.all("/api/v1/fires", (c) => apiError(c, "method_not_allowed", "Use POST.", 405, { Allow: "POST" }));
  app.all("/api/*", (c) => apiError(c, "not_found", "No such endpoint. See /docs.", 404));

  // ---------- MCP ----------
  app.post("/mcp", async (c) => {
    const raw = await readBody(c, MAX_BODY * 4);
    if (raw === null) return apiError(c, "payload_too_large", "Body too large.", 413);
    let msg: unknown;
    try {
      msg = JSON.parse(raw);
    } catch {
      return c.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400);
    }
    if (Array.isArray(msg)) {
      if (msg.length > MAX_BATCH) return c.json({ jsonrpc: "2.0", id: null, error: { code: -32600, message: `Batch too large (max ${MAX_BATCH}).` } }, 400);
      const out = (await Promise.all(msg.map((m) => mcp(c.var.p, m)))).filter(Boolean);
      return out.length ? c.json(out) : c.body(null, 202);
    }
    const out = await mcp(c.var.p, msg as Parameters<typeof mcp>[1]);
    return out ? c.json(out) : c.body(null, 202);
  });
  app.all("/mcp", (c) => c.json({ jsonrpc: "2.0", id: null, error: { code: -32000, message: "Use POST." } }, 405, { Allow: "POST" }));

  // ---------- errors ----------
  app.onError((err, c) => {
    if (err instanceof ActionError) return apiError(c, err.code, err.message, err.status);
    console.error(JSON.stringify({ level: "error", path: c.req.path, message: err.message, stack: err.stack }));
    if (c.req.path.startsWith("/api") || c.req.path === "/mcp") return apiError(c, "internal", "Something broke on our side.", 500);
    return c.text("Something broke on our side. Please try again.", 500);
  });

  app.notFound((c) => c.var.p.fallback(c.req.raw));

  return app;
}
