import { healthConnectSyncSchema } from "@all-for-one/shared";
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../index";
import {
	getHealthConnectSyncState,
	listHealthConnectSummaries,
	upsertHealthConnectBatch,
} from "../repositories/health-connect";
import { parseInput, parseJsonBody, toValidationResponse } from "../lib/validation";

const dailyQuerySchema = z.object({
	from: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	to: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	deviceId: z.string().min(1).optional(),
});

const statusQuerySchema = z.object({
	deviceId: z.string().min(1).optional(),
});

function isAuthorized(c: { req: Request; env: AppEnv["Bindings"] }) {
	const expected = c.env.AFO_DEVICE_INGEST_KEY;

	if (!expected && c.env.ENVIRONMENT === "prod") {
		return false;
	}
	if (!expected) {
		return true;
	}

	return c.req.headers.get("X-AFO-Device-Key") === expected;
}

export const healthConnectRoutes = new Hono<AppEnv>()
	.onError(
		(error) => toValidationResponse(error) ?? Response.json({ ok: false }, { status: 500 }),
	)
	.get("/status", async (c) => {
		const { deviceId } = parseInput("query", statusQuerySchema, c.req.query());
		if (!deviceId) {
			return c.json({
				ok: true,
				configured: Boolean(c.env.AFO_DEVICE_INGEST_KEY) || c.env.ENVIRONMENT !== "prod",
			});
		}

		const state = await getHealthConnectSyncState(c.env.DB, deviceId);
		return c.json({ ok: true, state });
	})
	.get("/daily", async (c) => {
		const query = parseInput("query", dailyQuerySchema, c.req.query());
		const summaries = await listHealthConnectSummaries(c.env.DB, query);
		return c.json({ ok: true, summaries });
	})
	.post("/sync", async (c) => {
		if (!isAuthorized({ req: c.req.raw, env: c.env })) {
			return c.json({ ok: false, error: "device_ingest_unauthorized" }, 401);
		}

		const input = await parseJsonBody(c.req.raw, healthConnectSyncSchema);
		const summaries = await upsertHealthConnectBatch(c.env.DB, input);
		return c.json({ ok: true, summaries }, 201);
	});
