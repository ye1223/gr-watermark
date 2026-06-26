CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  site TEXT NOT NULL,
  event TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  path TEXT,
  locale TEXT,
  device TEXT,
  country TEXT,
  props TEXT
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp
  ON analytics_events (timestamp);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_timestamp
  ON analytics_events (event, timestamp);
