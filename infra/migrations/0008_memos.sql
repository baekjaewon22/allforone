CREATE TABLE IF NOT EXISTS memos (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	content TEXT,
	file_name TEXT,
	mime_type TEXT,
	file_base64 TEXT,
	ocr_text TEXT,
	ocr_status TEXT NOT NULL DEFAULT 'none',
	summary TEXT,
	tags_json TEXT,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_memos_created_at ON memos(created_at);
CREATE INDEX IF NOT EXISTS idx_memos_ocr_status ON memos(ocr_status);
