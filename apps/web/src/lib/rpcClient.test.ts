import { afterEach, describe, expect, it, vi } from "vitest";
import { rpcClient } from "./rpcClient";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("rpcClient placeholder", () => {
	it("returns connector summaries", async () => {
		await expect(rpcClient.getConnectors()).resolves.toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: "my-auction-docs" }),
				expect.objectContaining({ id: "landing-law" }),
			]),
		);
	});

	it("returns the managed site detail without raw secrets", async () => {
		const detail = await rpcClient.getManagedSiteDetail("my-auction-docs");

	expect(detail.site.domain).toBe("https://my-docs.kr");
	expect(detail.credentials[0]).toMatchObject({
		maskedPreview: "MY_DOCS_SERVICE_TOKEN_READ",
		status: "active",
	});
		expect(detail.credentials[0]).not.toHaveProperty("secret");
	});

	it("returns landing-law embedded admin links while service tokens are pending", async () => {
		const detail = await rpcClient.getManagedSiteDetail("landing-law");

		expect(detail.site.domain).toBe("https://lawitgo.com");
		expect(detail.adminLinks).toContainEqual(
			expect.objectContaining({
				id: "calendar",
				url: "https://lawitgo.com/admin/calendar",
			}),
		);
		expect(detail.capabilities).toContainEqual(
			expect.objectContaining({
				capability: "service-token-auth",
				enabled: false,
			}),
		);
	});

	it("returns the local work intake placeholder", async () => {
		vi.stubGlobal("fetch", vi.fn(async () => {
			throw new Error("offline");
		}));

		const snapshot = await rpcClient.getWorkIntakeSnapshot();

		expect(snapshot.devices).toContainEqual(
			expect.objectContaining({ id: "desktop-main" }),
		);
		expect(snapshot.items).toContainEqual(
			expect.objectContaining({ kind: "snapshot", status: "new" }),
		);
	});
});
