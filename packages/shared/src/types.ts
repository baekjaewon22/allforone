export type ISODateTime = string;

export type DateRange = {
	from: ISODateTime;
	to: ISODateTime;
};

export type ScheduleItem = {
	id: string;
	connectorId: string;
	title: string;
	startAt: ISODateTime;
	endAt: ISODateTime;
	status: "confirmed" | "tentative" | "cancelled";
	updatedAt: ISODateTime;
	metadata?: Record<string, unknown>;
};

export type NewScheduleItem = Omit<ScheduleItem, "id" | "updatedAt">;

export type Metric = {
	id: string;
	connectorId: string;
	name: string;
	value: number;
	unit?: string;
	measuredAt: ISODateTime;
	metadata?: Record<string, unknown>;
};

export type ReportItem = {
	id: string;
	connectorId: string;
	title: string;
	summary: string;
	createdAt: ISODateTime;
	metadata?: Record<string, unknown>;
};

export type WidgetCtx = {
	connectorId: string;
	now: ISODateTime;
};

export type ToolDescriptor = {
	name: string;
	description: string;
	input: unknown;
	output: unknown;
};

export type ManagedSite = {
	id: string;
	name: string;
	domain: string;
	description?: string;
	status: "active" | "paused" | "archived";
	createdAt: ISODateTime;
	updatedAt: ISODateTime;
};

export type NewManagedSite = {
	name: string;
	domain: string;
	description?: string;
	status?: "active" | "paused" | "archived";
};

export type SiteCredential = {
	id: string;
	siteId: string;
	authKind: "oauth" | "apikey" | "cookie" | "basic" | "service_token";
	label: string;
	encryptedSecretRef?: string;
	maskedPreview?: string;
	status: "active" | "expired" | "revoked" | "needs_rotation";
	createdAt: ISODateTime;
	updatedAt: ISODateTime;
};

export type NewSiteCredential = {
	siteId: string;
	authKind: "oauth" | "apikey" | "cookie" | "basic" | "service_token";
	label: string;
	secret?: string;
	status?: "active" | "expired" | "revoked" | "needs_rotation";
};

export type SiteAccessGrant = {
	id: string;
	siteId: string;
	credentialId?: string;
	scope: string;
	permission: "read" | "write" | "admin";
	resource: string;
	createdAt: ISODateTime;
	updatedAt: ISODateTime;
};

export type SiteEndpoint = {
	id: string;
	siteId: string;
	label: string;
	method: string;
	path: string;
	purpose: "schedule" | "report" | "metric" | "user" | "order" | "admin" | "custom";
	requiresAuth: boolean;
	createdAt: ISODateTime;
	updatedAt: ISODateTime;
};

export type SiteAdminLink = {
	id: string;
	siteId: string;
	label: string;
	url: string;
	category: "admin" | "analytics" | "billing" | "deploy" | "logs" | "docs" | "custom";
	createdAt: ISODateTime;
	updatedAt: ISODateTime;
};

export type SiteCapability = {
	id: string;
	siteId: string;
	capability: string;
	enabled: boolean;
	metadata?: Record<string, unknown>;
	createdAt: ISODateTime;
	updatedAt: ISODateTime;
};

export type ManagedSiteDetail = {
	site: ManagedSite;
	credentials: SiteCredential[];
	accessGrants: SiteAccessGrant[];
	endpoints: SiteEndpoint[];
	adminLinks: SiteAdminLink[];
	capabilities: SiteCapability[];
};

export type SiteLiveReadStatus = "ready" | "partial" | "unavailable" | "pending";

export type SiteLiveReadCard = {
	id: string;
	label: string;
	endpointId: string;
	path: string;
	ok: boolean;
	status: number;
	count?: number;
	preview: unknown[];
	updatedAt: ISODateTime;
	error?: string;
};

export type SiteLiveAction = {
	id: string;
	label: string;
	phase: "write" | "admin";
	enabled: boolean;
	reason?: string;
};

export type SiteLiveOverview = {
	siteId: string;
	mode: "api" | "iframe";
	status: SiteLiveReadStatus;
	readCards: SiteLiveReadCard[];
	today: SiteLiveReadCard[];
	actions: SiteLiveAction[];
	updatedAt: ISODateTime;
	message?: string;
};

