import type {
	ManagedSite,
	ManagedSiteDetail,
	Metric,
	ReportItem,
	ScheduleItem,
	SiteAdminLink,
	SiteCapability,
	SiteCredential,
	SiteEndpoint,
	WorkDevice,
	WorkItem,
} from "@all-for-one/shared";

export type ConnectorSummary = {
	id: string;
	name: string;
	status: "ready" | "needs_auth" | "offline";
	description: string;
};

export type DashboardSnapshot = {
	schedules: ScheduleItem[];
	metrics: Metric[];
	reports: ReportItem[];
};

export type WorkIntakeSnapshot = {
	devices: WorkDevice[];
	items: WorkItem[];
	todayNews: WorkItem[];
};

const now = new Date().toISOString();
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8787";

const connectors: ConnectorSummary[] = [
	{
		id: "mock",
		name: "목업 연동",
		status: "ready",
		description: "대시보드 연결 상태를 확인하기 위한 로컬 테스트 연동입니다.",
	},
	{
		id: "my-auction-docs",
		name: "마이옥션 문서",
		status: "ready",
		description: "API Worker를 통해 Service Token 읽기 권한이 연결되어 있습니다.",
	},
	{
		id: "landing-law",
		name: "법률사무소 명승",
		status: "needs_auth",
		description: "관리자 화면 임베드가 등록되어 있으며 Service Token API는 원본 사이트 구현 대기 상태입니다.",
	},
];

const snapshot: DashboardSnapshot = {
	schedules: [],
	metrics: [],
	reports: [],
};

const workIntake: WorkIntakeSnapshot = {
	devices: [
		{
			id: "desktop-main",
			name: "메인 데스크톱",
			hostname: "DESKTOP-NROC4AF",
			platform: "Windows",
			lastSeenAt: now,
			createdAt: now,
			updatedAt: now,
		},
	],
	items: [
		{
			id: "sample-work-item",
			deviceId: "desktop-main",
			deviceName: "메인 데스크톱",
			kind: "snapshot",
			title: "작업 수신함 준비 완료",
			summary: "각 컴퓨터에서 /work/ingest로 작업 정보를 보내면 이 화면에 쌓입니다.",
			status: "new",
			occurredAt: now,
			createdAt: now,
		},
	],
	todayNews: [],
};

type DetailSeed = {
	site: ManagedSite;
	credentials: Array<Omit<SiteCredential, "siteId" | "createdAt" | "updatedAt">>;
	endpoints: Array<Omit<SiteEndpoint, "siteId" | "createdAt" | "updatedAt">>;
	adminLinks: Array<Omit<SiteAdminLink, "siteId" | "createdAt" | "updatedAt">>;
	capabilities: Array<Omit<SiteCapability, "siteId" | "createdAt" | "updatedAt">>;
};

function createDetail(seed: DetailSeed): ManagedSiteDetail {
	const stamp = <T extends { siteId: string; createdAt: string; updatedAt: string }>(
		items: Array<Omit<T, "siteId" | "createdAt" | "updatedAt">>,
	): T[] =>
		items.map((item) => ({
			...item,
			siteId: seed.site.id,
			createdAt: now,
			updatedAt: now,
		})) as T[];

	return {
		site: seed.site,
		credentials: stamp<SiteCredential>(seed.credentials),
		accessGrants: [],
		endpoints: stamp<SiteEndpoint>(seed.endpoints),
		adminLinks: stamp<SiteAdminLink>(seed.adminLinks),
		capabilities: stamp<SiteCapability>(seed.capabilities),
	};
}

const myAuctionDocs = createDetail({
	site: {
		id: "my-auction-docs",
		name: "마이옥션 문서",
		domain: "https://my-docs.kr",
		description: "Cloudflare Workers + D1 기반 문서 관리 사이트입니다. Service Token 읽기 권한이 연결되어 있습니다.",
		status: "active",
		createdAt: now,
		updatedAt: now,
	},
	credentials: [
		{
			id: "my-auction-docs-read-token",
			authKind: "service_token",
			label: "All For One 읽기 토큰",
			encryptedSecretRef: "worker-secret:MY_DOCS_SERVICE_TOKEN_READ",
			maskedPreview: "MY_DOCS_SERVICE_TOKEN_READ",
			status: "active",
		},
	],
	endpoints: [
		{ id: "health", label: "상태 확인", method: "GET", path: "/health", purpose: "admin", requiresAuth: false },
		{ id: "auth-me", label: "토큰 인증 확인", method: "GET", path: "/auth/me", purpose: "admin", requiresAuth: true },
		{ id: "users", label: "사용자", method: "GET", path: "/users", purpose: "user", requiresAuth: true },
		{ id: "accounting", label: "회계", method: "GET", path: "/accounting", purpose: "report", requiresAuth: true },
		{ id: "payroll", label: "급여", method: "GET", path: "/payroll", purpose: "report", requiresAuth: true },
	],
	adminLinks: [
		{ id: "users", label: "사용자", url: "https://my-docs.kr/users", category: "admin" },
		{ id: "accounting", label: "회계", url: "https://my-docs.kr/accounting", category: "analytics" },
		{ id: "payroll", label: "급여", url: "https://my-docs.kr/payroll", category: "admin" },
		{ id: "alimtalk-logs", label: "알림톡 로그", url: "https://my-docs.kr/alimtalk-logs", category: "logs" },
		{ id: "org", label: "조직", url: "https://my-docs.kr/org", category: "admin" },
	],
	capabilities: [
		{ id: "embedded-admin", capability: "embedded-admin", enabled: true },
		{ id: "service-token-auth", capability: "service-token-auth", enabled: true },
	],
});

