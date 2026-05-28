import { z } from "zod";

export const isoDateTimeSchema = z.string().datetime({ offset: true });

export const dateRangeSchema = z.object({
	from: isoDateTimeSchema,
	to: isoDateTimeSchema,
});

export const scheduleItemSchema = z.object({
	id: z.string().min(1),
	connectorId: z.string().min(1),
	title: z.string().min(1),
	startAt: isoDateTimeSchema,
	endAt: isoDateTimeSchema,
	status: z.enum(["confirmed", "tentative", "cancelled"]),
	updatedAt: isoDateTimeSchema,
	metadata: z.record(z.string(), z.unknown()).optional(),
});

export const newScheduleItemSchema = scheduleItemSchema.omit({
	id: true,
	updatedAt: true,
});

export const metricSchema = z.object({
	id: z.string().min(1),
	connectorId: z.string().min(1),
	name: z.string().min(1),
	value: z.number(),
	unit: z.string().optional(),
	measuredAt: isoDateTimeSchema,
	metadata: z.record(z.string(), z.unknown()).optional(),
});

export const reportItemSchema = z.object({
	id: z.string().min(1),
	connectorId: z.string().min(1),
	title: z.string().min(1),
	summary: z.string(),
	createdAt: isoDateTimeSchema,
	metadata: z.record(z.string(), z.unknown()).optional(),
});

export const managedSiteStatusSchema = z.enum(["active", "paused", "archived"]);
export const siteAuthKindSchema = z.enum([
	"oauth",
	"apikey",
	"cookie",
	"basic",
	"service_token",
]);
export const siteCredentialStatusSchema = z.enum([
	"active",
	"expired",
	"revoked",
	"needs_rotation",
]);
export const sitePermissionSchema = z.enum(["read", "write", "admin"]);
export const siteEndpointPurposeSchema = z.enum([
	"schedule",
	"report",
	"metric",
	"user",
	"order",
	"admin",
	"custom",
]);
export const siteAdminLinkCategorySchema = z.enum([
	"admin",
	"analytics",
	"billing",
	"deploy",
	"logs",
	"docs",
	"custom",
]);

export const managedSiteSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	domain: z.string().min(1),
	description: z.string().optional(),
	status: managedSiteStatusSchema,
	createdAt: isoDateTimeSchema,
	updatedAt: isoDateTimeSchema,
});

export const newManagedSiteSchema = managedSiteSchema
	.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		status: managedSiteStatusSchema.optional(),
	});

export const siteCredentialSchema = z.object({
	id: z.string().min(1),
	siteId: z.string().min(1),
	authKind: siteAuthKindSchema,
	label: z.string().min(1),
	encryptedSecretRef: z.string().optional(),
	maskedPreview: z.string().optional(),
	status: siteCredentialStatusSchema,
	createdAt: isoDateTimeSchema,
	updatedAt: isoDateTimeSchema,
});

export const newSiteCredentialSchema = siteCredentialSchema
	.omit({
		id: true,
		encryptedSecretRef: true,
		maskedPreview: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		secret: z.string().min(1).optional(),
		status: siteCredentialStatusSchema.optional(),
	});

export const siteAccessGrantSchema = z.object({
	id: z.string().min(1),
	siteId: z.string().min(1),
	credentialId: z.string().min(1).optional(),
	scope: z.string().min(1),
	permission: sitePermissionSchema,
	resource: z.string().min(1),
	createdAt: isoDateTimeSchema,
	updatedAt: isoDateTimeSchema,
});

export const newSiteAccessGrantSchema = siteAccessGrantSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const siteEndpointSchema = z.object({
	id: z.string().min(1),
	siteId: z.string().min(1),
	label: z.string().min(1),
	method: z.string().min(1),
	path: z.string().min(1),
	purpose: siteEndpointPurposeSchema,
	requiresAuth: z.boolean(),
	createdAt: isoDateTimeSchema,
	updatedAt: isoDateTimeSchema,
});

