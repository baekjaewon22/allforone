CREATE TABLE IF NOT EXISTS work_devices (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	hostname TEXT,
	platform TEXT,
	last_seen_at TEXT NOT NULL,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS work_items (
	id TEXT PRIMARY KEY,
	device_id TEXT NOT NULL,
	device_name TEXT NOT NULL,
	kind TEXT NOT NULL,
	title TEXT NOT NULL,
	summary TEXT,
	path TEXT,
	url TEXT,
	status TEXT NOT NULL DEFAULT 'new',
	metadata_json TEXT,
	occurred_at TEXT NOT NULL,
	created_at TEXT NOT NULL,
	FOREIGN KEY (device_id) REFERENCES work_devices(id)
);

CREATE INDEX IF NOT EXISTS idx_work_devices_last_seen ON work_devices(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_work_items_device_id ON work_items(device_id);
CREATE INDEX IF NOT EXISTS idx_work_items_created_at ON work_items(created_at);
CREATE INDEX IF NOT EXISTS idx_work_items_status ON work_items(status);
