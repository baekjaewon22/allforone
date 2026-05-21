import { describe, expect, it } from "vitest";
import {
	newManagedSiteSchema,
	newSiteCredentialSchema,
	siteEndpointSchema,
} from "./schemas";

describe("managed site schemas", () => {
	it("accepts my-auction-docs managed site input", () => {
		expect(
			newManagedSiteSchema.parse({
				name: "my-auction-docs",
				domain: "https://my-docs.kr",
				description: "Cloudflare Workers + D1 admin site",
			}),
		).toMatchObject({
			name: "my-auction-docs",
		});
	});

	it("keeps credential secrets out of persisted credential schema", () => {
		expect(
			newSiteCredentialSchema.parse({
				siteId: "my-auction-docs",
				authKind: "service_token",
				label: "All For One read token",
				secret: "not-persisted-in-client",
			}),
		).toMatchObject({
			authKind: "service_token",
		});
	});

	it("validates site endpoints", () => {
		expect(
			siteEndpointSchema.parse({
				id: "users",
				siteId: "my-auction-docs",
				label: "Users",
				method: "GET",
				path: "/users",
				purpose: "user",
				requiresAuth: true,
				createdAt: "2026-05-18T00:00:00.000Z",
				updatedAt: "2026-05-18T00:00:00.000Z",
			}),
		).toMatchObject({
			purpose: "user",
		});
	});
});
