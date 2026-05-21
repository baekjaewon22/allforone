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
