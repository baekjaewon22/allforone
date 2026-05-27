import { enabledConnectors } from "@all-for-one/connectors";
import type { AiReport, DailyLog, HealthEntry, LlmProvider, LlmProviderId, LlmRun, WorkItem } from "@all-for-one/shared";
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
	BrainCircuit,
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
import { useState, type PropsWithChildren, type ReactNode } from "react";
import { clearAuthSession, getAuthSession, useAuthGuard } from "./auth";
import { rpcClient } from "./lib/rpcClient";
import { LoginPage } from "./screens/LoginPage";
import { SiteDetailPage, SitesPage } from "./screens/SitesPage";

const text = {
	today: "오늘",
	dashboard: "대시보드",
	life: "일상 기록",
	health: "건강",
	aiReports: "AI 업무보고",
	aiControl: "AI 관제실",
	connectors: "연동 관리",
	sites: "관리 사이트",
	work: "작업함",
	todayNews: "오늘의 뉴스",
	settings: "설정",
	logout: "로그아웃",
	localUser: "로컬 사용자",
};

const statusLabel: Record<string, string> = {
	ready: "준비됨",
	needs_auth: "인증 필요",
	offline: "오프라인",
	new: "신규",
	reviewed: "확인됨",
	archived: "보관됨",
	received: "수신됨",
	needs_review: "검토 필요",
	applied: "반영됨",
	on_hold: "보류",
	discarded: "폐기",
};

