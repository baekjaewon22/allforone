import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../index";
import {
	emptySchema,
	parseInput,
	parseJsonBody,
	toValidationResponse,
} from "../lib/validation";

const connectorParamSchema = z.object({
	connectorId: z.string().min(1),
});

export const syncRoutes = new Hono<AppEnv>()
	.onError((error) => toValidationResponse(error) ?? Response.json({ ok: false }, { status: 500 }))
	.get("/state/:connectorId", (c) => {
		const { connectorId } = parseInput(
			"params",
			connectorParamSchema,
			c.req.param(),
		);

		return c.json({
			ok: true,
			connectorId,
			status: "not_started",
		});
	})
	.post("/pull/:connectorId", async (c) => {
		const { connectorId } = parseInput(
			"params",
			connectorParamSchema,
			c.req.param(),
		);
		await parseJsonBody(c.req.raw, emptySchema);

		return c.json({
			ok: true,
			connectorId,
			status: "sync_queued_placeholder",
		});
	});
