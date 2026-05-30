import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
	appId: "kr.allforone.app",
	appName: "All For One",
	webDir: "dist",
	server: {
		androidScheme: "https",
	},
};

export default config;
