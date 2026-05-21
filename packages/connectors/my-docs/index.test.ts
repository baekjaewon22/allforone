import { describe, expect, it } from "vitest";
import { MyDocsClient } from "./index";

describe("MyDocsClient", () => {
	it("calls health without a service token", async () => {
		const requests: Request[] = [];
		const client = new MyDocsClient({
			baseUrl: "https://my-docs.kr/api/",
			fetcher: async (input, init) => {
				requests.push(new Request(input, init));
				return Response.json({ ok: true });
			},
		});

		const result = await client.health();

		expect(result).toMatchObject({
			ok: true,
			status: 200,
			data: { ok: true },
		});
		expect(requests[0].url).toBe("https://my-docs.kr/api/health");
		expect(requests[0].headers.get("Authorization")).toBeNull();
	});

	it("sends the read service token only in the Authorization header", async () => {
		const requests: Request[] = [];
		const client = new MyDocsClient({
			baseUrl: "https://my-docs.kr/api",
			serviceToken: "secret-token",
			fetcher: async (input, init) => {
				requests.push(new Request(input, init));
				return Response.json({
					auth_type: "service_token",
					service_token_scope: "read",
				});
			},
		});

		const me = await client.me();

		expect(me).toMatchObject({
			auth_type: "service_token",
			service_token_scope: "read",
		});
		expect(requests[0].headers.get("Authorization")).toBe("Bearer secret-token");
	});
});
