import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const databases = {
	dev: "all-for-one-dev",
	preview: "all-for-one-preview",
	prod: "all-for-one-prod",
};

const args = process.argv.slice(2);
const envArg = args.find((arg) => arg.startsWith("--env="));
const env = envArg?.slice("--env=".length) ?? "dev";
const remote = args.includes("--remote");

if (!Object.hasOwn(databases, env)) {
	console.error(
		`Unknown env "${env}". Use one of: ${Object.keys(databases).join(", ")}`,
	);
	process.exit(1);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const apiDir = path.join(repoRoot, "apps", "api");
const wranglerBin = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const wranglerArgs = [
	"--dir",
	apiDir,
	"exec",
	"wrangler",
	"d1",
	"migrations",
	"apply",
	databases[env],
	"--config",
	"../../infra/wrangler.toml",
	"--env",
	env,
];

wranglerArgs.push(remote ? "--remote" : "--local");

const result = spawnSync(wranglerBin, wranglerArgs, {
	cwd: repoRoot,
	stdio: "inherit",
	shell: false,
});

process.exit(result.status ?? 1);
