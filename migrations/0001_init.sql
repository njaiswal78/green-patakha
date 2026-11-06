-- How many of each cracker have been fired, across everyone. Nothing per person.
CREATE TABLE IF NOT EXISTS fires (
  cracker TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