export const newSiteEndpointSchema = siteEndpointSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const siteAdminLinkSchema = z.object({
	id: z.string().min(1),
	siteId: z.string().min(1),
	label: z.string().min(1),
	url: z.string().url(),
	category: siteAdminLinkCategorySchema,
	createdAt: isoDateTimeSchema,
	updatedAt: isoDateTimeSchema,
});

export const newSiteAdminLinkSchema = siteAdminLinkSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const siteCapabilitySchema = z.object({
	id: z.string().min(1),
	siteId: z.string().min(1),
	capability: z.string().min(1),
	enabled: z.boolean(),
	metadata: z.record(z.string(), z.unknown()).optional(),
	createdAt: isoDateTimeSchema,
	updatedAt: isoDateTimeSchema,
});

export const newSiteCapabilitySchema = siteCapabilitySchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const managedSiteDetailSchema = z.object({
	site: managedSiteSchema,
	credentials: z.array(siteCredentialSchema),
	accessGrants: z.array(siteAccessGrantSchema),
	endpoints: z.array(siteEndpointSchema),
	adminLinks: z.array(siteAdminLinkSchema),
	capabilities: z.array(siteCapabilitySchema),
});

export const workItemKindSchema = z.enum([
	"file",
	"note",
	"task",
	"snapshot",
	"link",
]);

export const workDeviceSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	hostname: z.string().optional(),
	platform: z.string().optional(),
	lastSeenAt: isoDateTimeSchema,
	createdAt: isoDateTimeSchema,
	updatedAt: isoDateTimeSchema,
});

export const workItemSchema = z.object({
	id: z.string().min(1),
	deviceId: z.string().min(1),
	deviceName: z.string().min(1),
	kind: workItemKindSchema,
	title: z.string().min(1),
	summary: z.string().optional(),
	path: z.string().optional(),
	url: z.string().url().optional(),
	status: z.enum(["new", "reviewed", "archived"]),
	metadata: z.record(z.string(), z.unknown()).optional(),
	occurredAt: isoDateTimeSchema,
	createdAt: isoDateTimeSchema,
});

export const newWorkItemSchema = workItemSchema
	.omit({
		id: true,
		status: true,
		createdAt: true,
	})
	.extend({
		hostname: z.string().optional(),
		platform: z.string().optional(),
		occurredAt: isoDateTimeSchema.optional(),
	});

const scoreSchema = z.number().int().min(1).max(10);
const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const dailyLogSchema = z.object({
	id: z.string().min(1),
	logDate: dateOnlySchema,
	mood: scoreSchema.optional(),
	condition: scoreSchema.optional(),
	sleepHours: z.number().min(0).max(24).optional(),
	focus: scoreSchema.optional(),
	summary: z.string().optional(),
	wins: z.string().optional(),
	blockers: z.string().optional(),
	tomorrow: z.string().optional(),
	tags: z.array(z.string().min(1)).optional(),
	createdAt: isoDateTimeSchema,
	updatedAt: isoDateTimeSchema,
});

export const newDailyLogSchema = dailyLogSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const personalScheduleStatusSchema = z.enum([
	"planned",
	"done",
	"cancelled",
]);

export const personalScheduleSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1),
	startAt: isoDateTimeSchema,
	endAt: isoDateTimeSchema,
	status: personalScheduleStatusSchema,
	location: z.string().optional(),
	note: z.string().optional(),
	tags: z.array(z.string().min(1)).optional(),
	createdAt: isoDateTimeSchema,
	updatedAt: isoDateTimeSchema,
});

export const newPersonalScheduleSchema = personalScheduleSchema
	.omit({
		id: true,
		status: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		status: personalScheduleStatusSchema.optional(),
	});

export const patchPersonalScheduleSchema = personalScheduleSchema
	.pick({
		title: true,
		startAt: true,
		endAt: true,
		status: true,
		location: true,
		note: true,
		tags: true,
	})
	.partial();

