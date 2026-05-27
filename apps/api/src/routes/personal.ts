import {
	newAiReportSchema,
	newDailyLogSchema,
	newHealthEntrySchema,
} from "@all-for-one/shared";
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../index";
import { parseInput, parseJsonBody, toValidationResponse } from "../lib/validation";
import {
	createAiReport,
	getDailyLogByDate,
	getHealthEntryByDate,
	listAiReports,
	listDailyLogs,
	listHealthEntries,
	upsertDailyLog,
	upsertHealthEntry,
} from "../repositories/personal-os";
import { listWorkItems, listWorkItemsByCategory } from "../repositories/work-intake";
import { TODAY_NEWS_CATEGORY } from "./work";

const dateQuerySchema = z.object({
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
});

const todayDate = () => new Date().toISOString().slice(0, 10);

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

export const personalRoutes = new Hono<AppEnv>()
	.onError(
		(error) => toValidationResponse(error) ?? Response.json({ ok: false }, { status: 500 }),
	)
	.get("/today", async (c) => {
		const { date } = parseInput("query", dateQuerySchema, c.req.query());
		const targetDate = date ?? todayDate();
		const [dailyLog, healthEntry, workItems, aiReports, todayNews] =
			await Promise.all([
				getDailyLogByDate(c.env.DB, targetDate),
				getHealthEntryByDate(c.env.DB, targetDate),
				listWorkItems(c.env.DB),
				listAiReports(c.env.DB),
				listWorkItemsByCategory(c.env.DB, TODAY_NEWS_CATEGORY),
			]);
		const sanitizedNews = todayNews.map(stripInlineFile);
		const openWorkItems = workItems
			.filter((item) => item.metadata?.category !== TODAY_NEWS_CATEGORY)
			.map(stripInlineFile);

		return c.json({
			ok: true,
			snapshot: {
				date: targetDate,
				dailyLog,
				healthEntry,
				openWorkItems: openWorkItems
					.filter((item) => item.status === "new")
					.slice(0, 10),
				aiReports: aiReports
					.filter((report) => report.status === "received" || report.status === "needs_review")
					.slice(0, 10),
				todayNews: sanitizedNews.slice(0, 10),
			},
		});
	})
	.get("/life/logs", async (c) => {
		const logs = await listDailyLogs(c.env.DB);
		return c.json({ ok: true, logs });
	})
	.post("/life/logs", async (c) => {
		const input = await parseJsonBody(c.req.raw, newDailyLogSchema);
		const log = await upsertDailyLog(c.env.DB, input);
		return c.json({ ok: true, log }, 201);
	})
	.get("/health/entries", async (c) => {
		const entries = await listHealthEntries(c.env.DB);
		return c.json({ ok: true, entries });
	})
	.post("/health/entries", async (c) => {
		const input = await parseJsonBody(c.req.raw, newHealthEntrySchema);
		const entry = await upsertHealthEntry(c.env.DB, input);
		return c.json({ ok: true, entry }, 201);
	})
	.get("/ai-reports", async (c) => {
		const reports = await listAiReports(c.env.DB);
		return c.json({ ok: true, reports });
	})
	.post("/ai-reports", async (c) => {
		const input = await parseJsonBody(c.req.raw, newAiReportSchema);
		const report = await createAiReport(c.env.DB, input);
		return c.json({ ok: true, report }, 201);
	});
