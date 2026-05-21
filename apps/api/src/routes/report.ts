import { dateRangeSchema } from "@all-for-one/shared";
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../index";
import { parseInput, toValidationResponse } from "../lib/validation";

const connectorParamSchema = z.object({
	connectorId: z.string().min(1),
});

export const reportRoutes = new Hono<AppEnv>()
	.onError((error) => toValidationResponse(error) ?? Response.json({ ok: false }, { status: 500 }))
	.get("/metrics/:connectorId", (c) => {
		const { connectorId } = parseInput(
			"params",
			connectorParamSchema,
			c.req.param(),
		);
		const range = parseInput("query", dateRangeSchema, c.req.query());

		return c.json({
			ok: true,
			connectorId,
			range,
			metrics: [],
		});
	})
	.get("/recent/:connectorId", (c) => {
		const { connectorId } = parseInput(
			"params",
			connectorParamSchema,
			c.req.param(),
		);

		return c.json({
			ok: true,
			connectorId,
			items: [],
		});
	});
