// The small surface the app needs from its host. The Worker fills it from
// bindings (D1, rate limiter, Cache API); the Node server fills it from SQLite
// and an in-memory limiter. Handlers never touch env bindings directly.

export interface Stmt {
  bind(...values: unknown[]): Stmt;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

export interface Db {
  prepare(sql: string): Stmt;
  batch(stmts: Stmt[]): Promise<unknown>;
}

export interface Platform {
  db: Db;
  /** true when this caller may write; false means 429. */
  allow(key: string): Promise<boolean>;
  /** Edge cache for anonymous GETs, or null when there is none. */
  cache: Cache | null;
  waitUntil(p: Promise<unknown>): void;
  /** Serves static files and the 404 page for anything the app doesn't route. */
  fallback(req: Request): Promise<Response> | Response;
  origin: string;
  repo: string;
}
