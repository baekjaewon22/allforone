import type { ReactNode } from "react";
import type {
	DateRange,
	Metric,
	NewScheduleItem,
	ReportItem,
	ScheduleItem,
	ToolDescriptor,
	WidgetCtx,
} from "@all-for-one/shared";

export type ConnectorAuthKind = "oauth" | "apikey" | "cookie";

export type ConnectorWidgetSize = "sm" | "md" | "lg";

export type ConnectorWidget = {
	id: string;
	title: string;
	size: ConnectorWidgetSize;
	render: (ctx: WidgetCtx) => ReactNode;
};

export interface Connector {
	id: string;
	displayName: string;
	icon: string;
	auth: {
		kind: ConnectorAuthKind;
		refresh(): Promise<void>;
		revoke(): Promise<void>;
	};
	schedule: {
		list(range: DateRange): Promise<ScheduleItem[]>;
		create(item: NewScheduleItem): Promise<ScheduleItem>;
		update(id: string, patch: Partial<ScheduleItem>): Promise<ScheduleItem>;
		delete(id: string): Promise<void>;
	};
	report: {
		metrics(range: DateRange): Promise<Metric[]>;
		recent(): Promise<ReportItem[]>;
	};
	pullDelta(): Promise<void>;
	widgets: ConnectorWidget[];
	tools(): ToolDescriptor[];
}
