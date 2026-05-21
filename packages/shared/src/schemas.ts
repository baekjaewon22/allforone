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
