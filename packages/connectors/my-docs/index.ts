import { createElement } from "react";
import type {
	Metric,
	ReportItem,
	ScheduleItem,
	WidgetCtx,
} from "@all-for-one/shared";
import type { Connector } from "../_base";

export type MyDocsServiceTokenScope = "read" | "write" | "admin";

export type MyDocsClientOptions = {
	baseUrl: string;
	serviceToken?: string;
	fetcher?: typeof fetch;
};

export type MyDocsAuthMe = {
	auth_type?: string;
	service_token_scope?: MyDocsServiceTokenScope;
	[key: string]: unknown;
};

export type MyDocsLiveResult = {
	status: number;
	ok: boolean;
	data: unknown;
};

export type MyDocsEmbedConfig = {
	allowed: boolean;
	frame_ancestors: string[];
	pages: string[];
	auth: {
		html_pages: string;
		service_token: string;
		cookie_required: boolean;
	};
};

const connectorId = "my-auction-docs";

const normalizeBaseUrl = (baseUrl: string): string => baseUrl.replace(/\/+$/, "");

const parseResponseBody = async (response: Response): Promise<unknown> => {
	const contentType = response.headers.get("content-type") ?? "";
	if (contentType.includes("application/json")) {
		return response.json();
	}

	const text = await response.text();
	return text.length > 0 ? text : null;
};

export class MyDocsClient {
	private readonly baseUrl: string;
	private readonly serviceToken?: string;
	private readonly fetcher: typeof fetch;

	constructor(options: MyDocsClientOptions) {
		this.baseUrl = normalizeBaseUrl(options.baseUrl);
		this.serviceToken = options.serviceToken;
		this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
	}

	async health(): Promise<MyDocsLiveResult> {
		return this.request("/health", { authenticated: false });
	}

	async embedConfig(): Promise<MyDocsLiveResult> {
		return this.request("/embed/config", { authenticated: true });
	}

	async me(): Promise<MyDocsAuthMe> {
		const result = await this.request("/auth/me", { authenticated: true });
		return result.data as MyDocsAuthMe;
	}

	async read(path: string): Promise<MyDocsLiveResult> {
		if (!path.startsWith("/")) {
			throw new Error("my-docs paths must start with /");
		}

		return this.request(path, { authenticated: true });
	}

	private async request(
		path: string,
		options: { authenticated: boolean },
	): Promise<MyDocsLiveResult> {
		const headers = new Headers();
		if (options.authenticated) {
			if (!this.serviceToken) {
				throw new Error("MY_DOCS_SERVICE_TOKEN_READ is not configured");
			}
			headers.set("Authorization", `Bearer ${this.serviceToken}`);
		}

		const response = await this.fetcher(`${this.baseUrl}${path}`, {
			method: "GET",
			headers,
		});

		return {
			status: response.status,
			ok: response.ok,
			data: await parseResponseBody(response),
		};
	}
}

const emptySchedule = {
	async list(): Promise<ScheduleItem[]> {
		return [];
	},
	async create(): Promise<ScheduleItem> {
		throw new Error("my-docs schedule creation is not implemented");
	},
	async update(): Promise<ScheduleItem> {
		throw new Error("my-docs schedule updates are not implemented");
	},
	async delete(): Promise<void> {
		throw new Error("my-docs schedule deletion is not implemented");
	},
};

export const createMyDocsConnector = (): Connector => ({
	id: connectorId,
	displayName: "my-docs.kr",
	icon: "file-text",
	auth: {
		kind: "apikey",
		async refresh() {},
		async revoke() {},
	},
	schedule: emptySchedule,
	report: {
		async metrics(): Promise<Metric[]> {
			return [];
		},
		async recent(): Promise<ReportItem[]> {
			return [];
		},
	},
	async pullDelta() {},
	widgets: [
		{
			id: "my-docs-live-status",
			title: "my-docs.kr",
			size: "md",
			render: (ctx: WidgetCtx) =>
				createElement(
					"section",
					{
						"data-connector-id": ctx.connectorId,
						"data-widget-id": "my-docs-live-status",
					},
					createElement("h3", null, "my-docs.kr"),
					createElement("p", null, "Service Token live API is wired server-side."),
				),
		},
	],
	tools() {
		return [];
	},
});

export const myDocsConnector = createMyDocsConnector();
