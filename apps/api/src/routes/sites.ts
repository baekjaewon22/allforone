import { Hono } from "hono";
import { z } from "zod";
import type { SiteLiveAction, SiteLiveReadCard } from "@all-for-one/shared";
import type { AppEnv } from "../index";
import { createMyDocsClient } from "../lib/my-docs";
import { parseInput, toValidationResponse } from "../lib/validation";
import {
	getManagedSiteDetail,
	getManagedSiteEndpoint,
	listManagedSites,
} from "../repositories/sites";

const siteParamSchema = z.object({
	siteId: z.string().min(1),
});

const siteEndpointParamSchema = siteParamSchema.extend({
	endpointId: z.string().min(1),
});

const liveSiteId = "my-auction-docs";

const myDocsReadDashboard = [
	{ id: "users", label: "사용자 목록" },
	{ id: "users-pending", label: "승인 대기" },
	{ id: "sales", label: "매출" },
	{ id: "sales-stats", label: "매출 통계" },
	{ id: "sales-pending", label: "대기 매출" },
	{ id: "accounting-alerts", label: "회계 알림" },
	{ id: "accounting-card-settlements-current-month", label: "카드 정산" },
	{ id: "card-transactions-current-month", label: "카드 거래" },
	{ id: "card-summary-current-month", label: "카드 요약" },
	{ id: "alimtalk-logs", label: "알림톡 로그" },
] as const;

const todayEndpointIds = new Set([
	"users-pending",
	"sales-pending",
	"accounting-alerts",
	"sales-refund-requests",
]);

const lockedActions: SiteLiveAction[] = [
	{
		id: "memo-create",
		label: "메모 추가",
		phase: "write",
		enabled: false,
		reason: "write Service Token 저장 후 활성화",
	},
	{
		id: "status-update",
		label: "상태 변경",
		phase: "write",
		enabled: false,
		reason: "write Service Token 저장 후 활성화",
	},
	{
		id: "assignee-update",
		label: "담당자 지정",
		phase: "write",
		enabled: false,
		reason: "write Service Token 저장 후 활성화",
	},
	{
		id: "schedule-upsert",
		label: "일정 생성/수정",
		phase: "write",
		enabled: false,
		reason: "write Service Token 저장 후 활성화",
	},
	{
		id: "admin-settings",
		label: "권한/토큰/설정 관리",
		phase: "admin",
		enabled: false,
		reason: "admin Service Token은 별도 확인 후 연결",
	},
];

