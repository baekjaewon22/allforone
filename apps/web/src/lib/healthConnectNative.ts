import { registerPlugin } from "@capacitor/core";
import type { HealthConnectSyncInput, NewHealthConnectDailySummary } from "@all-for-one/shared";
import { rpcClient } from "./rpcClient";

type NativeHealthConnectResult = {
	available?: boolean;
	needsPermission?: boolean;
	missing?: string[];
	deviceId?: string;
	lastSyncedAt?: string;
	summaries?: NewHealthConnectDailySummary[];
	sdkStatus?: number;
};

type AfoHealthConnectPlugin = {
	openSettings(): Promise<void>;
	readDailySummaries(options: { days: number }): Promise<NativeHealthConnectResult>;
};

const AfoHealthConnect = registerPlugin<AfoHealthConnectPlugin>("AfoHealthConnect");

export async function syncNativeHealthConnect(days = 7) {
	const result = await AfoHealthConnect.readDailySummaries({ days });
	if (!result.available) {
		return { status: "unavailable" as const, result };
	}
	if (result.needsPermission) {
		return { status: "needs_permission" as const, result };
	}
	if (!result.deviceId || !result.summaries?.length) {
		return { status: "empty" as const, result };
	}

	const payload: HealthConnectSyncInput = {
		deviceId: result.deviceId,
		lastSyncedAt: result.lastSyncedAt ?? new Date().toISOString(),
		summaries: result.summaries,
	};
	await rpcClient.syncHealthConnect(payload);
	return { status: "synced" as const, result };
}

export async function openNativeHealthConnectSettings() {
	await AfoHealthConnect.openSettings();
}