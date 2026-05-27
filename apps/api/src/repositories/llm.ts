import type { LlmProviderId, LlmRun } from "@all-for-one/shared";

type LlmRunRow = {
	id: string;
	provider: LlmProviderId;
	model: string;
	intent: "chat" | "summarize" | "command_preview";
	prompt: string;
	response: string;
	status: "completed" | "fallback" | "failed";
	input_tokens: number | null;
	output_tokens: number | null;
	total_tokens: number | null;
	created_at: string;
};

export type CreateLlmRunInput = {
	provider: LlmProviderId;
	model: string;
	intent: "chat" | "summarize" | "command_preview";
	prompt: string;
	response: string;
	status: "completed" | "fallback" | "failed";
	usage?: LlmRun["usage"];
	metadata?: Record<string, unknown>;
};

const toLlmRun = (row: LlmRunRow): LlmRun => ({
	id: row.id,
	provider: row.provider,
	model: row.model,
	intent: row.intent,
	prompt: row.prompt,
	response: row.response,
	status: row.status,
	usage:
		row.input_tokens || row.output_tokens || row.total_tokens
			? {
					inputTokens: row.input_tokens ?? undefined,
					outputTokens: row.output_tokens ?? undefined,
					totalTokens: row.total_tokens ?? undefined,
				}
			: undefined,
	createdAt: row.created_at,
});

export async function createLlmRun(
	db: D1Database,
	input: CreateLlmRunInput,
): Promise<LlmRun> {
	const id = crypto.randomUUID();
	const now = new Date().toISOString();

	await db
		.prepare(`
			INSERT INTO llm_runs (
				id, provider, model, intent, prompt, response, status,
				input_tokens, output_tokens, total_tokens, metadata_json, created_at
			)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`)
		.bind(
			id,
			input.provider,
			input.model,
			input.intent,
			input.prompt,
			input.response,
			input.status,
			input.usage?.inputTokens ?? null,
			input.usage?.outputTokens ?? null,
			input.usage?.totalTokens ?? null,
			input.metadata ? JSON.stringify(input.metadata) : null,
			now,
		)
		.run();

	return {
		id,
		provider: input.provider,
		model: input.model,
		intent: input.intent,
		prompt: input.prompt,
		response: input.response,
		status: input.status,
		usage: input.usage,
		createdAt: now,
	};
}

export async function listLlmRuns(db: D1Database): Promise<LlmRun[]> {
	const result = await db
		.prepare(`
			SELECT id, provider, model, intent, prompt, response, status,
				input_tokens, output_tokens, total_tokens, created_at
			FROM llm_runs
			ORDER BY created_at DESC
			LIMIT 50
		`)
		.all<LlmRunRow>();

	return (result.results ?? []).map(toLlmRun);
}
