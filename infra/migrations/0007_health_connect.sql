CREATE TABLE IF NOT EXISTS health_connect_daily_summaries (
	date TEXT NOT NULL,
	device_id TEXT NOT NULL,
	steps INTEGER,
	sleep_minutes INTEGER,
	exercise_minutes INTEGER,
	active_calories REAL,
	total_calories REAL,
	distance_meters REAL,
	heart_rate_avg REAL,
	heart_rate_min REAL,
	heart_rate_max REAL,
	weight_kg REAL,
	source TEXT,
	raw_json TEXT,
	synced_at TEXT NOT NULL,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	PRIMARY KEY (date, device_id)
);

CREATE INDEX IF NOT EXISTS idx_health_connect_daily_date ON health_connect_daily_summaries(date);
CREATE INDEX IF NOT EXISTS idx_health_connect_daily_device ON health_connect_daily_summaries(device_id);

CREATE TABLE IF NOT EXISTS health_connect_sync_state (
	device_id TEXT PRIMARY KEY,
	last_synced_at TEXT NOT NULL,
	last_status TEXT NOT NULL DEFAULT 'ok',
	error_message TEXT,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);
