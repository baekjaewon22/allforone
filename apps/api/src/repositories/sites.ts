import type {
	ManagedSite,
	ManagedSiteDetail,
	SiteAccessGrant,
	SiteAdminLink,
	SiteCapability,
	SiteCredential,
	SiteEndpoint,
} from "@all-for-one/shared";

const now = "2026-05-18T00:00:00.000Z";

type EndpointSeed = Pick<
	SiteEndpoint,
	"id" | "label" | "method" | "path" | "purpose" | "requiresAuth"
>;
type AdminLinkSeed = Pick<SiteAdminLink, "id" | "label" | "url" | "category">;
type CapabilitySeed = Pick<
	SiteCapability,
	"id" | "capability" | "enabled" | "metadata"
>;

const withSite = <T extends { siteId: string; createdAt: string; updatedAt: string }>(
	siteId: string,
	items: Array<Omit<T, "siteId" | "createdAt" | "updatedAt">>,
): T[] =>
	items.map((item) => ({
		...item,
		siteId,
		createdAt: now,
		updatedAt: now,
	})) as T[];

const createEndpoints = (siteId: string, items: EndpointSeed[]) =>
	withSite<SiteEndpoint>(siteId, items);

const createAdminLinks = (siteId: string, items: AdminLinkSeed[]) =>
	withSite<SiteAdminLink>(siteId, items);

const createCapabilities = (siteId: string, items: CapabilitySeed[]) =>
	withSite<SiteCapability>(siteId, items);

const myDocsSite: ManagedSite = {
	id: "my-auction-docs",
	name: "마이옥션 문서",
	domain: "https://my-docs.kr",
	description: "Cloudflare Workers + D1 기반 문서 관리 사이트입니다. Service Token으로 All For One live API 접근을 사용합니다.",
	status: "active",
	createdAt: now,
	updatedAt: now,
};

const myDocsCredentials: SiteCredential[] = withSite<SiteCredential>(myDocsSite.id, [
	{
		id: "my-auction-docs-read-token",
		authKind: "service_token",
		label: "All For One 읽기 토큰",
		encryptedSecretRef: "worker-secret:MY_DOCS_SERVICE_TOKEN_READ",
		maskedPreview: "MY_DOCS_SERVICE_TOKEN_READ",
		status: "active",
	},
	{
		id: "my-auction-docs-write-token",
		authKind: "service_token",
		label: "All For One 쓰기 토큰",
		encryptedSecretRef: "pending:service-token-write",
		maskedPreview: "pending",
		status: "needs_rotation",
	},
	{
		id: "my-auction-docs-admin-token",
		authKind: "service_token",
		label: "All For One 관리자 토큰",
		encryptedSecretRef: "pending:service-token-admin",
		maskedPreview: "pending",
		status: "needs_rotation",
	},
]);

const myDocsAccessGrants: SiteAccessGrant[] = withSite<SiteAccessGrant>(myDocsSite.id, [
	{ id: "users-read", credentialId: myDocsCredentials[0].id, scope: "users:read", permission: "read", resource: "users" },
	{ id: "accounting-read", credentialId: myDocsCredentials[0].id, scope: "accounting:read", permission: "read", resource: "accounting" },
	{ id: "payroll-read", credentialId: myDocsCredentials[0].id, scope: "payroll:read", permission: "read", resource: "payroll" },
	{ id: "alimtalk-logs-read", credentialId: myDocsCredentials[0].id, scope: "alimtalk_logs:read", permission: "read", resource: "alimtalk-logs" },
	{ id: "org-admin", credentialId: myDocsCredentials[2].id, scope: "org:admin", permission: "admin", resource: "org" },
]);

