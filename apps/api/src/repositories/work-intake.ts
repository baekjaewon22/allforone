import type { NewWorkItem, WorkDevice, WorkItem } from "@all-for-one/shared";

type WorkDeviceRow = {
	id: string;
	name: string;
	hostname: string | null;
	platform: string | null;
	last_seen_at: string;
	created_at: string;
	updated_at: string;
};

type WorkItemRow = {
	id: string;
	device_id: string;
	device_name: string;
	kind: WorkItem["kind"];
	title: string;
	summary: string | null;
	path: string | null;
	url: string | null;
	status: WorkItem["status"];
	metadata_json: string | null;
	occurred_at: string;
	created_at: string;
};

const toDevice = (row: WorkDeviceRow): WorkDevice => ({
	id: row.id,
	name: row.name,
	hostname: row.hostname ?? undefined,
	platform: row.platform ?? undefined,
	lastSeenAt: row.last_seen_at,
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

const toItem = (row: WorkItemRow): WorkItem => ({
	id: row.id,
	deviceId: row.device_id,
	deviceName: row.device_name,
	kind: row.kind,
	title: row.title,
	summary: row.summary ?? undefined,
	path: row.path ?? undefined,
	url: row.url ?? undefined,
	status: row.status,
	metadata: row.metadata_json ? JSON.parse(row.metadata_json) : undefined,
	occurredAt: row.occurred_at,
	createdAt: row.created_at,
});

export async function ingestWorkItem(
	db: D1Database,
	input: NewWorkItem,
): Promise<WorkItem> {
	const now = new Date().toISOString();
	const occurredAt = input.occurredAt ?? now;
	const id = crypto.randomUUID();

	await db
		.prepare(`
			INSERT INTO work_devices (id, name, hostname, platform, last_seen_at, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET
				name = excluded.name,
				hostname = excluded.hostname,
				platform = excluded.platform,
				last_seen_at = excluded.last_seen_at,
				updated_at = excluded.updated_at
		`)
		.bind(
			input.deviceId,
			input.deviceName,
			input.hostname ?? null,
			input.platform ?? null,
			now,
			now,
			now,
		)
		.run();

	await db
		.prepare(`
			INSERT INTO work_items (
				id, device_id, device_name, kind, title, summary, path, url,
				status, metadata_json, occurred_at, created_at
			)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)
		`)
		.bind(
			id,
			input.deviceId,
			input.deviceName,
			input.kind,
			input.title,
			input.summary ?? null,
			input.path ?? null,
			input.url ?? null,
			input.metadata ? JSON.stringify(input.metadata) : null,
			occurredAt,
			now,
		)
		.run();

	return {
		id,
		deviceId: input.deviceId,
		deviceName: input.deviceName,
		kind: input.kind,
		title: input.title,
		summary: input.summary,
		path: input.path,
		url: input.url,
		status: "new",
		metadata: input.metadata,
		occurredAt,
		createdAt: now,
	};
}

export async function listWorkDevices(db: D1Database): Promise<WorkDevice[]> {
	const result = await db
		.prepare(`
			SELECT id, name, hostname, platform, last_seen_at, created_at, updated_at
			FROM work_devices
			ORDER BY last_seen_at DESC
			LIMIT 50
		`)
		.all<WorkDeviceRow>();

	return (result.results ?? []).map(toDevice);
}

export async function listWorkItems(db: D1Database): Promise<WorkItem[]> {
	const result = await db
		.prepare(`
			SELECT
				id, device_id, device_name, kind, title, summary, path, url,
				status, metadata_json, occurred_at, created_at
			FROM work_items
			ORDER BY created_at DESC
			LIMIT 100
		`)
		.all<WorkItemRow>();

	return (result.results ?? []).map(toItem);
}

export async function listWorkItemsByCategory(
	db: D1Database,
	category: string,
): Promise<WorkItem[]> {
	const result = await db
		.prepare(`
			SELECT
				id, device_id, device_name, kind, title, summary, path, url,
				status, metadata_json, occurred_at, created_at
			FROM work_items
			WHERE json_extract(metadata_json, '$.category') = ?
			ORDER BY occurred_at DESC
			LIMIT 100
		`)
		.bind(category)
		.all<WorkItemRow>();

	return (result.results ?? []).map(toItem);
}

export async function deleteExpiredWorkItemsByCategory(
	db: D1Database,
	category: string,
	cutoffIso: string,
): Promise<number> {
	const result = await db
		.prepare(`
			DELETE FROM work_items
			WHERE json_extract(metadata_json, '$.category') = ?
				AND occurred_at < ?
		`)
		.bind(category, cutoffIso)
		.run();

	return result.meta.changes ?? 0;
}
