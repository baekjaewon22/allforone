import { newScheduleItemSchema, dateRangeSchema } from "@all-for-one/shared";
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../index";
import {
	parseInput,
	parseJsonBody,
	toValidationResponse,
} from "../lib/validation";

const connectorParamSchema = z.object({
	connectorId: z.string().min(1),
});

export const scheduleRoutes = new Hono<AppEnv>()
	.onError((error) => toValidationResponse(error) ?? Response.json({ ok: false }, { status: 500 }))
	.get("/:connectorId", (c) => {
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
			items: [],
		});
	})
	.post("/:connectorId", async (c) => {
		const { connectorId } = parseInput(
			"params",
			connectorParamSchema,
			c.req.param(),
		);
		const item = await parseJsonBody(c.req.raw, newScheduleItemSchema);

		return c.json(
			{
				ok: true,
				connectorId,
				item,
				status: "create_placeholder",
			},
			201,
		);
	});
