PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY,
	email TEXT NOT NULL UNIQUE,
	display_name TEXT,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS sessions (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL,
	expires_at TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS connectors (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL,
	provider TEXT NOT NULL,
	display_name TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'disconnected',
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	UNIQUE (user_id, provider),
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sync_state (
	connector_id TEXT PRIMARY KEY,
	cursor TEXT,
	last_success_at TEXT,
	last_error TEXT,
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	FOREIGN KEY (connector_id) REFERENCES connectors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS secrets (
	connector_id TEXT NOT NULL,
	key TEXT NOT NULL,
	ciphertext TEXT NOT NULL,
	iv TEXT NOT NULL,
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	PRIMARY KEY (connector_id, key),
	FOREIGN KEY (connector_id) REFERENCES connectors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS schedule_items (
	id TEXT PRIMARY KEY,
	connector_id TEXT NOT NULL,
	external_id TEXT,
	title TEXT NOT NULL,
	start_at TEXT NOT NULL,
	end_at TEXT NOT NULL,
	status TEXT NOT NULL,
	metadata_json TEXT,
	updated_at TEXT NOT NULL,
	UNIQUE (connector_id, external_id),
	FOREIGN KEY (connector_id) REFERENCES connectors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS report_metrics (
	id TEXT PRIMARY KEY,
	connector_id TEXT NOT NULL,
	name TEXT NOT NULL,
	value REAL NOT NULL,
	unit TEXT,
	measured_at TEXT NOT NULL,
	metadata_json TEXT,
	FOREIGN KEY (connector_id) REFERENCES connectors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dashboard_layout (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL,
	layout_json TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_connectors_user_id ON connectors(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_items_connector_time ON schedule_items(connector_id, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_report_metrics_connector_time ON report_metrics(connector_id, measured_at);
