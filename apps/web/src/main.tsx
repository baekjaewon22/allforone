import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { Providers } from "./providers";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Providers>
			<App />
		</Providers>
	</StrictMode>,
);

window.setTimeout(() => {
	const boot = document.getElementById("app-boot");
	boot?.classList.add("app-boot--done");
	window.setTimeout(() => boot?.remove(), 280);
}, 850);

if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		navigator.serviceWorker.register("/sw.js").catch(() => {
			// The app still works as a normal website when service worker registration is unavailable.
		});
	});
}
