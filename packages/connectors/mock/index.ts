import { createElement } from "react";
import type {
	DateRange,
	Metric,
	NewScheduleItem,
	ReportItem,
	ScheduleItem,
	WidgetCtx,
} from "@all-for-one/shared";
import type { Connector } from "../_base";

const connectorId = "mock";
const mockNow = "2026-05-18T00:00:00.000Z";

const seedSchedule: ScheduleItem[] = [
	{
		id: "mock-schedule-1",
		connectorId,
		title: "Daily planning",
		startAt: "2026-05-18T09:00:00.000Z",
		endAt: "2026-05-18T09:30:00.000Z",
		status: "confirmed",
		updatedAt: mockNow,
		metadata: {
			source: "mock",
		},
	},
	{
		id: "mock-schedule-2",
		connectorId,
		title: "Connector review",
		startAt: "2026-05-18T13:00:00.000Z",
		endAt: "2026-05-18T14:00:00.000Z",
		status: "tentative",
		updatedAt: mockNow,
		metadata: {
			source: "mock",
		},
	},
];

const seedMetrics: Metric[] = [
	{
		id: "mock-metric-1",
		connectorId,
		name: "Focus minutes",
		value: 90,
		unit: "min",
		measuredAt: "2026-05-18T10:00:00.000Z",
		metadata: {
			source: "mock",
		},
	},
];

const seedReports: ReportItem[] = [
	{
		id: "mock-report-1",
		connectorId,
		title: "Mock daily report",
		summary: "Schedule and report pipelines are connected.",
		createdAt: "2026-05-18T10:30:00.000Z",
		metadata: {
			source: "mock",
		},
	},
];

const overlaps = (item: ScheduleItem, range: DateRange): boolean => {
	return item.startAt < range.to && item.endAt > range.from;
};

const createScheduleStore = (items: ScheduleItem[]) => {
	let nextId = items.length + 1;
	const schedules = new Map(items.map((item) => [item.id, item]));

	return {
		list(range: DateRange): ScheduleItem[] {
			return [...schedules.values()].filter((item) => overlaps(item, range));
		},
		create(item: NewScheduleItem): ScheduleItem {
			const scheduleItem: ScheduleItem = {
				...item,
				connectorId,
				id: `mock-schedule-${nextId}`,
				updatedAt: mockNow,
			};
			nextId += 1;
			schedules.set(scheduleItem.id, scheduleItem);

			return scheduleItem;
		},
		update(id: string, patch: Partial<ScheduleItem>): ScheduleItem {
			const current = schedules.get(id);
			if (!current) {
				throw new Error(`Mock schedule not found: ${id}`);
			}

			const updated: ScheduleItem = {
				...current,
				...patch,
				id,
				connectorId,
				updatedAt: mockNow,
			};
			schedules.set(id, updated);

			return updated;
		},
		delete(id: string): void {
			schedules.delete(id);
		},
	};
};

export const createMockConnector = (): Connector => {
	const scheduleStore = createScheduleStore(seedSchedule);

	return {
		id: connectorId,
		displayName: "Mock Connector",
		icon: "mock",
		auth: {
			kind: "apikey",
			async refresh() {},
			async revoke() {},
		},
		schedule: {
			async list(range) {
				return scheduleStore.list(range);
			},
			async create(item) {
				return scheduleStore.create(item);
			},
			async update(id, patch) {
				return scheduleStore.update(id, patch);
			},
			async delete(id) {
				scheduleStore.delete(id);
			},
		},
		report: {
			async metrics(range) {
				return seedMetrics.filter(
					(metric) =>
						metric.measuredAt >= range.from && metric.measuredAt <= range.to,
				);
			},
			async recent() {
				return seedReports;
			},
		},
		async pullDelta() {},
		widgets: [
			{
				id: "mock-summary",
				title: "Mock Summary",
				size: "md",
				render: (ctx: WidgetCtx) =>
					createElement(
						"section",
						{
							"data-connector-id": ctx.connectorId,
							"data-widget-id": "mock-summary",
						},
						createElement("h3", null, "Mock Summary"),
						createElement("p", null, `Rendered at ${ctx.now}`),
					),
			},
		],
		tools() {
			return [];
		},
	};
};

export const mockConnector = createMockConnector();