export type WorkDevice = {
	id: string;
	name: string;
	hostname?: string;
	platform?: string;
	lastSeenAt: ISODateTime;
	createdAt: ISODateTime;
	updatedAt: ISODateTime;
};

export type WorkItemKind = "file" | "note" | "task" | "snapshot" | "link";

export type WorkItem = {
	id: string;
	deviceId: string;
	deviceName: string;
	kind: WorkItemKind;
	title: string;
	summary?: string;
	path?: string;
	url?: string;
	status: "new" | "reviewed" | "archived";
	metadata?: Record<string, unknown>;
	occurredAt: ISODateTime;
	createdAt: ISODateTime;
};

export type NewWorkItem = {
	deviceId: string;
	deviceName: string;
	hostname?: string;
	platform?: string;
	kind: WorkItemKind;
	title: string;
	summary?: string;
	path?: string;
	url?: string;
	metadata?: Record<string, unknown>;
	occurredAt?: ISODateTime;
};

export type DailyLog = {
	id: string;
	logDate: string;
	mood?: number;
	condition?: number;
	sleepHours?: number;
	focus?: number;
	summary?: string;
	wins?: string;
	blockers?: string;
	tomorrow?: string;
	tags?: string[];
	createdAt: ISODateTime;
	updatedAt: ISODateTime;
};

export type NewDailyLog = {
	logDate: string;
	mood?: number;
	condition?: number;
	sleepHours?: number;
	focus?: number;
	summary?: string;
	wins?: string;
	blockers?: string;
	tomorrow?: string;
	tags?: string[];
};

export type HealthEntry = {
	id: string;
	entryDate: string;
	sleepHours?: number;
	weightKg?: number;
	exerciseMinutes?: number;
	condition?: number;
	stress?: number;
	medication?: string;
	mealNote?: string;
	symptoms?: string;
	createdAt: ISODateTime;
	updatedAt: ISODateTime;
};

export type NewHealthEntry = {
	entryDate: string;
	sleepHours?: number;
	weightKg?: number;
	exerciseMinutes?: number;
	condition?: number;
	stress?: number;
	medication?: string;
	mealNote?: string;
	symptoms?: string;
};

export type AiReportStatus =
	| "received"
	| "needs_review"
	| "applied"
	| "on_hold"
	| "discarded";

export type AiReport = {
	id: string;
	provider: string;
	taskTitle: string;
	request?: string;
	result: string;
	changedFiles?: string[];
	commands?: string[];
	todos?: string[];
	status: AiReportStatus;
	metadata?: Record<string, unknown>;
	occurredAt: ISODateTime;
	createdAt: ISODateTime;
	updatedAt: ISODateTime;
};

export type NewAiReport = {
	provider: string;
	taskTitle: string;
	request?: string;
	result: string;
	changedFiles?: string[];
	commands?: string[];
	todos?: string[];
	status?: AiReportStatus;
	metadata?: Record<string, unknown>;
	occurredAt?: ISODateTime;
};

export type TodaySnapshot = {
	date: string;
	dailyLog?: DailyLog;
	healthEntry?: HealthEntry;
	openWorkItems: WorkItem[];
	aiReports: AiReport[];
	todayNews: WorkItem[];
};

export type LlmProviderId = "gemini" | "openrouter" | "ollama";

export type LlmProvider = {
	id: LlmProviderId;
	name: string;
	model: string;
	status: "ready" | "needs_key" | "local_only" | "disabled";
	freeTier: boolean;
	description: string;
};

export type LlmMessage = {
	role: "system" | "user" | "assistant";
	content: string;
};

export type LlmRun = {
	id: string;
	provider: LlmProviderId;
	model: string;
	prompt: string;
	response: string;
	intent: "chat" | "summarize" | "command_preview";
	status: "completed" | "fallback" | "failed";
	usage?: {
		inputTokens?: number;
		outputTokens?: number;
		totalTokens?: number;
	};
	createdAt: ISODateTime;
};

export type NewLlmChat = {
	provider?: LlmProviderId;
	model?: string;
	message: string;
	intent?: "chat" | "summarize" | "command_preview";
	context?: Record<string, unknown>;
};