const myDocsEndpoints = createEndpoints(myDocsSite.id, [
	{ id: "health", label: "상태 확인", method: "GET", path: "/health", purpose: "admin", requiresAuth: false },
	{ id: "embed-config", label: "임베드 설정", method: "GET", path: "/embed/config", purpose: "admin", requiresAuth: true },
	{ id: "auth-me", label: "토큰 인증 확인", method: "GET", path: "/auth/me", purpose: "admin", requiresAuth: true },
	{ id: "users", label: "사용자", method: "GET", path: "/users", purpose: "user", requiresAuth: true },
	{ id: "users-pending", label: "승인 대기 사용자", method: "GET", path: "/users/pending", purpose: "user", requiresAuth: true },
	{ id: "accounting", label: "회계", method: "GET", path: "/accounting", purpose: "report", requiresAuth: true },
	{ id: "accounting-alerts", label: "회계 알림", method: "GET", path: "/accounting/alerts", purpose: "report", requiresAuth: true },
	{ id: "accounting-staging", label: "회계 검수", method: "GET", path: "/accounting/staging", purpose: "report", requiresAuth: true },
	{ id: "accounting-card-settlements-current-month", label: "카드 정산", method: "GET", path: "/accounting/card-settlements/list?month=2026-05", purpose: "report", requiresAuth: true },
	{ id: "payroll", label: "급여", method: "GET", path: "/payroll", purpose: "report", requiresAuth: true },
	{ id: "payroll-business-income-current-month", label: "사업소득 급여", method: "GET", path: "/payroll/reports/business-income?month=2026-05", purpose: "report", requiresAuth: true },
	{ id: "alimtalk-logs", label: "알림톡 로그", method: "GET", path: "/alimtalk-logs", purpose: "admin", requiresAuth: true },
	{ id: "sales", label: "매출", method: "GET", path: "/sales", purpose: "report", requiresAuth: true },
	{ id: "sales-stats", label: "매출 통계", method: "GET", path: "/sales/stats", purpose: "metric", requiresAuth: true },
	{ id: "sales-pending", label: "대기 매출", method: "GET", path: "/sales/pending", purpose: "report", requiresAuth: true },
	{ id: "sales-refund-impacts", label: "환불 영향", method: "GET", path: "/sales/dashboard/refund-impacts", purpose: "report", requiresAuth: true },
	{ id: "sales-refund-requests", label: "환불 요청", method: "GET", path: "/sales/dashboard/refund-requests", purpose: "report", requiresAuth: true },
	{ id: "sales-deposits", label: "입금 내역", method: "GET", path: "/sales/deposits", purpose: "report", requiresAuth: true },
	{ id: "sales-contract-tracker", label: "계약 추적", method: "GET", path: "/sales/contract-tracker", purpose: "report", requiresAuth: true },
	{ id: "sales-ranking", label: "매출 순위", method: "GET", path: "/sales/ranking", purpose: "report", requiresAuth: true },
	{ id: "card-transactions-current-month", label: "카드 거래", method: "GET", path: "/card/transactions?month=2026-05", purpose: "report", requiresAuth: true },
	{ id: "card-summary-current-month", label: "카드 요약", method: "GET", path: "/card/summary?month=2026-05", purpose: "metric", requiresAuth: true },
	{ id: "card-last-upload", label: "최근 카드 업로드", method: "GET", path: "/card/last-upload", purpose: "report", requiresAuth: true },
	{ id: "org", label: "조직", method: "GET", path: "/org", purpose: "admin", requiresAuth: true },
]);

const myDocsAdminLinks = createAdminLinks(myDocsSite.id, [
	{ id: "users", label: "사용자", url: "https://my-docs.kr/users", category: "admin" },
	{ id: "accounting", label: "회계", url: "https://my-docs.kr/accounting", category: "analytics" },
	{ id: "payroll", label: "급여", url: "https://my-docs.kr/payroll", category: "admin" },
	{ id: "alimtalk-logs", label: "알림톡 로그", url: "https://my-docs.kr/alimtalk-logs", category: "logs" },
	{ id: "org", label: "조직", url: "https://my-docs.kr/org", category: "admin" },
]);

const myDocsCapabilities = createCapabilities(myDocsSite.id, [
	{ id: "users", capability: "user-management", enabled: true },
	{ id: "accounting", capability: "accounting", enabled: true },
	{ id: "payroll", capability: "payroll", enabled: true },
	{ id: "alimtalk-logs", capability: "alimtalk-logs", enabled: true },
	{ id: "embedded-admin", capability: "embedded-admin", enabled: true, metadata: { pages: ["/users", "/accounting", "/payroll", "/alimtalk-logs", "/org"], htmlAuth: "user_jwt_required" } },
	{ id: "service-token-auth", capability: "service-token-auth", enabled: true, metadata: { tokenTransport: "Authorization Bearer", scopes: ["read", "write", "admin"] } },
]);

const landingLawSite: ManagedSite = {
	id: "landing-law",
	name: "법률사무소 명승",
	domain: "https://lawitgo.com",
	description: "lawitgo.com 관리자 시스템입니다. 현재 API는 admin_session 쿠키를 사용하며 Service Token 연동은 원본 사이트 구현 대기 상태입니다.",
	status: "active",
	createdAt: now,
	updatedAt: now,
};

