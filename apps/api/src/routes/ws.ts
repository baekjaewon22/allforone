import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../index";
import { parseInput, toValidationResponse } from "../lib/validation";

const roomParamSchema = z.object({
	roomId: z.string().min(1),
});

export const wsRoutes = new Hono<AppEnv>()
	.onError((error) => toValidationResponse(error) ?? Response.json({ ok: false }, { status: 500 }))
	.get("/:roomId", (c) => {
		const { roomId } = parseInput("params", roomParamSchema, c.req.param());
		const id = c.env.DashboardRoom.idFromName(roomId);
		const room = c.env.DashboardRoom.get(id);

		return room.fetch(c.req.raw);
	});
