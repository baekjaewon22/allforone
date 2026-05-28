import type {
	HealthConnectDailySummary,
	HealthConnectSyncInput,
	HealthConnectSyncState,
	NewHealthConnectDailySummary,
} from "@all-for-one/shared";

type HealthConnectDailySummaryRow = {
	date: string;
	device_id: string;
	steps: number | null;
	sleep_minutes: number | null;
	exercise_minutes: number | null;
	active_calories: number | null;
	total_calories: number | null;
	distance_meters: number | null;
	heart_rate_avg: number | null;
	heart_rate_min: number | null;
	heart_rate_max: number | null;
	weight_kg: number | null;
	source: string | null;
	raw_json: string | null;
	synced_at: string;
	created_at: string;
	updated_at: string;
};

type HealthConnectSyncStateRow = {
	device_id: string;
	last_synced_at: string;
	last_status: "ok" | "error";
	error_message: string | null;
	created_at: string;
	updated_at: string;
};

const toSummary = (row: HealthConnectDailySummaryRow): HealthConnectDailySummary => ({
	date: row.date,
	deviceId: row.device_id,
	steps: row.steps ?? undefined,
	sleepMinutes: row.sleep_minutes ?? undefined,
	exerciseMinutes: row.exercise_minutes ?? undefined,
	activeCalories: row.active_calories ?? undefined,
	totalCalories: row.total_calories ?? undefined,
	distanceMeters: row.distance_meters ?? undefined,
	heartRateAvg: row.heart_rate_avg ?? undefined,
	heartRateMin: row.heart_rate_min ?? undefined,
	heartRateMax: row.heart_rate_max ?? undefined,
	weightKg: row.weight_kg ?? undefined,
	source: row.source ?? undefined,
	raw: row.raw_json ? JSON.parse(row.raw_json) : undefined,
	syncedAt: row.synced_at,
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

const toSyncState = (row: HealthConnectSyncStateRow): HealthConnectSyncState => ({
	deviceId: row.device_id,
	lastSyncedAt: row.last_synced_at,
	lastStatus: row.last_status,
	errorMessage: row.error_message ?? undefined,
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

export async function upsertHealthConnectSummary(
	db: D1Database,
	input: NewHealthConnectDailySummary,
): Promise<HealthConnectDailySummary> {
	const now = new Date().toISOString();
	await db
		.prepare(`
			INSERT INTO health_connect_daily_summaries (
				date, device_id, steps, sleep_minutes, exercise_minutes,
				active_calories, total_calories, distance_meters,
				heart_rate_avg, heart_rate_min, heart_rate_max, weight_kg,
				source, raw_json, synced_at, created_at, updated_at
			)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(date, device_id) DO UPDATE SET
				steps = excluded.steps,
				sleep_minutes = excluded.sleep_minutes,
				exercise_minutes = excluded.exercise_minutes,
				active_calories = excluded.active_calories,
				total_calories = excluded.total_calories,
				distance_meters = excluded.distance_meters,
				heart_rate_avg = excluded.heart_rate_avg,
				heart_rate_min = excluded.heart_rate_min,
				heart_rate_max = excluded.heart_rate_max,
				weight_kg = excluded.weight_kg,
				source = excluded.source,
				raw_json = excluded.raw_json,
				synced_at = excluded.synced_at,
				updated_at = excluded.updated_at
		`)
		.bind(
			input.date,
			input.deviceId,
			input.steps ?? null,
			input.sleepMinutes ?? null,
			input.exerciseMinutes ?? null,
			input.activeCalories ?? null,
			input.totalCalories ?? null,
			input.distanceMeters ?? null,
			input.heartRateAvg ?? null,
			input.heartRateMin ?? null,
			input.heartRateMax ?? null,
			input.weightKg ?? null,
			input.source ?? null,
			input.raw ? JSON.stringify(input.raw) : null,
			input.syncedAt,
			now,
			now,
		)
		.run();

	const summary = await getHealthConnectSummary(db, input.date, input.deviceId);
	if (!summary) {
		throw new Error("health_connect_summary_upsert_failed");
	}

	return summary;
}

export async function upsertHealthConnectBatch(
	db: D1Database,
	input: HealthConnectSyncInput,
): Promise<HealthConnectDailySummary[]> {
	const summaries: HealthConnectDailySummary[] = [];
	for (const summary of input.summaries) {
		summaries.push(
			await upsertHealthConnectSummary(db, {
				...summary,
				deviceId: input.deviceId,
			}),
		);
	}

	await upsertHealthConnectSyncState(db, {
		deviceId: input.deviceId,
		lastSyncedAt: input.lastSyncedAt ?? new Date().toISOString(),
		lastStatus: "ok",
	});

	return summaries;
}

export async function getHealthConnectSummary(
	db: D1Database,
	date: string,
	deviceId: string,
): Promise<HealthConnectDailySummary | undefined> {
	const row = await db
		.prepare(`
			SELECT
				date, device_id, steps, sleep_minutes, exercise_minutes,
				active_calories, total_calories, distance_meters,
				heart_rate_avg, heart_rate_min, heart_rate_max, weight_kg,
				source, raw_json, synced_at, created_at, updated_at
			FROM health_connect_daily_summaries
			WHERE date = ? AND device_id = ?
		`)
		.bind(date, deviceId)
		.first<HealthConnectDailySummaryRow>();

	return row ? toSummary(row) : undefined;
}

export async function getLatestHealthConnectSummaryByDate(
	db: D1Database,
	date: string,
): Promise<HealthConnectDailySummary | undefined> {
	const row = await db
		.prepare(`
			SELECT
				date, device_id, steps, sleep_minutes, exercise_minutes,
				active_calories, total_calories, distance_meters,
				heart_rate_avg, heart_rate_min, heart_rate_max, weight_kg,
				source, raw_json, synced_at, created_at, updated_at
			FROM health_connect_daily_summaries
			WHERE date = ?
			ORDER BY synced_at DESC
			LIMIT 1
		`)
		.bind(date)
		.first<HealthConnectDailySummaryRow>();

	return row ? toSummary(row) : undefined;
}

export async function listHealthConnectSummaries(
	db: D1Database,
	range: { from?: string; to?: string; deviceId?: string },
): Promise<HealthConnectDailySummary[]> {
	const clauses: string[] = [];
	const bindings: string[] = [];
	if (range.from) {
		clauses.push("date >= ?");
		bindings.push(range.from);
	}
	if (range.to) {
		clauses.push("date <= ?");
		bindings.push(range.to);
	}
	if (range.deviceId) {
		clauses.push("device_id = ?");
		bindings.push(range.deviceId);
	}

	const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
	const result = await db
		.prepare(`
			SELECT
				date, device_id, steps, sleep_minutes, exercise_minutes,
				active_calories, total_calories, distance_meters,
				heart_rate_avg, heart_rate_min, heart_rate_max, weight_kg,
				source, raw_json, synced_at, created_at, updated_at
			FROM health_connect_daily_summaries
			${where}
			ORDER BY date DESC, synced_at DESC
			LIMIT 90
		`)
		.bind(...bindings)
		.all<HealthConnectDailySummaryRow>();

	return (result.results ?? []).map(toSummary);
}

export async function getHealthConnectSyncState(
	db: D1Database,
	deviceId: string,
): Promise<HealthConnectSyncState | undefined> {
	const row = await db
		.prepare(`
			SELECT device_id, last_synced_at, last_status, error_message, created_at, updated_at
			FROM health_connect_sync_state
			WHERE device_id = ?
		`)
		.bind(deviceId)
		.first<HealthConnectSyncStateRow>();

	return row ? toSyncState(row) : undefined;
}

async function upsertHealthConnectSyncState(
	db: D1Database,
	input: Pick<HealthConnectSyncState, "deviceId" | "lastSyncedAt" | "lastStatus"> & {
		errorMessage?: string;
	},
) {
	const now = new Date().toISOString();
	await db
		.prepare(`
			INSERT INTO health_connect_sync_state (
				device_id, last_synced_at, last_status, error_message, created_at, updated_at
			)
			VALUES (?, ?, ?, ?, ?, ?)
			ON CONFLICT(device_id) DO UPDATE SET
				last_synced_at = excluded.last_synced_at,
				last_status = excluded.last_status,
				error_message = excluded.error_message,
				updated_at = excluded.updated_at
		`)
		.bind(
			input.deviceId,
			input.lastSyncedAt,
			input.lastStatus,
			input.errorMessage ?? null,
			now,
			now,
		)
		.run();
}
