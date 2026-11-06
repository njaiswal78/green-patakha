import { CRACKERS, CRACKER_IDS, LOUDNESS_LABEL } from "../public/js/catalog.js";
import type { Platform } from "./platform";

export class ActionError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
  }
}

export interface Stats {
  total: number;
  by_cracker: Record<string, number>;
  updated_at: string | null;
}

export function listCrackers() {
  return CRACKERS.map((c) => ({
    id: c.id,
    name: c.name,
    hindi: c.hindi,
    english: c.english,
    kind: c.kind,
    loudness: LOUDNESS_LABEL[c.loudness],
    seconds: c.seconds,
    about: c.about,
    image: `/crackers/${c.id}.svg`,
  }));
}

export async function getStats(p: Platform): Promise<Stats> {
  const { results } = await p.db
    .prepare("SELECT cracker, count, updated_at FROM fires")
    .all<{ cracker: string; count: number; updated_at: string }>();
  const by: Record<string, number> = {};
  let total = 0;
  let updated: string | null = null;
  for (const c of CRACKERS) by[c.id] = 0;
  for (const r of results) {
    if (!CRACKER_IDS.has(r.cracker)) continue;
    by[r.cracker] = r.count;
    total += r.count;
    if (!updated || r.updated_at > updated) updated = r.updated_at;
  }
  return { total, by_cracker: by, updated_at: updated };
}

const MAX_PER_CRACKER = 60;
const MAX_PER_REQUEST = 240;

export async function recordFires(p: Platform, input: unknown): Promise<Stats> {
  const counts = (input as { counts?: unknown })?.counts;
  if (!counts || typeof counts !== "object" || Array.isArray(counts)) {
    throw new ActionError("invalid_body", 'Send {"counts": {"anar": 2, "rocket": 1}}.');
  }
  const rows: [string, number][] = [];
  let sum = 0;
  for (const [id, raw] of Object.entries(counts as Record<string, unknown>)) {
    if (!CRACKER_IDS.has(id)) throw new ActionError("unknown_cracker", `Unknown cracker "${id.slice(0, 40)}". See GET /api/v1/crackers.`);
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 1 || n > MAX_PER_CRACKER) {
      throw new ActionError("invalid_count", `Each count must be a whole number from 1 to ${MAX_PER_CRACKER}.`);
    }
    rows.push([id, n]);
    sum += n;
  }
  if (rows.length === 0) throw new ActionError("invalid_body", "counts is empty.");
  if (sum > MAX_PER_REQUEST) throw new ActionError("too_many", `At most ${MAX_PER_REQUEST} crackers per request.`);

  const now = new Date().toISOString();
  await p.db.batch(
    rows.map(([id, n]) =>
      p.db
        .prepare(
          "INSERT INTO fires (cracker, count, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(cracker) DO UPDATE SET count = count + excluded.count, updated_at = excluded.updated_at",
        )
        .bind(id, n, now),
    ),
  );
  return getStats(p);
}
