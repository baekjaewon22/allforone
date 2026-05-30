import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRoutes } from "./routes/auth";
import { geoRoutes } from "./routes/geo";
import { healthConnectRoutes } from "./routes/health-connect";
import { llmRoutes } from "./routes/llm";
import { memoRoutes } from "./routes/memos";
import { personalRoutes } from "./routes/personal";
import { reportRoutes } from "./routes/report";
import { siteRoutes } from "./routes/sites";
import { scheduleRoutes } from "./routes/schedule";
import { syncRoutes } from "./routes/sync";
import { TODAY_NEWS_CATEGORY, TODAY_NEWS_RETENTION_DAYS, workRoutes } from "./routes/work";
import { wsRoutes } from "./routes/ws";
import { deleteExpiredWorkItemsByCategory } from "./repositories/work-intake";
import { sendDailySlackDigestIfDue } from "./lib/slack-daily-digest";

export type Bindings = {
	DB: D1Database;
	SESSIONS: KVNamespace;
	ASSETS: R2Bucket;
	KEK: string;
	DashboardRoom: DurableObjectNamespace;
	MY_DOCS_API_BASE_URL?: string;
	MY_DOCS_SERVICE_TOKEN_READ?: string;
	MY_DOCS_SERVICE_TOKEN_WRITE?: string;
	MY_DOCS_SERVICE_TOKEN_ADMIN?: string;
	LANDING_LAW_API_BASE_URL?: string;
	LANDING_LAW_SERVICE_TOKEN_READ?: string;
	AFO_DEVICE_INGEST_KEY?: string;
	GEMINI_API_KEY?: string;
	GEMINI_MODEL?: string;
	OPENROUTER_API_KEY?: string;
	OPENROUTER_MODEL?: string;
	OLLAMA_BASE_URL?: string;
	OLLAMA_MODEL?: string;
	SLACK_WEBHOOK_URL?: string;
	ENVIRONMENT?: "dev" | "preview" | "prod";
};

export type AppEnv = {
	Bindings: Bindings;
};

export const app = new Hono<AppEnv>()
	.use(
		"*",
		cors({
			origin: [
				"http://127.0.0.1:5173",
				"http://127.0.0.1:5174",
				"http://localhost",
				"https://localhost",
				"capacitor://localhost",
				"https://all-for-one-db9.pages.dev",
			],
			allowHeaders: ["Content-Type", "X-AFO-Device-Key"],
			allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		}),
	)
	.get("/healthz", (c) =>
		c.json({
			ok: true,
			service: "all-for-one-api",
		}),
	)
	.route("/auth", authRoutes)
	.route("/sync", syncRoutes)
	.route("/schedule", scheduleRoutes)
	.route("/report", reportRoutes)
	.route("/personal", personalRoutes)
	.route("/geo", geoRoutes)
	.route("/health-connect", healthConnectRoutes)
	.route("/llm", llmRoutes)
	.route("/memos", memoRoutes)
	.route("/sites", siteRoutes)
	.route("/work", workRoutes)
	.route("/ws", wsRoutes);

export type AppType = typeof app;

export { DashboardRoom } from "./durable-objects/dashboard-room";

export default {
	fetch: app.fetch,
	async scheduled(event, env) {
		const cutoff = new Date(
			Date.now() - TODAY_NEWS_RETENTION_DAYS * 24 * 60 * 60 * 1000,
		).toISOString();

		await Promise.all([
			deleteExpiredWorkItemsByCategory(env.DB, TODAY_NEWS_CATEGORY, cutoff),
			sendDailySlackDigestIfDue(env, event.scheduledTime),
		]);
	},
} satisfies ExportedHandler<Bindings>;