export const healthEntrySchema = z.object({
	id: z.string().min(1),
	entryDate: dateOnlySchema,
	sleepHours: z.number().min(0).max(24).optional(),
	weightKg: z.number().min(0).max(500).optional(),
	exerciseMinutes: z.number().int().min(0).max(1440).optional(),
	condition: scoreSchema.optional(),
	stress: scoreSchema.optional(),
	medication: z.string().optional(),
	mealNote: z.string().optional(),
	symptoms: z.string().optional(),
	createdAt: isoDateTimeSchema,
	updatedAt: isoDateTimeSchema,
});

export const newHealthEntrySchema = healthEntrySchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const healthConnectDailySummarySchema = z.object({
	date: dateOnlySchema,
	deviceId: z.string().min(1),
	steps: z.number().int().min(0).optional(),
	sleepMinutes: z.number().int().min(0).max(1440).optional(),
	exerciseMinutes: z.number().int().min(0).max(1440).optional(),
	activeCalories: z.number().min(0).optional(),
	totalCalories: z.number().min(0).optional(),
	distanceMeters: z.number().min(0).optional(),
	heartRateAvg: z.number().min(0).optional(),
	heartRateMin: z.number().min(0).optional(),
	heartRateMax: z.number().min(0).optional(),
	weightKg: z.number().min(0).max(500).optional(),
	source: z.string().optional(),
	raw: z.record(z.string(), z.unknown()).optional(),
	syncedAt: isoDateTimeSchema,
	createdAt: isoDateTimeSchema,
	updatedAt: isoDateTimeSchema,
});

export const newHealthConnectDailySummarySchema = healthConnectDailySummarySchema.omit({
	createdAt: true,
	updatedAt: true,
});

export const healthConnectSyncSchema = z.object({
	deviceId: z.string().min(1),
	lastSyncedAt: isoDateTimeSchema.optional(),
	summaries: z.array(newHealthConnectDailySummarySchema).min(1).max(31),
});

export const healthConnectSyncStateSchema = z.object({
	deviceId: z.string().min(1),
	lastSyncedAt: isoDateTimeSchema,
	lastStatus: z.enum(["ok", "error"]),
	errorMessage: z.string().optional(),
	createdAt: isoDateTimeSchema,
	updatedAt: isoDateTimeSchema,
});

export const memoSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1),
	content: z.string().optional(),
	fileName: z.string().optional(),
	mimeType: z.string().optional(),
	fileBase64: z.string().optional(),
	ocrText: z.string().optional(),
	ocrStatus: z.enum(["none", "pending", "completed", "failed"]),
	summary: z.string().optional(),
	tags: z.array(z.string().min(1)).optional(),
	createdAt: isoDateTimeSchema,
	updatedAt: isoDateTimeSchema,
});

export const newMemoSchema = memoSchema
	.omit({
		id: true,
		ocrStatus: true,
		summary: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		ocrText: z.string().optional(),
	});

export const aiReportStatusSchema = z.enum([
	"received",
	"needs_review",
	"applied",
	"on_hold",
	"discarded",
]);

export const aiReportSchema = z.object({
	id: z.string().min(1),
	provider: z.string().min(1),
	taskTitle: z.string().min(1),
	request: z.string().optional(),
	result: z.string().min(1),
	changedFiles: z.array(z.string()).optional(),
	commands: z.array(z.string()).optional(),
	todos: z.array(z.string()).optional(),
	status: aiReportStatusSchema,
	metadata: z.record(z.string(), z.unknown()).optional(),
	occurredAt: isoDateTimeSchema,
	createdAt: isoDateTimeSchema,
	updatedAt: isoDateTimeSchema,
});

export const newAiReportSchema = aiReportSchema
	.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		status: aiReportStatusSchema.optional(),
		occurredAt: isoDateTimeSchema.optional(),
	});

export const llmProviderIdSchema = z.enum(["gemini", "openrouter", "ollama"]);

export const newLlmChatSchema = z.object({
	provider: llmProviderIdSchema.optional(),
	model: z.string().min(1).max(120).optional(),
	message: z.string().min(1).max(12000),
	intent: z.enum(["chat", "summarize", "command_preview"]).optional(),
	context: z.record(z.string(), z.unknown()).optional(),
});
