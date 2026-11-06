import { createApp } from "./app";
import type { Platform } from "./platform";

const app = createApp((c) => {
  const env = c.env as Env;
  const p: Platform = {
    db: env.DB,
    allow: async (key) => (await env.FIRE_LIMIT.limit({ key })).success,
    // Cloudflare overwrites this header at the edge, so clients can't forge it here.
    ip: c.req.header("cf-connecting-ip") || "local",
    cache: (caches as unknown as { default: Cache }).default,
    waitUntil: (x) => c.executionCtx.waitUntil(x),
    fallback: (req) => env.ASSETS.fetch(req),
    origin: env.APP_ORIGIN || new URL(c.req.url).origin,
    repo: env.REPO_URL,
  };
  return p;
});

export default {
  fetch(req, env, ctx) {
    // Send page visits on workers.dev or www to the real domain. Browsers keep the #fragment
    // across redirects, so sealed wish links shared before the move still open.
    const url = new URL(req.url);
    const home = env.APP_ORIGIN && new URL(env.APP_ORIGIN).hostname;
    if (home && (url.hostname.endsWith(".workers.dev") || url.hostname === `www.${home}`) && req.method === "GET" && !url.pathname.startsWith("/api/") && url.pathname !== "/mcp") {
      return Response.redirect(env.APP_ORIGIN + url.pathname + url.search, 301);
    }
    return app.fetch(req, env, ctx);
  },
} satisfies ExportedHandler<Env>;
