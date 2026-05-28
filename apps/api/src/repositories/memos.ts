import type { Memo, NewMemo } from "@all-for-one/shared";

type MemoRow = {
	id: string;
	title: string;
	content: string | null;
	file_name: string | null;
	mime_type: string | null;
	file_base64: string | null;
	ocr_text: string | null;
	ocr_status: Memo["ocrStatus"];
	summary: string | null;
	tags_json: string | null;
	created_at: string;
	updated_at: string;
};

const toMemo = (row: MemoRow): Memo => ({
	id: row.id,
	title: row.title,
	content: row.content ?? undefined,
	fileName: row.file_name ?? undefined,
	mimeType: row.mime_type ?? undefined,
	fileBase64: row.file_base64 ?? undefined,
	ocrText: row.ocr_text ?? undefined,
	ocrStatus: row.ocr_status,
	summary: row.summary ?? undefined,
	tags: row.tags_json ? JSON.parse(row.tags_json) : undefined,
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

export async function createMemo(db: D1Database, input: NewMemo): Promise<Memo> {
	const now = new Date().toISOString();
	const id = crypto.randomUUID();
	const hasAttachment = Boolean(input.fileBase64);
	const ocrStatus: Memo["ocrStatus"] = input.ocrText ? "completed" : hasAttachment ? "pending" : "none";

	await db
		.prepare(`
			INSERT INTO memos (
				id, title, content, file_name, mime_type, file_base64,
				ocr_text, ocr_status, summary, tags_json, created_at, updated_at
			)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)
		`)
		.bind(
			id,
			input.title,
			input.content ?? null,
			input.fileName ?? null,
			input.mimeType ?? null,
			input.fileBase64 ?? null,
			input.ocrText ?? null,
			ocrStatus,
			input.tags ? JSON.stringify(input.tags) : null,
			now,
			now,
		)
		.run();

	const memo = await getMemo(db, id);
	if (!memo) {
		throw new Error("memo_create_failed");
	}
	return memo;
}

export async function getMemo(db: D1Database, id: string): Promise<Memo | undefined> {
	const row = await db
		.prepare(`
			SELECT
				id, title, content, file_name, mime_type, file_base64,
				ocr_text, ocr_status, summary, tags_json, created_at, updated_at
			FROM memos
			WHERE id = ?
		`)
		.bind(id)
		.first<MemoRow>();

	return row ? toMemo(row) : undefined;
}

export async function listMemos(db: D1Database): Promise<Memo[]> {
	const result = await db
		.prepare(`
			SELECT
				id, title, content, file_name, mime_type, NULL AS file_base64,
				ocr_text, ocr_status, summary, tags_json, created_at, updated_at
			FROM memos
			ORDER BY created_at DESC
			LIMIT 100
		`)
		.all<MemoRow>();

	return (result.results ?? []).map(toMemo);
}

export async function updateMemoSummary(
	db: D1Database,
	id: string,
	summary: string,
): Promise<Memo> {
	const now = new Date().toISOString();
	await db
		.prepare("UPDATE memos SET summary = ?, updated_at = ? WHERE id = ?")
		.bind(summary, now, id)
		.run();

	const memo = await getMemo(db, id);
	if (!memo) {
		throw new Error("memo_not_found");
	}
	return memo;
}
