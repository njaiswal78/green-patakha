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
  fetch: app.fetch,
} satisfies ExportedHandler<Env>;
