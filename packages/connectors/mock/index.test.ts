import { describe, expect, it } from "vitest";
import { isValidElement } from "react";
import {
	metricSchema,
	reportItemSchema,
	scheduleItemSchema,
} from "@all-for-one/shared";
import { createMockConnector } from ".";

const range = {
	from: "2026-05-18T00:00:00.000Z",
	to: "2026-05-19T00:00:00.000Z",
};

describe("mock connector", () => {
	it("lists and mutates normalized schedule items", async () => {
		const connector = createMockConnector();
		const listed = await connector.schedule.list(range);

		expect(listed).toHaveLength(2);
		expect(() => scheduleItemSchema.parse(listed[0])).not.toThrow();

		const created = await connector.schedule.create({
			connectorId: "ignored-by-mock",
			title: "Created mock event",
			startAt: "2026-05-18T15:00:00.000Z",
			endAt: "2026-05-18T15:30:00.000Z",
			status: "confirmed",
		});
		expect(scheduleItemSchema.parse(created)).toMatchObject({
			connectorId: "mock",
			title: "Created mock event",
		});

		const updated = await connector.schedule.update(created.id, {
			title: "Updated mock event",
			connectorId: "ignored-by-mock",
		});
		expect(updated).toMatchObject({
			id: created.id,
			connectorId: "mock",
			title: "Updated mock event",
		});

		await connector.schedule.delete(created.id);
		await expect(connector.schedule.update(created.id, {})).rejects.toThrow(
			"Mock schedule not found",
		);
	});

	it("returns normalized report metrics and recent reports", async () => {
		const connector = createMockConnector();
		const metrics = await connector.report.metrics(range);
		const reports = await connector.report.recent();

		expect(metrics).toHaveLength(1);
		expect(() => metricSchema.parse(metrics[0])).not.toThrow();
		expect(reports).toHaveLength(1);
		expect(() => reportItemSchema.parse(reports[0])).not.toThrow();
	});

	it("renders a React widget and exposes no tools yet", () => {
		const connector = createMockConnector();
		const [widget] = connector.widgets;
		const rendered = widget.render({
			connectorId: connector.id,
			now: "2026-05-18T11:00:00.000Z",
		});

		expect(widget).toMatchObject({
			id: "mock-summary",
			size: "md",
			title: "Mock Summary",
		});
		expect(isValidElement(rendered)).toBe(true);
		expect(rendered).toMatchObject({
			type: "section",
			props: {
				"data-connector-id": "mock",
				"data-widget-id": "mock-summary",
			},
		});
		expect(connector.tools()).toEqual([]);
	});
});