const landingLaw = createDetail({
	site: {
		id: "landing-law",
		name: "법률사무소 명승",
		domain: "https://lawitgo.com",
		description: "lawitgo.com 관리자 시스템입니다. Service Token API는 원본 사이트 구현 대기 상태입니다.",
		status: "active",
		createdAt: now,
		updatedAt: now,
	},
	credentials: [
		{
			id: "landing-law-admin-session",
			authKind: "cookie",
			label: "관리자 세션 쿠키",
			encryptedSecretRef: "source-site:http-only-cookie",
			maskedPreview: "admin_session",
			status: "active",
		},
		{
			id: "landing-law-read-token",
			authKind: "service_token",
			label: "All For One 읽기 토큰",
			encryptedSecretRef: "pending:LANDING_LAW_SERVICE_TOKEN_READ",
			maskedPreview: "pending",
			status: "needs_rotation",
		},
	],
	endpoints: [
		{ id: "site", label: "사이트 설정", method: "GET", path: "/site", purpose: "admin", requiresAuth: false },
		{ id: "progress", label: "진행 사건", method: "GET", path: "/admin/progress", purpose: "report", requiresAuth: true },
		{ id: "calendar", label: "일정", method: "GET", path: "/admin/calendar", purpose: "schedule", requiresAuth: true },
		{ id: "settlement", label: "정산", method: "GET", path: "/admin/settlement", purpose: "report", requiresAuth: true },
		{ id: "leads", label: "상담 리드", method: "GET", path: "/admin/leads", purpose: "user", requiresAuth: true },
	],
	adminLinks: [
		{ id: "admin", label: "관리자 홈", url: "https://lawitgo.com/admin", category: "admin" },
		{ id: "progress", label: "진행 사건", url: "https://lawitgo.com/admin/progress", category: "admin" },
		{ id: "completed", label: "종결 사건", url: "https://lawitgo.com/admin/completed", category: "admin" },
		{ id: "calendar", label: "일정", url: "https://lawitgo.com/admin/calendar", category: "admin" },
		{ id: "settlement", label: "정산", url: "https://lawitgo.com/admin/settlement", category: "billing" },
		{ id: "leads", label: "상담 리드", url: "https://lawitgo.com/admin/leads", category: "admin" },
		{ id: "journal", label: "업무 일지", url: "https://lawitgo.com/admin/journal", category: "docs" },
		{ id: "funnels", label: "퍼널", url: "https://lawitgo.com/admin/funnels", category: "analytics" },
		{ id: "funnel-stats", label: "퍼널 통계", url: "https://lawitgo.com/admin/funnel-stats", category: "analytics" },
		{ id: "funnel-views", label: "퍼널 조회", url: "https://lawitgo.com/admin/funnel-views", category: "analytics" },
		{ id: "consultants", label: "상담사", url: "https://lawitgo.com/admin/consultants", category: "admin" },
		{ id: "mydocs-logs", label: "마이독스 로그", url: "https://lawitgo.com/admin/mydocs-logs", category: "logs" },
		{ id: "alimtalk", label: "알림톡", url: "https://lawitgo.com/admin/alimtalk", category: "logs" },
		{ id: "staff", label: "직원", url: "https://lawitgo.com/admin/staff", category: "admin" },
		{ id: "settings", label: "설정", url: "https://lawitgo.com/admin/settings", category: "admin" },
	],
	capabilities: [
		{ id: "embedded-admin", capability: "embedded-admin", enabled: true },
		{ id: "service-token-auth", capability: "service-token-auth", enabled: false, metadata: { status: "not_implemented" } },
	],
});

const managedSiteDetails = [myAuctionDocs, landingLaw];

async function delay() {
	await new Promise((resolve) => globalThis.setTimeout(resolve, 80));
}

async function getJson<T>(path: string): Promise<T> {
	const response = await fetch(`${apiBaseUrl}${path}`);
	if (!response.ok) {
		throw new Error(`API request failed: ${path}`);
	}

	return response.json() as Promise<T>;
}

export const rpcClient = {
	async getConnectors() {
		await delay();
		return connectors;
	},
	async getDashboardSnapshot() {
		await delay();
		return snapshot;
	},
	async getWorkIntakeSnapshot(): Promise<WorkIntakeSnapshot> {
		await delay();
		try {
			const [devicesResponse, itemsResponse, todayNewsResponse] = await Promise.all([
				getJson<{ devices: WorkDevice[] }>("/work/devices"),
				getJson<{ items: WorkItem[] }>("/work/items"),
				getJson<{ items: WorkItem[] }>("/work/news/today"),
			]);

			return {
				devices: devicesResponse.devices,
				items: itemsResponse.items,
				todayNews: todayNewsResponse.items,
			};
		} catch {
			return workIntake;
		}
	},
	async getHealth() {
		await delay();
		return {
			ok: true,
			checkedAt: now,
		};
	},
	async getManagedSites(): Promise<ManagedSite[]> {
		await delay();
		return managedSiteDetails.map((detail) => detail.site);
	},
	async getManagedSiteDetail(siteId: string): Promise<ManagedSiteDetail> {
		await delay();
		const detail = managedSiteDetails.find((item) => item.site.id === siteId);
		if (!detail) {
			throw new Error(`Unknown managed site: ${siteId}`);
		}

		return detail;
	},
};
