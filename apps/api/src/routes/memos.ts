import { newMemoSchema } from "@all-for-one/shared";
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../index";
import { dispatchLlm } from "../lib/llm-dispatcher";
import { parseInput, parseJsonBody, toValidationResponse } from "../lib/validation";
import { createMemo, getMemo, listMemos, updateMemoSummary } from "../repositories/memos";

const idParamSchema = z.object({
	id: z.string().min(1),
});

export const memoRoutes = new Hono<AppEnv>()
	.onError(
		(error) => toValidationResponse(error) ?? Response.json({ ok: false }, { status: 500 }),
	)
	.get("/", async (c) => {
		const memos = await listMemos(c.env.DB);
		return c.json({ ok: true, memos });
	})
	.post("/", async (c) => {
		const input = await parseJsonBody(c.req.raw, newMemoSchema);
		const memo = await createMemo(c.env.DB, input);
		return c.json({ ok: true, memo }, 201);
	})
	.post("/:id/summarize", async (c) => {
		const { id } = parseInput("params", idParamSchema, c.req.param());
		const memo = await getMemo(c.env.DB, id);
		if (!memo) {
			return c.json({ ok: false, error: "memo_not_found" }, 404);
		}

		const sourceText = [memo.title, memo.ocrText, memo.content].filter(Boolean).join("\n\n");
		if (!sourceText.trim()) {
			return c.json({ ok: false, error: "memo_has_no_text" }, 422);
		}

		const result = await dispatchLlm(c.env, {
			provider: "openrouter",
			intent: "summarize",
			message: `다음 메모 내용을 한국어로 업무에 바로 쓰기 좋게 요약해줘.\n\n${sourceText}`,
			context: {
				source: "memo",
				memoId: memo.id,
				fileName: memo.fileName,
				ocrStatus: memo.ocrStatus,
			},
		});
		if (result.status === "failed") {
			return c.json({ ok: false, error: result.response }, 502);
		}

		const updated = await updateMemoSummary(c.env.DB, id, result.response);
		return c.json({ ok: true, memo: updated });
	});
