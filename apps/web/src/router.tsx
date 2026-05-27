import { enabledConnectors } from "@all-for-one/connectors";
import type { AiReport, DailyLog, HealthEntry, WorkItem } from "@all-for-one/shared";
import { useQuery } from "@tanstack/react-query";
import {
	createRootRoute,
	createRoute,
	createRouter,
	Link,
	Outlet,
	redirect,
} from "@tanstack/react-router";
import {
	Activity,
	Bot,
	Cable,
	Globe2,
	HeartPulse,
	Inbox,
	LayoutDashboard,
	LogOut,
	Newspaper,
	NotebookPen,
	Settings,
} from "lucide-react";
import type { PropsWithChildren, ReactNode } from "react";
import { clearAuthSession, getAuthSession, useAuthGuard } from "./auth";
import { rpcClient } from "./lib/rpcClient";
import { LoginPage } from "./screens/LoginPage";
import { SiteDetailPage, SitesPage } from "./screens/SitesPage";

const text = {
	today: "\uC624\uB298",
	dashboard: "\uB300\uC2DC\uBCF4\uB4DC",
	life: "\uC77C\uC0C1 \uAE30\uB85D",
	health: "\uAC74\uAC15",
	aiReports: "AI \uC5C5\uBB34\uBCF4\uACE0",
	connectors: "\uC5F0\uB3D9 \uAD00\uB9AC",
	sites: "\uAD00\uB9AC \uC0AC\uC774\uD2B8",
	work: "\uC791\uC5C5\uD568",
	todayNews: "\uC624\uB298\uC758 \uB274\uC2A4",
	settings: "\uC124\uC815",
	logout: "\uB85C\uADF8\uC544\uC6C3",
	localUser: "\uB85C\uCEEC \uC0AC\uC6A9\uC790",
};

const statusLabel: Record<string, string> = {
	ready: "\uC900\uBE44\uB428",
	needs_auth: "\uC778\uC99D \uD544\uC694",
	offline: "\uC624\uD504\uB77C\uC778",
	new: "\uC2E0\uADDC",
	reviewed: "\uD655\uC778\uB428",
	archived: "\uBCF4\uAD00\uB428",
	received: "\uC218\uC2E0\uB428",
	needs_review: "\uAC80\uD1A0 \uD544\uC694",
	applied: "\uBC18\uC601\uB428",
	on_hold: "\uBCF4\uB958",
	discarded: "\uD3D0\uAE30",
};

const kindLabel: Record<string, string> = {
	file: "\uD30C\uC77C",
	note: "\uBA54\uBAA8",
	task: "\uC791\uC5C5",
	snapshot: "\uC2A4\uB0C5\uC0F7",
	link: "\uB9C1\uD06C",
};

const rootRoute = createRootRoute({
	component: RootLayout,
});

const loginRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/login",
	component: LoginPage,
});

const appRoute = createRoute({
	getParentRoute: () => rootRoute,
	id: "app",
	beforeLoad: ({ location }) => {
		if (!getAuthSession()) {
			throw redirect({
				to: "/login",
				search: { redirect: location.href },
			});
		}
	},
	component: AppShell,
});

const indexRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/",
	component: TodayPage,
});

const dashboardRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/dashboard",
	component: DashboardPage,
});

const lifeRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/life",
	component: LifePage,
});

const healthRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/health",
	component: HealthPage,
});

const aiReportsRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/ai-reports",
	component: AiReportsPage,
});

const connectorsRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/connectors",
	component: ConnectorsPage,
});

const sitesRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/sites",
	component: SitesPage,
});

const workRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/work",
	component: WorkInboxPage,
});

const newsRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/news",
	component: TodayNewsPage,
});

const siteDetailRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/sites/$siteId",
	component: SiteDetailRoute,
});

const settingsRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/settings",
	component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
	loginRoute,
	appRoute.addChildren([
		indexRoute,
		dashboardRoute,
		lifeRoute,
		healthRoute,
		aiReportsRoute,
		connectorsRoute,
		sitesRoute,
		siteDetailRoute,
		workRoute,
		newsRoute,
		settingsRoute,
	]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

function RootLayout() {
	return <Outlet />;
}

function AppShell() {
	const { session } = useAuthGuard();

	return (
		<div className="app-shell">
			<aside className="sidebar">
				<div className="brand-mark">
					<Activity aria-hidden="true" size={22} />
					<span>All For One</span>
				</div>
				<nav className="nav-list" aria-label="\uC8FC\uC694 \uBA54\uB274">
					<NavLink to="/" icon={<LayoutDashboard size={18} />} label={text.today} />
					<NavLink to="/life" icon={<NotebookPen size={18} />} label={text.life} />
					<NavLink to="/health" icon={<HeartPulse size={18} />} label={text.health} />
					<NavLink to="/ai-reports" icon={<Bot size={18} />} label={text.aiReports} />
					<NavLink to="/connectors" icon={<Cable size={18} />} label={text.connectors} />
					<NavLink to="/sites" icon={<Globe2 size={18} />} label={text.sites} />
					<NavLink to="/work" icon={<Inbox size={18} />} label={text.work} />
					<NavLink to="/news" icon={<Newspaper size={18} />} label={text.todayNews} />
					<NavLink to="/dashboard" icon={<Activity size={18} />} label={text.dashboard} />
					<NavLink to="/settings" icon={<Settings size={18} />} label={text.settings} />
				</nav>
				<div className="session-card">
					<span>{session?.email ?? text.localUser}</span>
					<button
						type="button"
						aria-label={text.logout}
						onClick={() => {
							clearAuthSession();
							globalThis.location.assign("/login");
						}}
					>
						<LogOut aria-hidden="true" size={16} />
					</button>
				</div>
			</aside>
			<main className="workspace">
				<Outlet />
			</main>
		</div>
	);
}

function NavLink({
	to,
	icon,
	label,
}: {
	to:
		| "/"
		| "/dashboard"
		| "/life"
		| "/health"
		| "/ai-reports"
		| "/connectors"
		| "/sites"
		| "/work"
		| "/news"
		| "/settings";
	icon: ReactNode;
	label: string;
}) {
	return (
		<Link to={to} className="nav-link" activeProps={{ className: "nav-link active" }}>
			{icon}
			<span>{label}</span>
		</Link>
	);
}

function SiteDetailRoute() {
	const { siteId } = siteDetailRoute.useParams();
	return <SiteDetailPage siteId={siteId} />;
}

function TodayPage() {
	const today = useQuery({
		queryKey: ["personal-today"],
		queryFn: rpcClient.getPersonalToday,
	});
	const data = today.data;

	return (
		<PageFrame title={text.today} eyebrow="\uAC1C\uC778 \uC6B4\uC601 \uC13C\uD130">
			<div className="today-hero">
				<div>
					<p className="app-eyebrow">{data?.date ?? new Date().toISOString().slice(0, 10)}</p>
					<h2>{data?.dailyLog?.summary ?? "\uC624\uB298\uC758 \uAE30\uB85D\uC774 \uC544\uC9C1 \uC5C6\uC2B5\uB2C8\uB2E4."}</h2>
					<span>
						{data?.dailyLog?.tomorrow ??
							"\uC77C\uC0C1, \uAC74\uAC15, AI \uC5C5\uBB34\uBCF4\uACE0\uB97C \uC774 \uD654\uBA74\uC5D0\uC11C \uD55C\uBC88\uC5D0 \uD655\uC778\uD569\uB2C8\uB2E4."}
					</span>
				</div>
				<div className="today-score-grid">
					<ScoreCard label="\uCEE8\uB514\uC158" value={data?.healthEntry?.condition ?? data?.dailyLog?.condition} suffix="/10" />
					<ScoreCard label="\uC218\uBA74" value={data?.healthEntry?.sleepHours ?? data?.dailyLog?.sleepHours} suffix="\uC2DC\uAC04" />
					<ScoreCard label="\uC9D1\uC911" value={data?.dailyLog?.focus} suffix="/10" />
				</div>
			</div>
			<div className="today-grid">
				<TodayPanel title="\uBBF8\uCC98\uB9AC \uC791\uC5C5" count={data?.openWorkItems.length ?? 0} to="/work">
					{data?.openWorkItems.slice(0, 4).map((item) => (
						<CompactLine key={item.id} title={item.title} meta={item.deviceName} />
					))}
				</TodayPanel>
				<TodayPanel title="AI \uC5C5\uBB34\uBCF4\uACE0" count={data?.aiReports.length ?? 0} to="/ai-reports">
					{data?.aiReports.slice(0, 4).map((report) => (
						<CompactLine key={report.id} title={report.taskTitle} meta={report.provider} />
					))}
				</TodayPanel>
				<TodayPanel title="\uC624\uB298\uC758 \uB274\uC2A4" count={data?.todayNews.length ?? 0} to="/news">
					{data?.todayNews.slice(0, 4).map((item) => (
						<CompactLine key={item.id} title={item.title} meta={item.path ?? "PDF"} />
					))}
				</TodayPanel>
				<TodayPanel title="\uAC74\uAC15" count={data?.healthEntry ? 1 : 0} to="/health">
					<CompactLine
						title={data?.healthEntry?.symptoms ?? "\uC624\uB298 \uAC74\uAC15 \uAE30\uB85D"}
						meta={`\uC2A4\uD2B8\uB808\uC2A4 ${data?.healthEntry?.stress ?? "-"} / \uC6B4\uB3D9 ${data?.healthEntry?.exerciseMinutes ?? 0}\uBD84`}
					/>
				</TodayPanel>
			</div>
		</PageFrame>
	);
}

function DashboardPage() {
	const snapshot = useQuery({
		queryKey: ["dashboard-snapshot"],
		queryFn: rpcClient.getDashboardSnapshot,
	});
	const now = new Date().toISOString();

	return (
		<PageFrame title={text.dashboard} eyebrow="\uC5C5\uBB34 \uD604\uD669">
			<div className="widget-grid">
				<WidgetSlot title="\uC624\uB298 \uC77C\uC815" value={`${snapshot.data?.schedules.length ?? 0}\uAC74`} />
				<WidgetSlot title="\uC8FC\uC694 \uC9C0\uD45C" value={`${snapshot.data?.metrics.length ?? 0}\uAC1C`} />
				<WidgetSlot title="\uBCF4\uACE0 \uC694\uC57D" value={`${snapshot.data?.reports.length ?? 0}\uAC74`} />
				{enabledConnectors.flatMap((connector) =>
					connector.widgets.map((widget) => (
						<section className="widget-slot" key={`${connector.id}:${widget.id}`}>
							<p>{widget.title}</p>
							{widget.render({
								connectorId: connector.id,
								now,
							})}
						</section>
					)),
				)}
			</div>
		</PageFrame>
	);
}

function ConnectorsPage() {
	const connectors = useQuery({
		queryKey: ["connectors"],
		queryFn: rpcClient.getConnectors,
	});

	return (
		<PageFrame title={text.connectors} eyebrow="\uC5F0\uACB0 \uC0C1\uD0DC">
			<div className="connector-list">
				{connectors.data?.map((connector) => (
					<section className="connector-row" key={connector.id}>
						<div>
							<h2>{connector.name}</h2>
							<p>{connector.description}</p>
						</div>
						<span data-status={connector.status}>{statusLabel[connector.status] ?? connector.status}</span>
					</section>
				))}
			</div>
		</PageFrame>
	);
}

function LifePage() {
	const logs = useQuery({
		queryKey: ["daily-logs"],
		queryFn: rpcClient.getDailyLogs,
	});

	return (
		<PageFrame title={text.life} eyebrow="\uD558\uB8E8 \uAE30\uB85D">
			<div className="board-toolbar">
				<div>
					<strong>{logs.data?.length ?? 0}</strong>
					<span>\uC800\uC7A5\uB41C \uAE30\uB85D</span>
				</div>
				<div>
					<strong>{average(logs.data?.map((item) => item.condition)).toFixed(1)}</strong>
					<span>\uD3C9\uADE0 \uCEE8\uB514\uC158</span>
				</div>
				<div>
					<strong>{average(logs.data?.map((item) => item.focus)).toFixed(1)}</strong>
					<span>\uD3C9\uADE0 \uC9D1\uC911\uB3C4</span>
				</div>
			</div>
			<section className="board-panel">
				<div className="board-header board-header-life">
					<span>\uB0A0\uC9DC</span>
					<span>\uC694\uC57D</span>
					<span>\uCEE8\uB514\uC158</span>
					<span>\uB0B4\uC77C</span>
				</div>
				{logs.data?.length ? (
					logs.data.map((log) => <DailyLogRow item={log} key={log.id} />)
				) : (
					<EmptyBoard label="\uC544\uC9C1 \uC77C\uC0C1 \uAE30\uB85D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." />
				)}
			</section>
		</PageFrame>
	);
}

function HealthPage() {
	const entries = useQuery({
		queryKey: ["health-entries"],
		queryFn: rpcClient.getHealthEntries,
	});

	return (
		<PageFrame title={text.health} eyebrow="\uCEE8\uB514\uC158 \uAD00\uB9AC">
			<div className="board-toolbar">
				<div>
					<strong>{average(entries.data?.map((item) => item.sleepHours)).toFixed(1)}</strong>
					<span>\uD3C9\uADE0 \uC218\uBA74</span>
				</div>
				<div>
					<strong>{average(entries.data?.map((item) => item.condition)).toFixed(1)}</strong>
					<span>\uD3C9\uADE0 \uCEE8\uB514\uC158</span>
				</div>
				<div>
					<strong>{sum(entries.data?.map((item) => item.exerciseMinutes))}</strong>
					<span>\uC6B4\uB3D9 \uBD84</span>
				</div>
			</div>
			<section className="board-panel">
				<div className="board-header board-header-health">
					<span>\uB0A0\uC9DC</span>
					<span>\uC218\uBA74/\uC6B4\uB3D9</span>
					<span>\uCEE8\uB514\uC158</span>
					<span>\uBA54\uBAA8</span>
				</div>
				{entries.data?.length ? (
					entries.data.map((entry) => <HealthEntryRow item={entry} key={entry.id} />)
				) : (
					<EmptyBoard label="\uC544\uC9C1 \uAC74\uAC15 \uAE30\uB85D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." />
				)}
			</section>
		</PageFrame>
	);
}

function AiReportsPage() {
	const reports = useQuery({
		queryKey: ["ai-reports"],
		queryFn: rpcClient.getAiReports,
	});

	return (
		<PageFrame title={text.aiReports} eyebrow="AI \uC9C0\uC2DC \uACB0\uACFC">
			<div className="board-toolbar">
				<div>
					<strong>{reports.data?.length ?? 0}</strong>
					<span>\uC218\uC2E0 \uBCF4\uACE0</span>
				</div>
				<div>
					<strong>{reports.data?.filter((item) => item.status === "needs_review").length ?? 0}</strong>
					<span>\uAC80\uD1A0 \uD544\uC694</span>
				</div>
				<div>
					<strong>{reports.data?.filter((item) => item.status === "applied").length ?? 0}</strong>
					<span>\uBC18\uC601\uB428</span>
				</div>
			</div>
			<section className="board-panel">
				<div className="board-header board-header-ai">
					<span>\uC5C5\uBB34</span>
					<span>AI</span>
					<span>\uC218\uC2E0\uC77C</span>
					<span>\uC0C1\uD0DC</span>
				</div>
				{reports.data?.length ? (
					reports.data.map((report) => <AiReportRow item={report} key={report.id} />)
				) : (
					<EmptyBoard label="\uC544\uC9C1 AI \uC5C5\uBB34\uBCF4\uACE0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." />
				)}
			</section>
		</PageFrame>
	);
}

function WorkInboxPage() {
	const intake = useQuery({
		queryKey: ["work-intake"],
		queryFn: rpcClient.getWorkIntakeSnapshot,
	});

	return (
		<PageFrame title={text.work} eyebrow="\uCEF4\uD4E8\uD130 \uC791\uC5C5 \uC218\uC2E0">
			<div className="site-overview">
				<div>
					<p>\uC5F0\uACB0\uB41C \uCEF4\uD4E8\uD130</p>
					<strong>{intake.data?.devices.length ?? 0}</strong>
				</div>
				<div>
					<p>\uC2E0\uADDC \uC791\uC5C5</p>
					<strong>{intake.data?.items.filter((item) => item.status === "new").length ?? 0}</strong>
				</div>
				<div>
					<p>\uC218\uC2E0 \uC8FC\uC18C</p>
					<strong>/work/ingest</strong>
				</div>
				<div>
					<p>\uC778\uC99D \uD5E4\uB354</p>
					<strong>X-AFO-Device-Key</strong>
				</div>
			</div>
			<div className="work-grid">
				<section className="site-section">
					<h2>\uC5F0\uACB0\uB41C \uCEF4\uD4E8\uD130</h2>
					<div className="site-section-list">
						{intake.data?.devices.map((device) => (
							<div className="site-row" key={device.id}>
								<div>
									<p>{device.platform ?? "\uD50C\uB7AB\uD3FC \uC5C6\uC74C"}</p>
									<h3>{device.name}</h3>
									<span>{device.hostname ?? device.id}</span>
								</div>
								<strong>{new Date(device.lastSeenAt).toLocaleString()}</strong>
							</div>
						))}
					</div>
				</section>
				<section className="site-section">
					<h2>\uCD5C\uADFC \uC791\uC5C5</h2>
					<div className="site-section-list">
						{intake.data?.items.map((item) => (
							<WorkItemRow item={item} key={item.id} />
						))}
					</div>
				</section>
			</div>
		</PageFrame>
	);
}

function TodayNewsPage() {
	const intake = useQuery({
		queryKey: ["today-news"],
		queryFn: rpcClient.getWorkIntakeSnapshot,
	});
	const items = intake.data?.todayNews ?? [];

	return (
		<PageFrame title={text.todayNews} eyebrow="PDF \uAC8C\uC2DC\uD310">
			<div className="board-toolbar">
				<div>
					<strong>{items.length}</strong>
					<span>\uC218\uC2E0\uB41C PDF</span>
				</div>
				<div>
					<strong>31\uC77C</strong>
					<span>\uC790\uB3D9 \uBCF4\uAD00 \uAE30\uAC04</span>
				</div>
				<div>
					<strong>/work/news/today</strong>
					<span>POST endpoint</span>
				</div>
			</div>
			<section className="board-panel">
				<div className="board-header">
					<span>\uC81C\uBAA9</span>
					<span>\uD30C\uC77C</span>
					<span>\uC218\uC2E0\uC77C</span>
					<span>\uC0C1\uD0DC</span>
				</div>
				{items.length ? (
					items.map((item) => <TodayNewsRow item={item} key={item.id} />)
				) : (
					<div className="empty-state">
						<strong>\uC544\uC9C1 \uC218\uC2E0\uB41C \uB274\uC2A4 PDF\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.</strong>
						<span>POST /work/news/today</span>
					</div>
				)}
			</section>
		</PageFrame>
	);
}

function TodayNewsRow({ item }: { item: WorkItem }) {
	const fileName = item.path ?? getStringMetadata(item, "filename") ?? "PDF";
	const hasInlineFile = Boolean(item.metadata?.inlineFileStored);

	return (
		<div className="board-row">
			<div>
				<h3>{item.title}</h3>
				<p>{item.summary ?? "\uC694\uC57D \uC5C6\uC74C"}</p>
			</div>
			<span>{fileName}</span>
			<span>{new Date(item.occurredAt).toLocaleString()}</span>
			<div className="board-actions">
				{item.url ? (
					<a className="inline-action" href={item.url} target="_blank" rel="noreferrer">
						\uC5F4\uAE30
					</a>
				) : (
					<span className="pill">{hasInlineFile ? "\uC800\uC7A5\uB428" : "\uB9C1\uD06C \uC5C6\uC74C"}</span>
				)}
			</div>
		</div>
	);
}

function DailyLogRow({ item }: { item: DailyLog }) {
	return (
		<div className="board-row board-row-life">
			<span>{item.logDate}</span>
			<div>
				<h3>{item.summary ?? "\uC694\uC57D \uC5C6\uC74C"}</h3>
				<p>{item.wins ?? item.blockers ?? "\uAE30\uB85D\uB41C \uBA54\uBAA8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."}</p>
			</div>
			<span>{item.condition ? `${item.condition}/10` : "-"}</span>
			<span>{item.tomorrow ?? "-"}</span>
		</div>
	);
}

function HealthEntryRow({ item }: { item: HealthEntry }) {
	return (
		<div className="board-row board-row-health">
			<span>{item.entryDate}</span>
			<span>
				{item.sleepHours ?? "-"}h / {item.exerciseMinutes ?? 0}m
			</span>
			<span>{item.condition ? `${item.condition}/10` : "-"}</span>
			<div>
				<h3>{item.symptoms ?? item.mealNote ?? "\uBA54\uBAA8 \uC5C6\uC74C"}</h3>
				<p>{item.medication ?? `\uC2A4\uD2B8\uB808\uC2A4 ${item.stress ?? "-"}/10`}</p>
			</div>
		</div>
	);
}

function AiReportRow({ item }: { item: AiReport }) {
	return (
		<div className="board-row board-row-ai">
			<div>
				<h3>{item.taskTitle}</h3>
				<p>{item.result}</p>
			</div>
			<span>{item.provider}</span>
			<span>{new Date(item.occurredAt).toLocaleString()}</span>
			<span className="pill">{statusLabel[item.status] ?? item.status}</span>
		</div>
	);
}

function WorkItemRow({ item }: { item: WorkItem }) {
	return (
		<div className="site-row">
			<div>
				<p>
					{item.deviceName} · {kindLabel[item.kind] ?? item.kind}
				</p>
				<h3>{item.title}</h3>
				<span>{item.summary ?? item.path ?? item.url ?? "\uC0C1\uC138 \uB0B4\uC6A9 \uC5C6\uC74C"}</span>
			</div>
			<strong>{statusLabel[item.status] ?? item.status}</strong>
		</div>
	);
}

function getStringMetadata(item: WorkItem, key: string) {
	const value = item.metadata?.[key];
	return typeof value === "string" ? value : undefined;
}

function ScoreCard({
	label,
	value,
	suffix,
}: {
	label: string;
	value?: number;
	suffix: string;
}) {
	return (
		<div className="score-card">
			<span>{label}</span>
			<strong>{value ?? "-"}</strong>
			<small>{suffix}</small>
		</div>
	);
}

function TodayPanel({
	title,
	count,
	to,
	children,
}: PropsWithChildren<{ title: string; count: number; to: "/" | "/work" | "/ai-reports" | "/news" | "/health" }>) {
	return (
		<section className="today-panel">
			<div className="today-panel-header">
				<div>
					<h2>{title}</h2>
					<span>{count}\uAC74</span>
				</div>
				<Link className="inline-action" to={to}>
					\uBCF4\uAE30
				</Link>
			</div>
			<div className="compact-list">{children}</div>
		</section>
	);
}

function CompactLine({ title, meta }: { title: string; meta: string }) {
	return (
		<div className="compact-line">
			<strong>{title}</strong>
			<span>{meta}</span>
		</div>
	);
}

function EmptyBoard({ label }: { label: string }) {
	return (
		<div className="empty-state">
			<strong>{label}</strong>
			<span>\uC218\uC2E0 \uB610\uB294 \uAE30\uB85D \uD6C4 \uC774\uACF3\uC5D0 \uD45C\uC2DC\uB429\uB2C8\uB2E4.</span>
		</div>
	);
}

function average(values?: Array<number | undefined>) {
	const actual = (values ?? []).filter((value): value is number => typeof value === "number");
	if (actual.length === 0) {
		return 0;
	}
	return actual.reduce((total, value) => total + value, 0) / actual.length;
}

function sum(values?: Array<number | undefined>) {
	return (values ?? []).reduce<number>((total, value) => total + (value ?? 0), 0);
}

function SettingsPage() {
	const health = useQuery({
		queryKey: ["health"],
		queryFn: rpcClient.getHealth,
	});

	return (
		<PageFrame title={text.settings} eyebrow="\uB85C\uCEEC \uAD6C\uC131">
			<div className="settings-panel">
				<div>
					<h2>RPC \uD074\uB77C\uC774\uC5B8\uD2B8</h2>
					<p>
						{health.data?.ok
							? "\uB85C\uCEEC \uC5F0\uACB0\uC774 \uC815\uC0C1 \uC751\uB2F5 \uC911\uC785\uB2C8\uB2E4."
							: "\uB85C\uCEEC \uC5F0\uACB0\uC744 \uD655\uC778\uD558\uB294 \uC911\uC785\uB2C8\uB2E4."}
					</p>
				</div>
				<span>{health.data?.checkedAt ?? "\uD655\uC778 \uC911"}</span>
			</div>
		</PageFrame>
	);
}

function PageFrame({
	eyebrow,
	title,
	children,
}: PropsWithChildren<{ eyebrow: string; title: string }>) {
	return (
		<section className="page-frame">
			<p className="app-eyebrow">{eyebrow}</p>
			<h1>{title}</h1>
			{children}
		</section>
	);
}

function WidgetSlot({ title, value }: { title: string; value: string }) {
	return (
		<section className="widget-slot">
			<p>{title}</p>
			<strong>{value}</strong>
		</section>
	);
}
