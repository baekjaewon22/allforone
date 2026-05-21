import { newWorkItemSchema } from "@all-for-one/shared";
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../index";
import { parseJsonBody, toValidationResponse } from "../lib/validation";
import {
	deleteExpiredWorkItemsByCategory,
	ingestWorkItem,
	listWorkDevices,
	listWorkItems,
	listWorkItemsByCategory,
} from "../repositories/work-intake";

export const TODAY_NEWS_CATEGORY = "today-news";
export const TODAY_NEWS_RETENTION_DAYS = 31;

const todayNewsSchema = z.object({
	title: z.string().min(1),
	content: z.string().optional(),
	file: z.string().optional(),
	fileUrl: z.string().url().optional(),
	filename: z.string().min(1).optional(),
	category: z.string().optional(),
	source: z.string().optional(),
	occurredAt: z.string().datetime().optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),
});

function stripInlineFile<T extends { metadata?: Record<string, unknown> }>(
	item: T,
): T {
	if (!item.metadata || typeof item.metadata.file !== "string") {
		return item;
	}

	const { file, ...metadata } = item.metadata;
	return {
		...item,
		metadata: {
			...metadata,
			inlineFileStored: true,
			inlineFileBytes: file.length,
		},
	};
}

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

export const workRoutes = new Hono<AppEnv>()
	.onError(
		(error) => toValidationResponse(error) ?? Response.json({ ok: false }, { status: 500 }),
	)
	.get("/devices", async (c) => {
		const devices = await listWorkDevices(c.env.DB);
		return c.json({ ok: true, devices });
	})
	.get("/items", async (c) => {
		const items = await listWorkItems(c.env.DB);
		return c.json({ ok: true, items: items.map(stripInlineFile) });
	})
	.get("/news/today", async (c) => {
		const items = await listWorkItemsByCategory(c.env.DB, TODAY_NEWS_CATEGORY);
		return c.json({
			ok: true,
			category: TODAY_NEWS_CATEGORY,
			items: items.map(stripInlineFile),
		});
	})
	.post("/news/today", async (c) => {
		if (!isAuthorized({ req: c.req.raw, env: c.env })) {
			return c.json({ ok: false, error: "device_ingest_unauthorized" }, 401);
		}

		const input = await parseJsonBody(c.req.raw, todayNewsSchema);
		const item = await ingestWorkItem(c.env.DB, {
			deviceId: "today-news",
			deviceName: "오늘의 뉴스",
			hostname: "all-for-one",
			platform: "cms",
			kind: "file",
			title: input.title,
			summary: input.content,
			url: input.fileUrl,
			path: input.filename,
			occurredAt: input.occurredAt,
			metadata: {
				...input.metadata,
				category: TODAY_NEWS_CATEGORY,
				source: input.source ?? "cms",
				contentCategory: input.category,
				filename: input.filename,
				hasPdf: Boolean(input.file || input.fileUrl),
				fileEncoding: input.file ? "base64" : undefined,
				file: input.file,
				fileUrl: input.fileUrl,
				retentionDays: TODAY_NEWS_RETENTION_DAYS,
			},
		});

		return c.json({ ok: true, item }, 201);
	})
	.post("/news/cleanup", async (c) => {
		if (!isAuthorized({ req: c.req.raw, env: c.env })) {
			return c.json({ ok: false, error: "device_ingest_unauthorized" }, 401);
		}

		const cutoff = new Date(
			Date.now() - TODAY_NEWS_RETENTION_DAYS * 24 * 60 * 60 * 1000,
		).toISOString();
		const deleted = await deleteExpiredWorkItemsByCategory(
			c.env.DB,
			TODAY_NEWS_CATEGORY,
			cutoff,
		);
		return c.json({ ok: true, category: TODAY_NEWS_CATEGORY, cutoff, deleted });
	})
	.post("/ingest", async (c) => {
		if (!isAuthorized({ req: c.req.raw, env: c.env })) {
			return c.json({ ok: false, error: "device_ingest_unauthorized" }, 401);
		}

		const input = await parseJsonBody(c.req.raw, newWorkItemSchema);
		const item = await ingestWorkItem(c.env.DB, input);
		return c.json({ ok: true, item }, 201);
	});
