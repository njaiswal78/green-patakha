// Self-host entry: the same app as the Worker, on Node with a SQLite file.
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createApp, securityHeaders } from "../src/app";
import type { Db, Platform, Stmt } from "../src/platform";

const ROOT = new URL("..", import.meta.url).pathname;
const PUBLIC = join(ROOT, "public");
const DATA_DIR = process.env.DATA_DIR || join(ROOT, "data");
const PORT = Number(process.env.PORT || 8080);
const ORIGIN = (process.env.APP_ORIGIN || "").replace(/\/$/, "");
const REPO = process.env.REPO_URL || "https://github.com/njaiswal78/green-patakha";

mkdirSync(DATA_DIR, { recursive: true });
const sqlite = new DatabaseSync(join(DATA_DIR, "green-patakha.db"));
sqlite.exec("PRAGMA journal_mode = WAL");
for (const f of readdirSync(join(ROOT, "migrations")).filter((f) => f.endsWith(".sql")).sort()) {
  sqlite.exec(readFileSync(join(ROOT, "migrations", f), "utf8"));
}

type Param = string | number | null | bigint | Uint8Array;

class NodeStmt implements Stmt {
  constructor(private sql: string, private args: Param[] = []) {}
  bind(...values: unknown[]) {
    return new NodeStmt(this.sql, values as Param[]);
  }
  async first<T>() {
    return (sqlite.prepare(this.sql).get(...this.args) as T) ?? null;
  }
  async all<T>() {
    return { results: sqlite.prepare(this.sql).all(...this.args) as T[] };
  }
  async run() {
    return sqlite.prepare(this.sql).run(...this.args);
  }
}

const db: Db = {
  prepare: (sql) => new NodeStmt(sql),
  async batch(stmts) {
    sqlite.exec("BEGIN");
    try {
      for (const s of stmts) await s.run();
      sqlite.exec("COMMIT");
    } catch (e) {
      sqlite.exec("ROLLBACK");
      throw e;
    }
  },
};

const windows = new Map<string, { n: number; reset: number }>();
async function allow(key: string) {
  const now = Date.now();
  const w = windows.get(key);
  if (!w || w.reset < now) {
    windows.set(key, { n: 1, reset: now + 60_000 });
    // ponytail: sweep expired buckets only; memory is bounded by distinct IPs per minute.
    if (windows.size > 50_000) for (const [k, v] of windows) if (v.reset < now) windows.delete(k);
    return true;
  }
  w.n++;
  return w.n <= 30;
}

const notFoundPage = readFileSync(join(PUBLIC, "404.html"), "utf8");
const files = new Hono();
files.use("*", async (c, next) => {
  await next();
  securityHeaders(c.res.headers, (ORIGIN || "").startsWith("https:"));
});
files.get("/play", serveStatic({ path: "play.html", root: PUBLIC }));
files.use("*", serveStatic({ root: PUBLIC }));
files.notFound((c) => c.html(notFoundPage, 404));

const app = createApp((c) => {
  const p: Platform = {
    db,
    allow,
    cache: null,
    waitUntil: (x) => void x.catch((e) => console.error(e)),
    fallback: (req) => files.fetch(req),
    origin: ORIGIN || new URL(c.req.url).origin,
    repo: REPO,
  };
  return p;
});

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Green Patakha on http://localhost:${info.port}${ORIGIN ? ` (public URL ${ORIGIN})` : ""}`);
});
