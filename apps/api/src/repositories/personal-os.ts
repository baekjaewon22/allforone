import type {
	AiReport,
	DailyLog,
	HealthEntry,
	NewAiReport,
	NewDailyLog,
	NewHealthEntry,
} from "@all-for-one/shared";

type DailyLogRow = {
	id: string;
	log_date: string;
	mood: number | null;
	condition: number | null;
	sleep_hours: number | null;
	focus: number | null;
	summary: string | null;
	wins: string | null;
	blockers: string | null;
	tomorrow: string | null;
	tags_json: string | null;
	created_at: string;
	updated_at: string;
};

type HealthEntryRow = {
	id: string;
	entry_date: string;
	sleep_hours: number | null;
	weight_kg: number | null;
	exercise_minutes: number | null;
	condition: number | null;
	stress: number | null;
	medication: string | null;
	meal_note: string | null;
	symptoms: string | null;
	created_at: string;
	updated_at: string;
};

type AiReportRow = {
	id: string;
	provider: string;
	task_title: string;
	request: string | null;
	result: string;
	changed_files_json: string | null;
	commands_json: string | null;
	todos_json: string | null;
	status: AiReport["status"];
	metadata_json: string | null;
	occurred_at: string;
	created_at: string;
	updated_at: string;
};

const parseStringArray = (value: string | null): string[] | undefined =>
	value ? JSON.parse(value) : undefined;

