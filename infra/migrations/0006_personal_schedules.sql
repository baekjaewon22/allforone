CREATE TABLE IF NOT EXISTS personal_schedules (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	start_at TEXT NOT NULL,
	end_at TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'planned',
	location TEXT,
	note TEXT,
	tags_json TEXT,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_personal_schedules_start_at ON personal_schedules(start_at);
CREATE INDEX IF NOT EXISTS idx_personal_schedules_status ON personal_schedules(status);