const landingLawCredentials: SiteCredential[] = withSite<SiteCredential>(landingLawSite.id, [
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
]);

const landingLawAccessGrants: SiteAccessGrant[] = withSite<SiteAccessGrant>(landingLawSite.id, [
	{ id: "landing-law-admin-read", credentialId: landingLawCredentials[0].id, scope: "admin:read", permission: "read", resource: "admin" },
	{ id: "landing-law-leads-read", credentialId: landingLawCredentials[1].id, scope: "leads:read", permission: "read", resource: "leads" },
	{ id: "landing-law-calendar-read", credentialId: landingLawCredentials[1].id, scope: "calendar:read", permission: "read", resource: "calendar" },
	{ id: "landing-law-settlement-read", credentialId: landingLawCredentials[1].id, scope: "settlement:read", permission: "read", resource: "settlement" },
]);

const landingLawEndpoints = createEndpoints(landingLawSite.id, [
	{ id: "site", label: "사이트 설정", method: "GET", path: "/site", purpose: "admin", requiresAuth: false },
	{ id: "health", label: "상태 확인", method: "GET", path: "/health", purpose: "admin", requiresAuth: false },
	{ id: "service-tokens", label: "서비스 토큰", method: "POST", path: "/admin/service-tokens", purpose: "admin", requiresAuth: true },
	{ id: "progress", label: "진행 사건", method: "GET", path: "/admin/progress", purpose: "report", requiresAuth: true },
	{ id: "completed", label: "종결 사건", method: "GET", path: "/admin/completed", purpose: "report", requiresAuth: true },
	{ id: "calendar", label: "일정", method: "GET", path: "/admin/calendar", purpose: "schedule", requiresAuth: true },
	{ id: "settlement", label: "정산", method: "GET", path: "/admin/settlement", purpose: "report", requiresAuth: true },
	{ id: "leads", label: "상담 리드", method: "GET", path: "/admin/leads", purpose: "user", requiresAuth: true },
	{ id: "journal", label: "업무 일지", method: "GET", path: "/admin/journal", purpose: "report", requiresAuth: true },
	{ id: "funnels", label: "퍼널", method: "GET", path: "/admin/funnels", purpose: "metric", requiresAuth: true },
	{ id: "consultants", label: "상담사", method: "GET", path: "/admin/consultants", purpose: "user", requiresAuth: true },
	{ id: "alimtalk", label: "알림톡", method: "GET", path: "/admin/alimtalk", purpose: "admin", requiresAuth: true },
	{ id: "staff", label: "직원", method: "GET", path: "/admin/staff", purpose: "admin", requiresAuth: true },
	{ id: "settings", label: "설정", method: "GET", path: "/admin/settings", purpose: "admin", requiresAuth: true },
]);

const landingLawAdminLinks = createAdminLinks(landingLawSite.id, [
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
]);

const landingLawCapabilities = createCapabilities(landingLawSite.id, [
	{ id: "embedded-admin", capability: "embedded-admin", enabled: true, metadata: { pages: landingLawAdminLinks.map((link) => new URL(link.url).pathname), htmlAuth: "admin_session_cookie_required" } },
	{ id: "service-token-auth", capability: "service-token-auth", enabled: false, metadata: { status: "not_implemented", recommendedHeader: "Authorization Bearer", scopes: ["read", "write", "admin"] } },
	{ id: "x-requested-with", capability: "x-requested-with-required", enabled: true, metadata: { header: "X-Requested-With: fetch" } },
]);

const siteDetails: ManagedSiteDetail[] = [
	{
		site: myDocsSite,
		credentials: myDocsCredentials,
		accessGrants: myDocsAccessGrants,
		endpoints: myDocsEndpoints,
		adminLinks: myDocsAdminLinks,
		capabilities: myDocsCapabilities,
	},
	{
		site: landingLawSite,
		credentials: landingLawCredentials,
		accessGrants: landingLawAccessGrants,
		endpoints: landingLawEndpoints,
		adminLinks: landingLawAdminLinks,
		capabilities: landingLawCapabilities,
	},
];

export function listManagedSites(): ManagedSite[] {
	return siteDetails.map((detail) => detail.site);
}

export function getManagedSiteDetail(siteId: string): ManagedSiteDetail | undefined {
	return siteDetails.find((detail) => detail.site.id === siteId);
}

export function getManagedSiteEndpoint(siteId: string, endpointId: string): SiteEndpoint | undefined {
	const detail = getManagedSiteDetail(siteId);
	return detail?.endpoints.find((endpoint) => endpoint.id === endpointId);
}