const toDailyLog = (row: DailyLogRow): DailyLog => ({
	id: row.id,
	logDate: row.log_date,
	mood: row.mood ?? undefined,
	condition: row.condition ?? undefined,
	sleepHours: row.sleep_hours ?? undefined,
	focus: row.focus ?? undefined,
	summary: row.summary ?? undefined,
	wins: row.wins ?? undefined,
	blockers: row.blockers ?? undefined,
	tomorrow: row.tomorrow ?? undefined,
	tags: parseStringArray(row.tags_json),
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

const toHealthEntry = (row: HealthEntryRow): HealthEntry => ({
	id: row.id,
	entryDate: row.entry_date,
	sleepHours: row.sleep_hours ?? undefined,
	weightKg: row.weight_kg ?? undefined,
	exerciseMinutes: row.exercise_minutes ?? undefined,
	condition: row.condition ?? undefined,
	stress: row.stress ?? undefined,
	medication: row.medication ?? undefined,
	mealNote: row.meal_note ?? undefined,
	symptoms: row.symptoms ?? undefined,
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

const toAiReport = (row: AiReportRow): AiReport => ({
	id: row.id,
	provider: row.provider,
	taskTitle: row.task_title,
	request: row.request ?? undefined,
	result: row.result,
	changedFiles: parseStringArray(row.changed_files_json),
	commands: parseStringArray(row.commands_json),
	todos: parseStringArray(row.todos_json),
	status: row.status,
	metadata: row.metadata_json ? JSON.parse(row.metadata_json) : undefined,
	occurredAt: row.occurred_at,
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

export async function upsertDailyLog(
	db: D1Database,
	input: NewDailyLog,
): Promise<DailyLog> {
	const now = new Date().toISOString();
	const id = crypto.randomUUID();

	await db
		.prepare(`
			INSERT INTO daily_logs (
				id, log_date, mood, condition, sleep_hours, focus, summary, wins,
				blockers, tomorrow, tags_json, created_at, updated_at
			)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(log_date) DO UPDATE SET
				mood = excluded.mood,
				condition = excluded.condition,
				sleep_hours = excluded.sleep_hours,
				focus = excluded.focus,
				summary = excluded.summary,
				wins = excluded.wins,
				blockers = excluded.blockers,
				tomorrow = excluded.tomorrow,
				tags_json = excluded.tags_json,
				updated_at = excluded.updated_at
		`)
		.bind(
			id,
			input.logDate,
			input.mood ?? null,
			input.condition ?? null,
			input.sleepHours ?? null,
			input.focus ?? null,
			input.summary ?? null,
			input.wins ?? null,
			input.blockers ?? null,
			input.tomorrow ?? null,
			input.tags ? JSON.stringify(input.tags) : null,
			now,
			now,
		)
		.run();

	const item = await getDailyLogByDate(db, input.logDate);
	if (!item) {
		throw new Error("daily_log_upsert_failed");
	}
	return item;
}

export async function listDailyLogs(db: D1Database): Promise<DailyLog[]> {
	const result = await db
		.prepare(`
			SELECT id, log_date, mood, condition, sleep_hours, focus, summary, wins,
				blockers, tomorrow, tags_json, created_at, updated_at
			FROM daily_logs
			ORDER BY log_date DESC
			LIMIT 60
		`)
		.all<DailyLogRow>();

	return (result.results ?? []).map(toDailyLog);
}

export async function getDailyLogByDate(
	db: D1Database,
	date: string,
): Promise<DailyLog | undefined> {
	const row = await db
		.prepare(`
			SELECT id, log_date, mood, condition, sleep_hours, focus, summary, wins,
				blockers, tomorrow, tags_json, created_at, updated_at
			FROM daily_logs
			WHERE log_date = ?
		`)
		.bind(date)
		.first<DailyLogRow>();

	return row ? toDailyLog(row) : undefined;
}

export async function upsertHealthEntry(
	db: D1Database,
	input: NewHealthEntry,
): Promise<HealthEntry> {
	const now = new Date().toISOString();
	const id = crypto.randomUUID();

	await db
		.prepare(`
			INSERT INTO health_entries (
				id, entry_date, sleep_hours, weight_kg, exercise_minutes, condition,
				stress, medication, meal_note, symptoms, created_at, updated_at
			)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(entry_date) DO UPDATE SET
				sleep_hours = excluded.sleep_hours,
				weight_kg = excluded.weight_kg,
				exercise_minutes = excluded.exercise_minutes,
				condition = excluded.condition,
				stress = excluded.stress,
				medication = excluded.medication,
				meal_note = excluded.meal_note,
				symptoms = excluded.symptoms,
				updated_at = excluded.updated_at
		`)
		.bind(
			id,
			input.entryDate,
			input.sleepHours ?? null,
			input.weightKg ?? null,
			input.exerciseMinutes ?? null,
			input.condition ?? null,
			input.stress ?? null,
			input.medication ?? null,
			input.mealNote ?? null,
			input.symptoms ?? null,
			now,
			now,
		)
		.run();

	const item = await getHealthEntryByDate(db, input.entryDate);
	if (!item) {
		throw new Error("health_entry_upsert_failed");
	}
	return item;
}

export async function listHealthEntries(db: D1Database): Promise<HealthEntry[]> {
	const result = await db
		.prepare(`
			SELECT id, entry_date, sleep_hours, weight_kg, exercise_minutes,
				condition, stress, medication, meal_note, symptoms, created_at, updated_at
			FROM health_entries
			ORDER BY entry_date DESC
			LIMIT 60
		`)
		.all<HealthEntryRow>();

	return (result.results ?? []).map(toHealthEntry);
}

export async function getHealthEntryByDate(
	db: D1Database,
	date: string,
): Promise<HealthEntry | undefined> {
	const row = await db
		.prepare(`
			SELECT id, entry_date, sleep_hours, weight_kg, exercise_minutes,
				condition, stress, medication, meal_note, symptoms, created_at, updated_at
			FROM health_entries
			WHERE entry_date = ?
		`)
		.bind(date)
		.first<HealthEntryRow>();

	return row ? toHealthEntry(row) : undefined;
}

export async function createAiReport(
	db: D1Database,
	input: NewAiReport,
): Promise<AiReport> {
	const now = new Date().toISOString();
	const occurredAt = input.occurredAt ?? now;
	const id = crypto.randomUUID();
	const status = input.status ?? "received";

	await db
		.prepare(`
			INSERT INTO ai_reports (
				id, provider, task_title, request, result, changed_files_json,
				commands_json, todos_json, status, metadata_json, occurred_at,
				created_at, updated_at
			)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`)
		.bind(
			id,
			input.provider,
			input.taskTitle,
			input.request ?? null,
			input.result,
			input.changedFiles ? JSON.stringify(input.changedFiles) : null,
			input.commands ? JSON.stringify(input.commands) : null,
			input.todos ? JSON.stringify(input.todos) : null,
			status,
			input.metadata ? JSON.stringify(input.metadata) : null,
			occurredAt,
			now,
			now,
		)
		.run();

	return {
		id,
		provider: input.provider,
		taskTitle: input.taskTitle,
		request: input.request,
		result: input.result,
		changedFiles: input.changedFiles,
		commands: input.commands,
		todos: input.todos,
		status,
		metadata: input.metadata,
		occurredAt,
		createdAt: now,
		updatedAt: now,
	};
}

export async function listAiReports(db: D1Database): Promise<AiReport[]> {
	const result = await db
		.prepare(`
			SELECT id, provider, task_title, request, result, changed_files_json,
				commands_json, todos_json, status, metadata_json, occurred_at,
				created_at, updated_at
			FROM ai_reports
			ORDER BY occurred_at DESC
			LIMIT 100
		`)
		.all<AiReportRow>();

	return (result.results ?? []).map(toAiReport);
}
