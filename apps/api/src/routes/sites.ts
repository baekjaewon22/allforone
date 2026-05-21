import { Hono } from "hono";
import { z } from "zod";
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
