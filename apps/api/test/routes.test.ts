import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/index";

const iso = "2026-05-18T00:00:00.000Z";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("api routes", () => {
	it("responds to health checks", async () => {
		const response = await app.request("/healthz");

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toMatchObject({
			ok: true,
			service: "all-for-one-api",
		});
	});

	it("zod-validates route inputs before schedule handler placeholders", async () => {
		const response = await app.request("/schedule/demo");

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toMatchObject({
			ok: false,
			error: "validation_error",
			source: "query",
		});
	});

	it("returns schedule skeleton output for valid input", async () => {
		const response = await app.request(
			`/schedule/demo?from=${encodeURIComponent(iso)}&to=${encodeURIComponent(iso)}`,
		);

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toMatchObject({
			ok: true,
			connectorId: "demo",
			items: [],
		});
	});

	it("exposes auth skeleton routes", async () => {
		const response = await app.request("/auth/connect/demo");

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toMatchObject({
			ok: true,
			connectorId: "demo",
			status: "authorization_not_configured",
		});
	});

	it("protects production work intake when no device key is configured", async () => {
		const response = await app.request(
			"/work/ingest",
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({}),
			},
			{
				ENVIRONMENT: "prod",
			},
		);

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toMatchObject({
			ok: false,
			error: "device_ingest_unauthorized",
		});
	});

	it("zod-validates work intake payloads", async () => {
		const response = await app.request(
			"/work/ingest",
			{
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ deviceId: "desktop-main" }),
			},
			{
				ENVIRONMENT: "dev",
			},
		);

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toMatchObject({
			ok: false,
			error: "validation_error",
			source: "body",
		});
	});

	it("returns the my-auction-docs managed site detail", async () => {
		const response = await app.request("/sites/my-auction-docs");

		expect(response.status).toBe(200);
		const body = (await response.json()) as { credentials: unknown[] };
		expect(body).toMatchObject({
			ok: true,
			site: {
				id: "my-auction-docs",
				domain: "https://my-docs.kr",
			},
		});
		expect(body.credentials).toContainEqual(
			expect.objectContaining({
				label: "All For One 읽기 토큰",
				maskedPreview: "MY_DOCS_SERVICE_TOKEN_READ",
				status: "active",
			}),
		);
	});

	it("returns the landing-law managed site detail", async () => {
		const response = await app.request("/sites/landing-law");

		expect(response.status).toBe(200);
		const body = (await response.json()) as { adminLinks: unknown[]; capabilities: unknown[] };
		expect(body).toMatchObject({
			ok: true,
			site: {
				id: "landing-law",
				domain: "https://lawitgo.com",
			},
		});
		expect(body.adminLinks).toContainEqual(
			expect.objectContaining({
				id: "calendar",
				url: "https://lawitgo.com/admin/calendar",
			}),
		);
		expect(body.capabilities).toContainEqual(
			expect.objectContaining({
				capability: "service-token-auth",
				enabled: false,
			}),
		);
	});

	it("proxies my-docs health without exposing or requiring a token", async () => {
		const fetchMock = vi.fn<typeof fetch>(async () =>
			Response.json({ ok: true }),
		);
		vi.stubGlobal("fetch", fetchMock);

		const response = await app.request(
			"/sites/my-auction-docs/live/health",
			undefined,
			{
				MY_DOCS_API_BASE_URL: "https://my-docs.kr/api",
			},
		);

		expect(response.status).toBe(200);
		expect(fetchMock).toHaveBeenCalledWith(
			"https://my-docs.kr/api/health",
			expect.objectContaining({
				method: "GET",
				headers: expect.any(Headers),
			}),
		);
		const [, init] = fetchMock.mock.calls[0] ?? [];
		const headers = init?.headers as Headers;
		expect(headers.get("Authorization")).toBeNull();
	});

	it("proxies my-docs embed config with the read service token", async () => {
		const fetchMock = vi.fn<typeof fetch>(async () =>
			Response.json({
				allowed: true,
				pages: ["/users", "/accounting"],
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		const response = await app.request(
			"/sites/my-auction-docs/live/embed-config",
			undefined,
			{
				MY_DOCS_API_BASE_URL: "https://my-docs.kr/api",
				MY_DOCS_SERVICE_TOKEN_READ: "secret-token",
			},
		);

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toMatchObject({
			ok: true,
			data: {
				allowed: true,
			},
		});
		const [, init] = fetchMock.mock.calls[0] ?? [];
		const headers = init?.headers as Headers;
		expect(headers.get("Authorization")).toBe("Bearer secret-token");
	});

	it("returns a clear error when my-docs read token is missing", async () => {
		const response = await app.request(
			"/sites/my-auction-docs/live/me",
			undefined,
			{
				MY_DOCS_API_BASE_URL: "https://my-docs.kr/api",
			},
		);

		expect(response.status).toBe(503);
		await expect(response.json()).resolves.toMatchObject({
			ok: false,
			error: "my_docs_read_token_not_configured",
		});
	});
});
