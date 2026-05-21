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

const callbackSchema = z.object({
	code: z.string().min(1),
	state: z.string().min(1),
});

export const authRoutes = new Hono<AppEnv>()
	.onError((error) => toValidationResponse(error) ?? Response.json({ ok: false }, { status: 500 }))
	.get("/connect/:connectorId", (c) => {
		const { connectorId } = parseInput(
			"params",
			connectorParamSchema,
			c.req.param(),
		);

		return c.json({
			ok: true,
			connectorId,
			status: "authorization_not_configured",
		});
	})
	.post("/callback/:connectorId", async (c) => {
		const { connectorId } = parseInput(
			"params",
			connectorParamSchema,
			c.req.param(),
		);
		const input = await parseJsonBody(c.req.raw, callbackSchema);

		return c.json({
			ok: true,
			connectorId,
			status: "callback_received",
			state: input.state,
		});
	})
	.post("/logout", async (c) => {
		await parseJsonBody(c.req.raw, emptySchema);

		return c.json({
			ok: true,
			status: "logout_placeholder",
		});
	});
