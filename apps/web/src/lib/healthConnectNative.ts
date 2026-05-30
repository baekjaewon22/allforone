import { Capacitor, registerPlugin } from "@capacitor/core";
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
	requestHealthPermissions(): Promise<NativeHealthConnectResult>;
	readDailySummaries(options: { days: number }): Promise<NativeHealthConnectResult>;
	enableBackgroundSync(options: {
		apiBaseUrl: string;
		deviceKey?: string;
		days?: number;
		intervalMinutes?: number;
	}): Promise<{ scheduled: boolean; intervalMinutes: number }>;
	disableBackgroundSync(): Promise<void>;
};

const AfoHealthConnect = registerPlugin<AfoHealthConnectPlugin>("AfoHealthConnect");
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8787";
const deviceIngestKey = import.meta.env.VITE_AFO_DEVICE_INGEST_KEY as string | undefined;
const autoSyncAttemptKey = "afo.healthConnect.autoSyncAttemptAt";
const autoSyncSuccessKey = "afo.healthConnect.autoSyncSuccessAt";
let autoSyncInFlight: ReturnType<typeof syncNativeHealthConnect> | undefined;

export async function syncNativeHealthConnect(
	days = 7,
	options: { requestPermissions?: boolean } = {},
) {
	const shouldRequestPermissions = options.requestPermissions ?? true;
	let result = await AfoHealthConnect.readDailySummaries({ days });
	if (!result.available) {
		return { status: "unavailable" as const, result };
	}
	if (result.needsPermission) {
		if (!shouldRequestPermissions) {
			return { status: "needs_permission" as const, result };
		}
		const permissionResult = await AfoHealthConnect.requestHealthPermissions();
		if (!permissionResult.available) {
			return { status: "unavailable" as const, result: permissionResult };
		}
		if (permissionResult.needsPermission) {
			return { status: "needs_permission" as const, result: permissionResult };
		}
		result = await AfoHealthConnect.readDailySummaries({ days });
	}
	if (!result.deviceId || !result.summaries?.length) {
		return { status: "empty" as const, result };
	}
	const deviceId = result.deviceId;

	const payload: HealthConnectSyncInput = {
		deviceId,
		lastSyncedAt: result.lastSyncedAt ?? new Date().toISOString(),
		summaries: result.summaries.map((summary) => ({
			...summary,
			deviceId,
		})),
	};
	await rpcClient.syncHealthConnect(payload);
	return { status: "synced" as const, result };
}

export async function autoSyncNativeHealthConnect(options: {
	days?: number;
	minIntervalMs?: number;
} = {}) {
	if (!Capacitor.isNativePlatform()) {
		return { status: "skipped" as const, reason: "not_native" as const };
	}

	const minIntervalMs = options.minIntervalMs ?? 1000 * 60 * 60 * 6;
	const lastAttempt = Number(globalThis.localStorage?.getItem(autoSyncAttemptKey) ?? 0);
	if (Date.now() - lastAttempt < minIntervalMs) {
		return { status: "skipped" as const, reason: "throttled" as const };
	}

	if (!autoSyncInFlight) {
		globalThis.localStorage?.setItem(autoSyncAttemptKey, String(Date.now()));
		autoSyncInFlight = syncNativeHealthConnect(options.days ?? 7, {
			requestPermissions: false,
		}).finally(() => {
			autoSyncInFlight = undefined;
		});
	}

	const result = await autoSyncInFlight;
	if (result.status === "synced") {
		globalThis.localStorage?.setItem(autoSyncSuccessKey, new Date().toISOString());
	}
	return result;
}

/**
 * Registers the native WorkManager job that keeps syncing Health Connect data while the
 * app is closed. Idempotent — safe to call on every app start. No-op on web/PWA.
 */
export async function enableBackgroundHealthSync(options: {
	days?: number;
	intervalMinutes?: number;
} = {}) {
	if (!Capacitor.isNativePlatform()) {
		return { status: "skipped" as const, reason: "not_native" as const };
	}
	try {
		const result = await AfoHealthConnect.enableBackgroundSync({
			apiBaseUrl,
			deviceKey: deviceIngestKey,
			days: options.days ?? 7,
			intervalMinutes: options.intervalMinutes ?? 360,
		});
		return { status: "scheduled" as const, result };
	} catch (error) {
		return { status: "error" as const, error };
	}
}

export async function disableBackgroundHealthSync() {
	if (!Capacitor.isNativePlatform()) {
		return;
	}
	await AfoHealthConnect.disableBackgroundSync();
}

export async function openNativeHealthConnectSettings() {
	await AfoHealthConnect.openSettings();
}
