import { newLlmChatSchema } from "@all-for-one/shared";
import { Hono } from "hono";
import type { AppEnv } from "../index";
import { dispatchLlm, listLlmProviders } from "../lib/llm-dispatcher";
import { parseJsonBody, toValidationResponse } from "../lib/validation";
import { createLlmRun, listLlmRuns } from "../repositories/llm";

export const llmRoutes = new Hono<AppEnv>()
	.onError(
		(error) => toValidationResponse(error) ?? Response.json({ ok: false }, { status: 500 }),
	)
	.get("/providers", (c) =>
		c.json({
			ok: true,
			providers: listLlmProviders(c.env),
		}),
	)
	.get("/history", async (c) => {
		const runs = await listLlmRuns(c.env.DB);
		return c.json({ ok: true, runs });
	})
	.post("/chat", async (c) => {
		const input = await parseJsonBody(c.req.raw, newLlmChatSchema);
		const result = await dispatchLlm(c.env, input);
		const run = await createLlmRun(c.env.DB, {
			provider: result.provider,
			model: result.model,
			intent: input.intent ?? "chat",
			prompt: input.message,
			response: result.response,
			status: result.status,
			usage: result.usage,
			metadata: input.context,
		});

		return c.json({ ok: result.status !== "failed", run }, result.status === "failed" ? 502 : 200);
	})
	.post("/summarize", async (c) => {
		const input = await parseJsonBody(c.req.raw, newLlmChatSchema);
		const result = await dispatchLlm(c.env, { ...input, intent: "summarize" });
		const run = await createLlmRun(c.env.DB, {
			provider: result.provider,
			model: result.model,
			intent: "summarize",
			prompt: input.message,
			response: result.response,
			status: result.status,
			usage: result.usage,
			metadata: input.context,
		});

		return c.json({ ok: result.status !== "failed", run }, result.status === "failed" ? 502 : 200);
	})
	.post("/command/preview", async (c) => {
		const input = await parseJsonBody(c.req.raw, newLlmChatSchema);
		const result = await dispatchLlm(c.env, { ...input, intent: "command_preview" });
		const run = await createLlmRun(c.env.DB, {
			provider: result.provider,
			model: result.model,
			intent: "command_preview",
			prompt: input.message,
			response: result.response,
			status: result.status,
			usage: result.usage,
			metadata: input.context,
		});

		return c.json({ ok: result.status !== "failed", run }, result.status === "failed" ? 502 : 200);
	});
