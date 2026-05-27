CREATE TABLE IF NOT EXISTS daily_logs (
	id TEXT PRIMARY KEY,
	log_date TEXT NOT NULL UNIQUE,
	mood INTEGER,
	condition INTEGER,
	sleep_hours REAL,
	focus INTEGER,
	summary TEXT,
	wins TEXT,
	blockers TEXT,
	tomorrow TEXT,
	tags_json TEXT,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS health_entries (
	id TEXT PRIMARY KEY,
	entry_date TEXT NOT NULL UNIQUE,
	sleep_hours REAL,
	weight_kg REAL,
	exercise_minutes INTEGER,
	condition INTEGER,
	stress INTEGER,
	medication TEXT,
	meal_note TEXT,
	symptoms TEXT,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_reports (
	id TEXT PRIMARY KEY,
	provider TEXT NOT NULL,
	task_title TEXT NOT NULL,
	request TEXT,
	result TEXT NOT NULL,
	changed_files_json TEXT,
	commands_json TEXT,
	todos_json TEXT,
	status TEXT NOT NULL DEFAULT 'received',
	metadata_json TEXT,
	occurred_at TEXT NOT NULL,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_logs_log_date ON daily_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_health_entries_entry_date ON health_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_ai_reports_status ON ai_reports(status);
CREATE INDEX IF NOT EXISTS idx_ai_reports_occurred_at ON ai_reports(occurred_at);
