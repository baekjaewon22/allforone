import {
	newAiReportSchema,
	newDailyLogSchema,
	newHealthEntrySchema,
	newPersonalScheduleSchema,
	patchPersonalScheduleSchema,
} from "@all-for-one/shared";
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../index";
import { parseInput, parseJsonBody, toValidationResponse } from "../lib/validation";
import { getLatestHealthConnectSummaryByDate } from "../repositories/health-connect";
import {
	createPersonalSchedule,
	createAiReport,
	deletePersonalSchedule,
	getDailyLogByDate,
	getHealthEntryByDate,
	listAiReports,
	listDailyLogs,
	listHealthEntries,
	listPersonalSchedules,
	updatePersonalSchedule,
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

const scheduleRangeQuerySchema = z.object({
	from: z.string().datetime({ offset: true }).optional(),
	to: z.string().datetime({ offset: true }).optional(),
});

const idParamSchema = z.object({
	id: z.string().min(1),
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

function isTodayNewsItem(item: {
	deviceId?: string;
	deviceName?: string;
	metadata?: Record<string, unknown>;
}) {
	return (
		item.metadata?.category === TODAY_NEWS_CATEGORY ||
		item.deviceId === "today-news" ||
		item.deviceName === "오늘의 뉴스" ||
		item.deviceName === "?ㅻ뒛???댁뒪"
	);
}

function isDeviceAuthorized(c: { req: Request; env: AppEnv["Bindings"] }) {
	const expected = c.env.AFO_DEVICE_INGEST_KEY;

	if (!expected && c.env.ENVIRONMENT === "prod") {
		return false;
	}
	if (!expected) {
		return true;
	}

	return c.req.headers.get("X-AFO-Device-Key") === expected;
}

export const personalRoutes = new Hono<AppEnv>()
	.onError(
		(error) => toValidationResponse(error) ?? Response.json({ ok: false }, { status: 500 }),
	)
	.get("/today", async (c) => {
		const { date } = parseInput("query", dateQuerySchema, c.req.query());
		const targetDate = date ?? todayDate();
		const dayStart = new Date(`${targetDate}T00:00:00.000Z`).toISOString();
		const dayEnd = new Date(`${targetDate}T23:59:59.999Z`).toISOString();
		const [
			dailyLog,
			healthEntry,
			healthConnectSummary,
			schedules,
			workItems,
			aiReports,
			todayNews,
		] =
			await Promise.all([
				getDailyLogByDate(c.env.DB, targetDate),
				getHealthEntryByDate(c.env.DB, targetDate),
				getLatestHealthConnectSummaryByDate(c.env.DB, targetDate),
				listPersonalSchedules(c.env.DB, { from: dayStart, to: dayEnd }),
				listWorkItems(c.env.DB),
				listAiReports(c.env.DB),
				listWorkItemsByCategory(c.env.DB, TODAY_NEWS_CATEGORY),
			]);
		const sanitizedNews = todayNews.map(stripInlineFile);
		const openWorkItems = workItems
			.filter((item) => !isTodayNewsItem(item))
			.map(stripInlineFile);

		return c.json({
			ok: true,
			snapshot: {
				date: targetDate,
				dailyLog,
				healthEntry,
				healthConnectSummary,
				schedules,
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
	.get("/schedules", async (c) => {
		const range = parseInput("query", scheduleRangeQuerySchema, c.req.query());
		const schedules = await listPersonalSchedules(c.env.DB, range);
		return c.json({ ok: true, schedules });
	})
	.post("/schedules", async (c) => {
		const input = await parseJsonBody(c.req.raw, newPersonalScheduleSchema);
		const schedule = await createPersonalSchedule(c.env.DB, input);
		return c.json({ ok: true, schedule }, 201);
	})
	.patch("/schedules/:id", async (c) => {
		const { id } = parseInput("params", idParamSchema, c.req.param());
		const input = await parseJsonBody(c.req.raw, patchPersonalScheduleSchema);
		const schedule = await updatePersonalSchedule(c.env.DB, id, input);
		return schedule
			? c.json({ ok: true, schedule })
			: c.json({ ok: false, error: "schedule_not_found" }, 404);
	})
	.delete("/schedules/:id", async (c) => {
		const { id } = parseInput("params", idParamSchema, c.req.param());
		const deleted = await deletePersonalSchedule(c.env.DB, id);
		return deleted
			? c.json({ ok: true })
			: c.json({ ok: false, error: "schedule_not_found" }, 404);
	})
	.get("/ai-reports", async (c) => {
		const reports = await listAiReports(c.env.DB);
		return c.json({ ok: true, reports });
	})
	.post("/ai-reports", async (c) => {
		if (!isDeviceAuthorized({ req: c.req.raw, env: c.env })) {
			return c.json({ ok: false, error: "device_ingest_unauthorized" }, 401);
		}

		const input = await parseJsonBody(c.req.raw, newAiReportSchema);
		const report = await createAiReport(c.env.DB, input);
		return c.json({ ok: true, report }, 201);
	});