const kindLabel: Record<string, string> = {
	file: "파일",
	note: "메모",
	task: "작업",
	snapshot: "스냅샷",
	link: "링크",
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

const aiControlRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/ai-control",
	component: AiControlPage,
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
		aiControlRoute,
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
				<nav className="nav-list" aria-label="주요 메뉴">
					<NavLink to="/" icon={<LayoutDashboard size={18} />} label={text.today} />
					<NavLink to="/life" icon={<NotebookPen size={18} />} label={text.life} />
					<NavLink to="/health" icon={<HeartPulse size={18} />} label={text.health} />
					<NavLink to="/ai-control" icon={<BrainCircuit size={18} />} label={text.aiControl} />
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
		| "/ai-control"
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
		<PageFrame title={text.today} eyebrow="개인 운영 센터">
			<div className="today-hero">
				<div>
					<p className="app-eyebrow">{data?.date ?? new Date().toISOString().slice(0, 10)}</p>
					<h2>{data?.dailyLog?.summary ?? "오늘의 기록이 아직 없습니다."}</h2>
					<span>
						{data?.dailyLog?.tomorrow ??
							"일상, 건강, AI 업무보고를 이 화면에서 한번에 확인합니다."}
					</span>
				</div>
				<div className="today-score-grid">
					<ScoreCard label="컨디션" value={data?.healthEntry?.condition ?? data?.dailyLog?.condition} suffix="/10" />
					<ScoreCard label="수면" value={data?.healthEntry?.sleepHours ?? data?.dailyLog?.sleepHours} suffix="시간" />
					<ScoreCard label="집중" value={data?.dailyLog?.focus} suffix="/10" />
				</div>
			</div>
			<div className="today-grid">
				<TodayPanel title="미처리 작업" count={data?.openWorkItems.length ?? 0} to="/work">
					{data?.openWorkItems.slice(0, 4).map((item) => (
						<CompactLine key={item.id} title={item.title} meta={item.deviceName} />
					))}
				</TodayPanel>
				<TodayPanel title="AI 업무보고" count={data?.aiReports.length ?? 0} to="/ai-reports">
					{data?.aiReports.slice(0, 4).map((report) => (
						<CompactLine key={report.id} title={report.taskTitle} meta={report.provider} />
					))}
				</TodayPanel>
				<TodayPanel title="오늘의 뉴스" count={data?.todayNews.length ?? 0} to="/news">
					{data?.todayNews.slice(0, 4).map((item) => (
						<CompactLine key={item.id} title={item.title} meta={item.path ?? "PDF"} />
					))}
				</TodayPanel>
				<TodayPanel title="건강" count={data?.healthEntry ? 1 : 0} to="/health">
					<CompactLine
						title={data?.healthEntry?.symptoms ?? "오늘 건강 기록"}
						meta={`스트레스 ${data?.healthEntry?.stress ?? "-"} / 운동 ${data?.healthEntry?.exerciseMinutes ?? 0}분`}
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
		<PageFrame title={text.dashboard} eyebrow="업무 현황">
			<div className="widget-grid">
				<WidgetSlot title="오늘 일정" value={`${snapshot.data?.schedules.length ?? 0}건`} />
				<WidgetSlot title="주요 지표" value={`${snapshot.data?.metrics.length ?? 0}개`} />
				<WidgetSlot title="보고 요약" value={`${snapshot.data?.reports.length ?? 0}건`} />
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
		<PageFrame title={text.connectors} eyebrow="연결 상태">
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
		<PageFrame title={text.life} eyebrow="하루 기록">
			<div className="board-toolbar">
				<div>
					<strong>{logs.data?.length ?? 0}</strong>
					<span>저장된 기록</span>
				</div>
				<div>
					<strong>{average(logs.data?.map((item) => item.condition)).toFixed(1)}</strong>
					<span>평균 컨디션</span>
				</div>
				<div>
					<strong>{average(logs.data?.map((item) => item.focus)).toFixed(1)}</strong>
					<span>평균 집중도</span>
				</div>
			</div>
			<section className="board-panel">
				<div className="board-header board-header-life">
					<span>날짜</span>
					<span>요약</span>
					<span>컨디션</span>
					<span>내일</span>
				</div>
				{logs.data?.length ? (
					logs.data.map((log) => <DailyLogRow item={log} key={log.id} />)
				) : (
					<EmptyBoard label="아직 일상 기록이 없습니다." />
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
		<PageFrame title={text.health} eyebrow="컨디션 관리">
			<div className="board-toolbar">
				<div>
					<strong>{average(entries.data?.map((item) => item.sleepHours)).toFixed(1)}</strong>
					<span>평균 수면</span>
				</div>
				<div>
					<strong>{average(entries.data?.map((item) => item.condition)).toFixed(1)}</strong>
					<span>평균 컨디션</span>
				</div>
				<div>
					<strong>{sum(entries.data?.map((item) => item.exerciseMinutes))}</strong>
					<span>운동 분</span>
				</div>
			</div>
			<section className="board-panel">
				<div className="board-header board-header-health">
					<span>날짜</span>
					<span>수면/운동</span>
					<span>컨디션</span>
					<span>메모</span>
				</div>
				{entries.data?.length ? (
					entries.data.map((entry) => <HealthEntryRow item={entry} key={entry.id} />)
				) : (
					<EmptyBoard label="아직 건강 기록이 없습니다." />
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
		<PageFrame title={text.aiReports} eyebrow="AI 지시 결과">
			<div className="board-toolbar">
				<div>
					<strong>{reports.data?.length ?? 0}</strong>
					<span>수신 보고</span>
				</div>
				<div>
					<strong>{reports.data?.filter((item) => item.status === "needs_review").length ?? 0}</strong>
					<span>검토 필요</span>
				</div>
				<div>
					<strong>{reports.data?.filter((item) => item.status === "applied").length ?? 0}</strong>
					<span>반영됨</span>
				</div>
			</div>
			<section className="board-panel">
				<div className="board-header board-header-ai">
					<span>업무</span>
					<span>AI</span>
					<span>수신일</span>
					<span>상태</span>
				</div>
				{reports.data?.length ? (
					reports.data.map((report) => <AiReportRow item={report} key={report.id} />)
				) : (
					<EmptyBoard label="아직 AI 업무보고가 없습니다." />
				)}
			</section>
		</PageFrame>
	);
}

function AiControlPage() {
	const [message, setMessage] = useState("");
	const [mode, setMode] = useState<"chat" | "summarize" | "command_preview">("chat");
	const [selectedProvider, setSelectedProvider] = useState<LlmProviderId>("gemini");
	const [lastRun, setLastRun] = useState<LlmRun>();
	const [isRunning, setIsRunning] = useState(false);
	const providers = useQuery({
		queryKey: ["llm-providers"],
		queryFn: rpcClient.getLlmProviders,
	});
	const history = useQuery({
		queryKey: ["llm-history"],
		queryFn: rpcClient.getLlmHistory,
	});

	const run = async () => {
		if (!message.trim()) {
			return;
		}
		setIsRunning(true);
		try {
			const input = {
				provider: selectedProvider,
				message: message.trim(),
				intent: mode,
			};
			const result =
				mode === "summarize"
					? await rpcClient.runLlmSummary(input)
					: mode === "command_preview"
						? await rpcClient.runLlmCommandPreview(input)
						: await rpcClient.runLlmChat(input);
			setLastRun(result);
			await history.refetch();
		} finally {
			setIsRunning(false);
		}
	};

	return (
		<PageFrame title={text.aiControl} eyebrow="무료 우선 LLM Dispatcher">
			<div className="llm-layout">
				<section className="llm-compose">
					<div className="llm-notice">
						<strong>배포/모바일 실행 방식</strong>
						<span>
							Gemini와 OpenRouter는 Cloudflare Worker에서 호출하므로 핸드폰에서도 동작합니다.
							Ollama Local만 내 PC 전용입니다.
						</span>
					</div>
					<div className="llm-provider-grid">
						{providers.data?.map((provider) => (
							<ProviderCard
								key={provider.id}
								provider={provider}
								selected={selectedProvider === provider.id}
								onSelect={() => setSelectedProvider(provider.id)}
							/>
						))}
					</div>
					<div className="llm-mode-tabs">
						<button type="button" aria-pressed={mode === "chat"} onClick={() => setMode("chat")}>
							대화
						</button>
						<button type="button" aria-pressed={mode === "summarize"} onClick={() => setMode("summarize")}>
							요약
						</button>
						<button
							type="button"
							aria-pressed={mode === "command_preview"}
							onClick={() => setMode("command_preview")}
						>
							명령 초안
						</button>
					</div>
					<textarea
						value={message}
						onChange={(event) => setMessage(event.target.value)}
						placeholder="예: 오늘 받은 작업보고와 뉴스 PDF를 짧게 요약해줘."
					/>
					<button className="llm-run-button" type="button" disabled={isRunning} onClick={run}>
						{isRunning ? "실행 중" : "실행"}
					</button>
					{lastRun ? <LlmRunCard run={lastRun} featured /> : null}
				</section>
				<section className="llm-history">
					<div className="direct-section-title">
						<h2>최근 실행</h2>
						<span>Gemini 실패 시 OpenRouter가 자동으로 대신 실행됩니다.</span>
					</div>
					<div className="compact-list">
						{history.data?.length ? (
							history.data.map((run) => <LlmRunCard run={run} key={run.id} />)
						) : (
							<div className="direct-empty">아직 실행 기록이 없습니다.</div>
						)}
					</div>
				</section>
			</div>
		</PageFrame>
	);
}

function ProviderCard({
	onSelect,
	provider,
	selected,
}: {
	onSelect: () => void;
	provider: LlmProvider;
	selected: boolean;
}) {
	return (
		<button className="provider-card" type="button" data-selected={selected} onClick={onSelect}>
			<span>{provider.freeTier ? "무료 우선" : "유료"}</span>
			<strong>{provider.name}</strong>
			<small>{provider.model}</small>
			<small>{provider.description}</small>
			<em>{provider.status === "ready" ? "연결됨" : provider.status === "needs_key" ? "키 필요" : "준비중"}</em>
		</button>
	);
}

function LlmRunCard({ run, featured }: { run: LlmRun; featured?: boolean }) {
	return (
		<article className={featured ? "llm-run-card featured" : "llm-run-card"}>
			<div>
				<p>
					{run.provider} · {run.model} · {run.status}
				</p>
				<h3>{run.prompt}</h3>
			</div>
			<span>{run.response}</span>
			<small>{new Date(run.createdAt).toLocaleString()}</small>
		</article>
	);
}

function WorkInboxPage() {
	const intake = useQuery({
		queryKey: ["work-intake"],
		queryFn: rpcClient.getWorkIntakeSnapshot,
	});

	return (
		<PageFrame title={text.work} eyebrow="컴퓨터 작업 수신">
			<div className="site-overview">
				<div>
					<p>연결된 컴퓨터</p>
					<strong>{intake.data?.devices.length ?? 0}</strong>
				</div>
				<div>
					<p>신규 작업</p>
					<strong>{intake.data?.items.filter((item) => item.status === "new").length ?? 0}</strong>
				</div>
				<div>
					<p>수신 주소</p>
					<strong>/work/ingest</strong>
				</div>
				<div>
					<p>인증 헤더</p>
					<strong>X-AFO-Device-Key</strong>
				</div>
			</div>
			<div className="work-grid">
				<section className="site-section">
					<h2>연결된 컴퓨터</h2>
					<div className="site-section-list">
						{intake.data?.devices.map((device) => (
							<div className="site-row" key={device.id}>
								<div>
									<p>{device.platform ?? "플랫폼 없음"}</p>
									<h3>{device.name}</h3>
									<span>{device.hostname ?? device.id}</span>
								</div>
								<strong>{new Date(device.lastSeenAt).toLocaleString()}</strong>
							</div>
						))}
					</div>
				</section>
				<section className="site-section">
					<h2>최근 작업</h2>
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
		<PageFrame title={text.todayNews} eyebrow="PDF 게시판">
			<div className="board-toolbar">
				<div>
					<strong>{items.length}</strong>
					<span>수신된 PDF</span>
				</div>
				<div>
					<strong>31일</strong>
					<span>자동 보관 기간</span>
				</div>
				<div>
					<strong>/work/news/today</strong>
					<span>POST endpoint</span>
				</div>
			</div>
			<section className="board-panel">
				<div className="board-header">
					<span>제목</span>
					<span>파일</span>
					<span>수신일</span>
					<span>상태</span>
				</div>
				{items.length ? (
					items.map((item) => <TodayNewsRow item={item} key={item.id} />)
				) : (
					<div className="empty-state">
						<strong>아직 수신된 뉴스 PDF가 없습니다.</strong>
						<span>POST /work/news/today</span>
					</div>
				)}
			</section>
		</PageFrame>
	);
}

function TodayNewsRow({ item }: { item: WorkItem }) {
	const fileName = humanText(item.path ?? getStringMetadata(item, "filename") ?? "PDF");
	const hasInlineFile = Boolean(item.metadata?.inlineFileStored);

	return (
		<div className="board-row">
			<div>
				<h3>{humanText(item.title)}</h3>
				<p>{humanText(item.summary ?? "요약 없음")}</p>
			</div>
			<span>{fileName}</span>
			<span>{new Date(item.occurredAt).toLocaleString()}</span>
			<div className="board-actions">
				{item.url ? (
					<a className="inline-action" href={item.url} target="_blank" rel="noreferrer">
						열기
					</a>
				) : (
					<span className="pill">{hasInlineFile ? "저장됨" : "링크 없음"}</span>
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
				<h3>{humanText(item.summary ?? "요약 없음")}</h3>
				<p>{humanText(item.wins ?? item.blockers ?? "기록된 메모가 없습니다.")}</p>
			</div>
			<span>{item.condition ? `${item.condition}/10` : "-"}</span>
			<span>{humanText(item.tomorrow ?? "-")}</span>
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
				<h3>{humanText(item.symptoms ?? item.mealNote ?? "메모 없음")}</h3>
				<p>{humanText(item.medication ?? `스트레스 ${item.stress ?? "-"}/10`)}</p>
			</div>
		</div>
	);
}

function AiReportRow({ item }: { item: AiReport }) {
	return (
		<div className="board-row board-row-ai">
			<div>
				<h3>{humanText(item.taskTitle)}</h3>
				<p>{humanText(item.result)}</p>
			</div>
			<span>{humanText(item.provider)}</span>
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
					{humanText(item.deviceName)} · {kindLabel[item.kind] ?? item.kind}
				</p>
				<h3>{humanText(item.title)}</h3>
				<span>{humanText(item.summary ?? item.path ?? item.url ?? "상세 내용 없음")}</span>
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
			<span>{humanText(label)}</span>
			<strong>{value ?? "-"}</strong>
			<small>{humanText(suffix)}</small>
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
					<span>{count}건</span>
				</div>
				<Link className="inline-action" to={to}>
					보기
				</Link>
			</div>
			<div className="compact-list">{children}</div>
		</section>
	);
}

function CompactLine({ title, meta }: { title: string; meta: string }) {
	return (
		<div className="compact-line">
			<strong>{humanText(title)}</strong>
			<span>{humanText(meta)}</span>
		</div>
	);
}

function humanText(value: string) {
	return value.replace(/\\u([0-9a-fA-F]{4})/g, (_, code: string) =>
		String.fromCharCode(Number.parseInt(code, 16)),
	);
}

function EmptyBoard({ label }: { label: string }) {
	return (
		<div className="empty-state">
			<strong>{label}</strong>
			<span>수신 또는 기록 후 이곳에 표시됩니다.</span>
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
		<PageFrame title={text.settings} eyebrow="로컬 구성">
			<div className="settings-panel">
				<div>
					<h2>RPC 클라이언트</h2>
					<p>
						{health.data?.ok
							? "로컬 연결이 정상 응답 중입니다."
							: "로컬 연결을 확인하는 중입니다."}
					</p>
				</div>
				<span>{health.data?.checkedAt ?? "확인 중"}</span>
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