const isReadOnlyEndpoint = (method: string): boolean =>
	["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());

const isMissingMyDocsTokenError = (error: unknown): boolean =>
	error instanceof Error &&
	error.message.includes("MY_DOCS_SERVICE_TOKEN_READ");

const toSafeLiveError = (error: unknown) => ({
	ok: false,
	error: "my_docs_request_failed",
	errorName: error instanceof Error ? error.name : "UnknownError",
	message: error instanceof Error ? error.message : "Unknown live request failure",
});

const toPreviewList = (value: unknown): unknown[] => {
	if (Array.isArray(value)) {
		return value.slice(0, 5);
	}
	if (value && typeof value === "object") {
		const record = value as Record<string, unknown>;
		const firstArray = Object.values(record).find(Array.isArray);
		if (Array.isArray(firstArray)) {
			return firstArray.slice(0, 5);
		}
		return [record];
	}
	return value == null ? [] : [value];
};

const countData = (value: unknown): number | undefined => {
	if (Array.isArray(value)) {
		return value.length;
	}
	if (value && typeof value === "object") {
		const firstArray = Object.values(value as Record<string, unknown>).find(Array.isArray);
		return Array.isArray(firstArray) ? firstArray.length : undefined;
	}
	return undefined;
};

const toReadCard = (
	endpointId: string,
	label: string,
	path: string,
	result: { ok: boolean; status: number; data?: unknown; error?: string },
): SiteLiveReadCard => ({
	id: endpointId,
	label,
	endpointId,
	path,
	ok: result.ok,
	status: result.status,
	count: result.ok ? countData(result.data) : undefined,
	preview: result.ok ? toPreviewList(result.data) : [],
	updatedAt: new Date().toISOString(),
	error: result.error,
});

export const siteRoutes = new Hono<AppEnv>()
	.onError(
		(error) => toValidationResponse(error) ?? Response.json({ ok: false }, { status: 500 }),
	)
	.get("/", (c) =>
		c.json({
			ok: true,
			sites: listManagedSites(),
		}),
	)
	.get("/:siteId", (c) => {
		const { siteId } = parseInput("params", siteParamSchema, c.req.param());
		const detail = getManagedSiteDetail(siteId);

		if (!detail) {
			return c.json({ ok: false, error: "site_not_found" }, 404);
		}

		return c.json({
			ok: true,
			...detail,
		});
	})
	.get("/:siteId/credentials", (c) => {
		const { siteId } = parseInput("params", siteParamSchema, c.req.param());
		const detail = getManagedSiteDetail(siteId);
		return detail
			? c.json({ ok: true, credentials: detail.credentials })
			: c.json({ ok: false, error: "site_not_found" }, 404);
	})
	.get("/:siteId/access", (c) => {
		const { siteId } = parseInput("params", siteParamSchema, c.req.param());
		const detail = getManagedSiteDetail(siteId);
		return detail
			? c.json({ ok: true, accessGrants: detail.accessGrants })
			: c.json({ ok: false, error: "site_not_found" }, 404);
	})
	.get("/:siteId/endpoints", (c) => {
		const { siteId } = parseInput("params", siteParamSchema, c.req.param());
		const detail = getManagedSiteDetail(siteId);
		return detail
			? c.json({ ok: true, endpoints: detail.endpoints })
			: c.json({ ok: false, error: "site_not_found" }, 404);
	})
	.get("/:siteId/admin-links", (c) => {
		const { siteId } = parseInput("params", siteParamSchema, c.req.param());
		const detail = getManagedSiteDetail(siteId);
		return detail
			? c.json({ ok: true, adminLinks: detail.adminLinks })
			: c.json({ ok: false, error: "site_not_found" }, 404);
	})
	.get("/:siteId/capabilities", (c) => {
		const { siteId } = parseInput("params", siteParamSchema, c.req.param());
		const detail = getManagedSiteDetail(siteId);
		return detail
			? c.json({ ok: true, capabilities: detail.capabilities })
			: c.json({ ok: false, error: "site_not_found" }, 404);
	})
	.get("/:siteId/live/overview", async (c) => {
		const { siteId } = parseInput("params", siteParamSchema, c.req.param());
		const detail = getManagedSiteDetail(siteId);
		if (!detail) {
			return c.json({ ok: false, error: "site_not_found" }, 404);
		}
		if (siteId !== liveSiteId) {
			return c.json({
				ok: true,
				overview: {
					siteId,
					mode: "iframe",
					status: "pending",
					readCards: [],
					today: [],
					actions: lockedActions,
					updatedAt: new Date().toISOString(),
					message: "이 사이트는 Service Token read API 구현 후 직접 관리 화면이 활성화됩니다.",
				},
			});
		}

		try {
			const client = createMyDocsClient(c.env);
			const readCards = await Promise.all(
				myDocsReadDashboard.map(async (target) => {
					const endpoint = getManagedSiteEndpoint(siteId, target.id);
					if (!endpoint) {
						return toReadCard(target.id, target.label, "", {
							ok: false,
							status: 404,
							error: "endpoint_not_found",
						});
					}

					try {
						const result = await client.read(endpoint.path);
						return toReadCard(target.id, target.label, endpoint.path, result);
					} catch (error) {
						return toReadCard(target.id, target.label, endpoint.path, {
							ok: false,
							status: 502,
							error: error instanceof Error ? error.message : "request_failed",
						});
					}
				}),
			);
			const okCount = readCards.filter((card) => card.ok).length;

			return c.json({
				ok: true,
				overview: {
					siteId,
					mode: "api",
					status:
						okCount === readCards.length
							? "ready"
							: okCount > 0
								? "partial"
								: "unavailable",
					readCards,
					today: readCards.filter((card) => todayEndpointIds.has(card.endpointId)),
					actions: lockedActions,
					updatedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			if (isMissingMyDocsTokenError(error)) {
				return c.json({
					ok: true,
					overview: {
						siteId,
						mode: "api",
						status: "unavailable",
						readCards: [],
						today: [],
						actions: lockedActions,
						updatedAt: new Date().toISOString(),
						message: "MY_DOCS_SERVICE_TOKEN_READ가 설정되지 않았습니다.",
					},
				});
			}

			return c.json(toSafeLiveError(error), 502);
		}
	})
	.get("/:siteId/live/health", async (c) => {
		const { siteId } = parseInput("params", siteParamSchema, c.req.param());
		if (siteId !== liveSiteId) {
			return c.json({ ok: false, error: "live_site_not_configured" }, 404);
		}

		try {
			const result = await createMyDocsClient(c.env).health();
			return c.json(
				{ ok: result.ok, status: result.status, data: result.data },
				result.ok ? 200 : 502,
			);
		} catch (error) {
			return c.json(toSafeLiveError(error), 502);
		}
	})
	.get("/:siteId/live/me", async (c) => {
		const { siteId } = parseInput("params", siteParamSchema, c.req.param());
		if (siteId !== liveSiteId) {
			return c.json({ ok: false, error: "live_site_not_configured" }, 404);
		}

		try {
			const result = await createMyDocsClient(c.env).read("/auth/me");
			return c.json(
				{ ok: result.ok, status: result.status, data: result.data },
				result.ok ? 200 : 502,
			);
		} catch (error) {
			if (isMissingMyDocsTokenError(error)) {
				return c.json(
					{ ok: false, error: "my_docs_read_token_not_configured" },
					503,
				);
			}

			return c.json(toSafeLiveError(error), 502);
		}
	})
	.get("/:siteId/live/embed-config", async (c) => {
		const { siteId } = parseInput("params", siteParamSchema, c.req.param());
		if (siteId !== liveSiteId) {
			return c.json({ ok: false, error: "live_site_not_configured" }, 404);
		}

		try {
			const result = await createMyDocsClient(c.env).embedConfig();
			return c.json(
				{ ok: result.ok, status: result.status, data: result.data },
				result.ok ? 200 : 502,
			);
		} catch (error) {
			if (isMissingMyDocsTokenError(error)) {
				return c.json(
					{ ok: false, error: "my_docs_read_token_not_configured" },
					503,
				);
			}

			return c.json(toSafeLiveError(error), 502);
		}
	})
	.get("/:siteId/live/read/:endpointId", async (c) => {
		const { siteId, endpointId } = parseInput(
			"params",
			siteEndpointParamSchema,
			c.req.param(),
		);
		if (siteId !== liveSiteId) {
			return c.json({ ok: false, error: "live_site_not_configured" }, 404);
		}

		const endpoint = getManagedSiteEndpoint(siteId, endpointId);
		if (!endpoint) {
			return c.json({ ok: false, error: "endpoint_not_found" }, 404);
		}
		if (!isReadOnlyEndpoint(endpoint.method)) {
			return c.json({ ok: false, error: "endpoint_not_read_only" }, 403);
		}

		try {
			const result = await createMyDocsClient(c.env).read(endpoint.path);
			return c.json(
				{ ok: result.ok, endpointId, status: result.status, data: result.data },
				result.ok ? 200 : 502,
			);
		} catch (error) {
			if (isMissingMyDocsTokenError(error)) {
				return c.json(
					{ ok: false, error: "my_docs_read_token_not_configured" },
					503,
				);
			}

			return c.json(toSafeLiveError(error), 502);
		}
	});
