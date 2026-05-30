import { RouterProvider } from "@tanstack/react-router";
import { useEffect } from "react";
import {
	autoSyncNativeHealthConnect,
	enableBackgroundHealthSync,
} from "./lib/healthConnectNative";
import { router } from "./router";

export function App() {
	useEffect(() => {
		// Register the native background sync job once per launch (no-op on web).
		void enableBackgroundHealthSync().catch((error) => {
			console.warn("Health Connect background sync registration failed", error);
		});

		const sync = () => {
			void autoSyncNativeHealthConnect().catch((error) => {
				console.warn("Health Connect auto sync failed", error);
			});
		};
		const syncWhenVisible = () => {
			if (document.visibilityState === "visible") {
				sync();
			}
		};

		sync();
		document.addEventListener("visibilitychange", syncWhenVisible);
		window.addEventListener("focus", sync);
		const interval = window.setInterval(sync, 1000 * 60 * 60 * 6);

		return () => {
			document.removeEventListener("visibilitychange", syncWhenVisible);
			window.removeEventListener("focus", sync);
			window.clearInterval(interval);
		};
	}, []);

	return <RouterProvider router={router} />;
}
