CREATE TABLE IF NOT EXISTS llm_runs (
	id TEXT PRIMARY KEY,
	provider TEXT NOT NULL,
	model TEXT NOT NULL,
	intent TEXT NOT NULL,
	prompt TEXT NOT NULL,
	response TEXT NOT NULL,
	status TEXT NOT NULL,
	input_tokens INTEGER,
	output_tokens INTEGER,
	total_tokens INTEGER,
	metadata_json TEXT,
	created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_llm_runs_created_at ON llm_runs(created_at);
CREATE INDEX IF NOT EXISTS idx_llm_runs_provider ON llm_runs(provider);
CREATE INDEX IF NOT EXISTS idx_llm_runs_intent ON llm_runs(intent);
