import { enabledConnectors } from "@all-for-one/connectors";
import type { AiReport, DailyLog, HealthConnectDailySummary, HealthEntry, LlmProvider, LlmProviderId, LlmRun, Memo, PersonalSchedule, WorkItem } from "@all-for-one/shared";
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
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	Download,
	FileText,
	Globe2,
	HeartPulse,
	Inbox,
	LayoutDashboard,
	LogOut,
	MapPin,
	Mic,
	MicOff,
	Newspaper,
	NotebookPen,
	Settings,
	Volume2,
	VolumeX,
} from "lucide-react";
import { useEffect, useState, type PropsWithChildren, type ReactNode } from "react";
import { clearAuthSession, getAuthSession, useAuthGuard } from "./auth";
import { rpcClient } from "./lib/rpcClient";
import { useSpeechInput, useSpeechOutput } from "./lib/speech";
import { LoginPage } from "./screens/LoginPage";
import { SiteDetailPage, SitesPage } from "./screens/SitesPage";

const text = {
	today: "오늘",
	dashboard: "대시보드",
	life: "일상 기록",
	health: "건강",
	schedule: "스케줄",
	aiReports: "AI 업무보고",
	aiControl: "컨트롤 타워",
	memos: "메모",
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
	component: AiControlPage,
});

const todayRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/today",
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

const personalScheduleRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/schedule",
	component: PersonalSchedulePage,
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

const memosRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/memos",
	component: MemosPage,
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
		todayRoute,
		dashboardRoute,
		lifeRoute,
		healthRoute,
		personalScheduleRoute,
		aiReportsRoute,
		aiControlRoute,
		memosRoute,
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
					<NavLink to="/" icon={<BrainCircuit size={18} />} label={text.aiControl} />
					<NavLink to="/today" icon={<LayoutDashboard size={18} />} label={text.today} />
					<NavLink to="/life" icon={<NotebookPen size={18} />} label={text.life} />
					<NavLink to="/health" icon={<HeartPulse size={18} />} label={text.health} />
					<NavLink to="/schedule" icon={<CalendarDays size={18} />} label={text.schedule} />
					<NavLink to="/ai-reports" icon={<Bot size={18} />} label={text.aiReports} />
					<NavLink to="/memos" icon={<FileText size={18} />} label={text.memos} />
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
				<MobileAccountBar email={session?.email ?? text.localUser} />
				<Outlet />
			</main>
			<InstallAppButton />
		</div>
	);
}

function MobileAccountBar({ email }: { email: string }) {
	return (
		<div className="mobile-account-bar">
			<div>
				<strong>All For One</strong>
				<span>{email}</span>
			</div>
			<div className="mobile-account-actions">
				<Link to="/settings" aria-label="설정">
					<Settings aria-hidden="true" size={17} />
				</Link>
				<button
					type="button"
					aria-label={text.logout}
					onClick={() => {
						clearAuthSession();
						globalThis.location.assign("/login");
					}}
				>
					<LogOut aria-hidden="true" size={17} />
				</button>
			</div>
		</div>
	);
}

type BeforeInstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function InstallAppButton() {
	const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent>();
	const [isStandalone, setIsStandalone] = useState(false);
	const [showIosHint, setShowIosHint] = useState(false);

	useEffect(() => {
		const standalone =
			window.matchMedia("(display-mode: standalone)").matches ||
			("standalone" in navigator && Boolean(navigator.standalone));
		setIsStandalone(standalone);

		const handlePrompt = (event: Event) => {
			event.preventDefault();
			setInstallPrompt(event as BeforeInstallPromptEvent);
		};
		window.addEventListener("beforeinstallprompt", handlePrompt);
		return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
	}, []);

	if (isStandalone) {
		return null;
	}

	const install = async () => {
		if (!installPrompt) {
			setShowIosHint((value) => !value);
			return;
		}

		await installPrompt.prompt();
		const choice = await installPrompt.userChoice;
		if (choice.outcome === "accepted") {
			setInstallPrompt(undefined);
			setIsStandalone(true);
		}
	};

	return (
		<div className="install-app">
			<button type="button" onClick={install}>
				<Download aria-hidden="true" size={16} />
				<span>앱 설치</span>
			</button>
			{showIosHint ? (
				<p>
					iPhone은 Safari 공유 버튼에서 <strong>홈 화면에 추가</strong>를 선택하세요.
				</p>
			) : null}
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
		| "/today"
		| "/dashboard"
		| "/life"
		| "/health"
		| "/schedule"
		| "/ai-control"
		| "/ai-reports"
		| "/memos"
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
	const sleepHours =
		data?.healthEntry?.sleepHours ??
		data?.dailyLog?.sleepHours ??
		(typeof data?.healthConnectSummary?.sleepMinutes === "number"
			? Math.round((data.healthConnectSummary.sleepMinutes / 60) * 10) / 10
			: undefined);

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
					<ScoreCard label="수면" value={sleepHours} suffix="시간" />
					<ScoreCard label="집중" value={data?.dailyLog?.focus} suffix="/10" />
				</div>
			</div>
			<div className="today-grid">
				<TodayPanel title="미처리 작업" count={data?.openWorkItems.length ?? 0} to="/work">
					{data?.openWorkItems.slice(0, 4).map((item) => (
						<CompactLine key={item.id} title={item.title} meta={item.deviceName} />
					))}
				</TodayPanel>
				<TodayPanel title="오늘 스케줄" count={data?.schedules.length ?? 0} to="/schedule">
					{data?.schedules.slice(0, 4).map((schedule) => (
						<CompactLine
							key={schedule.id}
							title={schedule.title}
							meta={`${formatTime(schedule.startAt)} - ${formatTime(schedule.endAt)}`}
						/>
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
					<HealthCompactLine health={data?.healthEntry} summary={data?.healthConnectSummary} />
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

function PersonalSchedulePage() {
	const today = new Date();
	const dateValue = toLocalDateInputValue(today);
	const [title, setTitle] = useState("");
	const [date, setDate] = useState(dateValue);
	const [startTime, setStartTime] = useState("09:00");
	const [fixedSchedule, setFixedSchedule] = useState(false);
	const [repeatType, setRepeatType] = useState<"daily" | "weekly" | "monthly">("weekly");
	const [repeatCount, setRepeatCount] = useState(4);
	const [calendarMonth, setCalendarMonth] = useState(
		() => new Date(today.getFullYear(), today.getMonth(), 1),
	);
	const [location, setLocation] = useState("");
	const [note, setNote] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const titleSpeech = useSpeechInput((text) =>
		setTitle((current) => [current, text].filter(Boolean).join(" ")),
	);
	const noteSpeech = useSpeechInput((text) =>
		setNote((current) => [current, text].filter(Boolean).join("\n")),
	);
	const schedules = useQuery({
		queryKey: ["personal-schedules"],
		queryFn: rpcClient.getPersonalSchedules,
	});
	const items = schedules.data ?? [];
	const todayItems = items.filter((item) => item.startAt.slice(0, 10) === dateValue);
	const fixedItems = items.filter(isFixedSchedule);
	const oneTimeItems = items.filter((item) => !isFixedSchedule(item));
	const calendarDays = buildScheduleCalendar(calendarMonth, items);
	const selectedDateItems = items.filter((item) => item.startAt.slice(0, 10) === date);

	const save = async () => {
		if (!title.trim()) {
			return;
		}
		setIsSaving(true);
		try {
			const startAt = new Date(`${date}T${startTime}:00`);
			const occurrences = fixedSchedule
				? createFixedScheduleStarts(startAt, repeatType, repeatCount)
				: [startAt];
			await Promise.all(
				occurrences.map((occurrence) => {
					const endAt = new Date(occurrence.getTime() + 30 * 60 * 1000);
					return rpcClient.createPersonalSchedule({
						title: title.trim(),
						startAt: occurrence.toISOString(),
						endAt: endAt.toISOString(),
						location: location.trim() || undefined,
						note: note.trim() || undefined,
						tags: fixedSchedule ? ["fixed", `repeat:${repeatType}`] : undefined,
					});
				}),
			);
			setTitle("");
			setLocation("");
			setNote("");
			await schedules.refetch();
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<PageFrame title={text.schedule} eyebrow="개인 일정 관리">
			<div className="schedule-shell">
				<section className="schedule-compose">
					<div>
						<p className="app-eyebrow">빠른 추가</p>
						<h2>일정을 바로 기록</h2>
					</div>
					<div className="voice-field">
						<input
							value={title}
							onChange={(event) => setTitle(event.target.value)}
							placeholder="예: 명승 정산 확인"
						/>
						<SpeechButton label="일정 제목 음성입력" speech={titleSpeech} />
					</div>
					<div className="schedule-form-grid">
						<label>
							<span>날짜</span>
							<input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
						</label>
						<label>
							<span>시작</span>
							<input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
						</label>
					</div>
					<div className="schedule-kind-picker" aria-label="스케줄 유형">
						<button
							type="button"
							aria-pressed={!fixedSchedule}
							onClick={() => setFixedSchedule(false)}
						>
							<span>추가 스케줄</span>
							<small>한 번만 등록</small>
						</button>
						<button
							type="button"
							aria-pressed={fixedSchedule}
							onClick={() => setFixedSchedule(true)}
						>
							<span>고정 스케줄</span>
							<small>반복 자동 등록</small>
						</button>
					</div>
					<div className="fixed-schedule-fields" data-active={fixedSchedule}>
						<div className="schedule-form-grid">
							<label>
								<span>반복</span>
								<select
									value={repeatType}
									onChange={(event) =>
										setRepeatType(event.target.value as "daily" | "weekly" | "monthly")
									}
								>
									<option value="daily">매일</option>
									<option value="weekly">매주</option>
									<option value="monthly">매월</option>
								</select>
							</label>
							<label>
								<span>횟수</span>
								<input
									type="number"
									min={2}
									max={52}
									value={repeatCount}
									onChange={(event) => setRepeatCount(Number(event.target.value))}
								/>
							</label>
						</div>
						<p>고정 스케줄은 달력과 목록에서 녹색으로 표시됩니다.</p>
					</div>
					<input
						value={location}
						onChange={(event) => setLocation(event.target.value)}
						placeholder="장소 또는 관련 사이트"
					/>
					<div className="voice-field voice-field-textarea">
						<textarea
							value={note}
							onChange={(event) => setNote(event.target.value)}
							placeholder="메모"
						/>
						<SpeechButton label="일정 메모 음성입력" speech={noteSpeech} />
					</div>
					<button className="schedule-save-button" type="button" onClick={save} disabled={isSaving}>
						{isSaving ? "저장 중" : "일정 저장"}
					</button>
				</section>
				<section className="schedule-list-panel">
					<div className="board-toolbar schedule-summary">
						<div>
							<strong>{todayItems.length}</strong>
							<span>오늘</span>
						</div>
						<div>
							<strong>{oneTimeItems.length}</strong>
							<span>추가</span>
						</div>
						<div>
							<strong>{fixedItems.length}</strong>
							<span>고정</span>
						</div>
						<div>
							<strong>{items.length}</strong>
							<span>전체</span>
						</div>
					</div>
					<section className="schedule-calendar-panel" aria-label="월간 스케줄 달력">
						<div className="calendar-head">
							<div>
								<p>월간 보기</p>
								<strong>{formatCalendarMonth(calendarMonth)}</strong>
							</div>
							<div>
								<button
									type="button"
									aria-label="이전 달"
									onClick={() => setCalendarMonth((month) => addCalendarMonths(month, -1))}
								>
									<ChevronLeft aria-hidden="true" size={17} />
								</button>
								<button
									type="button"
									aria-label="다음 달"
									onClick={() => setCalendarMonth((month) => addCalendarMonths(month, 1))}
								>
									<ChevronRight aria-hidden="true" size={17} />
								</button>
							</div>
						</div>
						<div className="calendar-weekdays" aria-hidden="true">
							<span>일</span>
							<span>월</span>
							<span>화</span>
							<span>수</span>
							<span>목</span>
							<span>금</span>
							<span>토</span>
						</div>
						<div className="calendar-grid">
							{calendarDays.map((day) => (
								<button
									type="button"
									key={day.iso}
									className="calendar-day"
									data-current-month={day.isCurrentMonth}
									data-selected={day.iso === date}
									data-today={day.iso === dateValue}
									onClick={() => setDate(day.iso)}
								>
									<strong>{day.date.getDate()}</strong>
									<div>
										{day.fixedCount ? <span className="calendar-dot fixed" /> : null}
										{day.oneTimeCount ? <span className="calendar-dot one-time" /> : null}
									</div>
									{day.total ? <small>{day.total}</small> : null}
								</button>
							))}
						</div>
						<div className="schedule-legend">
							<span><i data-kind="fixed" />고정 스케줄</span>
							<span><i data-kind="one-time" />추가 스케줄</span>
						</div>
					</section>
					<section className="selected-schedule-strip">
						<div>
							<p>선택 날짜</p>
							<strong>{date}</strong>
						</div>
						<span>{selectedDateItems.length}건</span>
					</section>
					<div className="schedule-list">
						{items.length ? (
							items.map((item) => <ScheduleCard item={item} key={item.id} />)
						) : (
							<div className="direct-empty">아직 등록된 개인 일정이 없습니다.</div>
						)}
					</div>
				</section>
			</div>
		</PageFrame>
	);
}

function ScheduleCard({ item }: { item: PersonalSchedule }) {
	const isFixed = isFixedSchedule(item);
	return (
		<article className="schedule-card" data-kind={isFixed ? "fixed" : "one-time"} data-status={item.status}>
			<div className="schedule-date-badge">
				<strong>{new Date(item.startAt).getDate()}</strong>
				<span>{new Date(item.startAt).toLocaleDateString(undefined, { month: "short" })}</span>
			</div>
			<div>
				<p>{formatTime(item.startAt)}</p>
				<h3>{item.title}</h3>
				<span>{item.location ?? item.note ?? "메모 없음"}</span>
			</div>
			<small>{isFixed ? "고정" : "추가"}</small>
		</article>
	);
}

function isFixedSchedule(item: PersonalSchedule) {
	return item.tags?.some((tag) => tag === "fixed") ?? false;
}

function createFixedScheduleStarts(
	startAt: Date,
	repeatType: "daily" | "weekly" | "monthly",
	count: number,
) {
	const safeCount = Math.min(Math.max(Math.trunc(count) || 2, 2), 52);
	return Array.from({ length: safeCount }, (_, index) => {
		const next = new Date(startAt);
		if (repeatType === "daily") {
			next.setDate(startAt.getDate() + index);
		}
		if (repeatType === "weekly") {
			next.setDate(startAt.getDate() + index * 7);
		}
		if (repeatType === "monthly") {
			next.setMonth(startAt.getMonth() + index);
		}
		return next;
	});
}

function buildScheduleCalendar(month: Date, items: PersonalSchedule[]) {
	const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
	const gridStart = new Date(firstDay);
	gridStart.setDate(firstDay.getDate() - firstDay.getDay());

	return Array.from({ length: 42 }, (_, index) => {
		const date = new Date(gridStart);
		date.setDate(gridStart.getDate() + index);
		const iso = toLocalDateInputValue(date);
		const dayItems = items.filter((item) => item.startAt.slice(0, 10) === iso);
		const fixedCount = dayItems.filter(isFixedSchedule).length;
		const oneTimeCount = dayItems.length - fixedCount;

		return {
			date,
			fixedCount,
			isCurrentMonth: date.getMonth() === month.getMonth(),
			iso,
			oneTimeCount,
			total: dayItems.length,
		};
	});
}

function addCalendarMonths(month: Date, amount: number) {
	return new Date(month.getFullYear(), month.getMonth() + amount, 1);
}

function formatCalendarMonth(month: Date) {
	return month.toLocaleDateString("ko-KR", { year: "numeric", month: "long" });
}

function toLocalDateInputValue(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

const scheduleStatusLabel: Record<PersonalSchedule["status"], string> = {
	planned: "예정",
	done: "완료",
	cancelled: "취소",
};

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
	const [showHistory, setShowHistory] = useState(false);
	const [locationRegion, setLocationRegion] = useState(() =>
		typeof window === "undefined" ? "" : (window.localStorage.getItem("afo-location-region") ?? ""),
	);
	const [locationStatus, setLocationStatus] = useState("");
	const [lastRun, setLastRun] = useState<LlmRun>();
	const [isRunning, setIsRunning] = useState(false);
	const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(true);
	const speechOutput = useSpeechOutput();
	const messageSpeech = useSpeechInput((text) => {
		setVoiceReplyEnabled(true);
		setMessage((current) => [current, text].filter(Boolean).join("\n"));
	});
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
				context: locationRegion.trim()
					? {
							region: locationRegion.trim(),
							timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
							availableActions: controlTowerActions,
						}
					: {
							timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
							availableActions: controlTowerActions,
						},
			};
			const result =
				mode === "summarize"
					? await rpcClient.runLlmSummary(input)
					: mode === "command_preview"
						? await rpcClient.runLlmCommandPreview(input)
						: await rpcClient.runLlmChat(input);
			setLastRun(result);
			if (voiceReplyEnabled) {
				speechOutput.speak(result.response);
			}
			await history.refetch();
		} finally {
			setIsRunning(false);
		}
	};

	const updateLocationRegion = (value: string) => {
		setLocationRegion(value);
		window.localStorage.setItem("afo-location-region", value);
	};

	const detectLocation = () => {
		if (!navigator.geolocation) {
			setLocationStatus("브라우저 위치 권한을 지원하지 않습니다.");
			return;
		}

		setLocationStatus("현재 위치 확인 중");
		navigator.geolocation.getCurrentPosition(
			async (position) => {
				const { latitude, longitude } = position.coords;
				try {
					setLocationStatus("지역 확인 중");
					const result = await rpcClient.reverseGeocode(latitude, longitude);
					updateLocationRegion(result.region || result.displayName || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
					setLocationStatus("GPS 기반 위치 적용됨");
				} catch {
					updateLocationRegion(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
					setLocationStatus("지역 변환 실패, 좌표만 저장됨");
				}
			},
			() => {
				setLocationStatus("위치 권한이 거부되었습니다.");
			},
			{ enableHighAccuracy: false, maximumAge: 10 * 60 * 1000, timeout: 8000 },
		);
	};

	return (
		<PageFrame title={text.aiControl} eyebrow="All For One">
			<div className="control-tower">
				<section className="control-search-panel">
					<div className="llm-ambient" aria-hidden="true" />
					<div className="control-search-head">
						<strong>무엇을 처리할까요?</strong>
						<span>검색하듯 요청하면 연결된 기능과 데이터를 기준으로 처리합니다.</span>
					</div>
					<div className="control-searchbar voice-field voice-field-textarea">
						<textarea
							value={message}
							onChange={(event) => setMessage(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Enter" && !event.shiftKey) {
									event.preventDefault();
									void run();
								}
							}}
							placeholder="예: 오늘 날씨 기준으로 일정 정리해줘 / 뉴스 PDF 요약해줘 / 명승 리드 확인해줘"
						/>
						<div className="control-input-actions">
							<SpeechButton label="AI 관제실 음성입력" speech={messageSpeech} />
							<button className="llm-run-button" type="button" disabled={isRunning} onClick={run}>
								{isRunning ? "처리 중" : "실행"}
							</button>
						</div>
					</div>
					<div className="control-options">
						<div className="control-region">
							<span>지역</span>
							<div className="control-region-field">
								<input
									value={locationRegion}
									onChange={(event) => updateLocationRegion(event.target.value)}
									placeholder="GPS로 자동 설정"
								/>
								<button type="button" onClick={detectLocation}>
									<MapPin aria-hidden="true" size={15} />
									GPS
								</button>
							</div>
							{locationStatus ? <small>{locationStatus}</small> : null}
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
								명령
							</button>
						</div>
					</div>
					<div className="control-model-strip">
						{providers.data?.map((provider) => (
							<ProviderCard
								key={provider.id}
								provider={provider}
								selected={selectedProvider === provider.id}
								onSelect={() => setSelectedProvider(provider.id)}
							/>
						))}
					</div>
					<div className="control-actions">
						<button
							type="button"
							aria-pressed={voiceReplyEnabled}
							disabled={!speechOutput.isSupported}
							onClick={() => {
								if (speechOutput.isSpeaking) {
									speechOutput.stop();
								}
								setVoiceReplyEnabled((value) => !value);
							}}
							title={speechOutput.isSupported ? "AI 답변을 음성으로 읽습니다." : "이 브라우저는 음성 답변을 지원하지 않습니다."}
						>
							{voiceReplyEnabled ? <Volume2 aria-hidden="true" size={16} /> : <VolumeX aria-hidden="true" size={16} />}
							{voiceReplyEnabled ? "음성 답변" : "음성 꺼짐"}
						</button>
						<button type="button" onClick={() => setShowHistory((value) => !value)}>
							{showHistory ? "닫기" : "최근 질문"}
						</button>
					</div>
					{lastRun ? (
						<LlmRunCard
							run={lastRun}
							featured
							isSpeaking={speechOutput.isSpeaking}
							onSpeak={() => speechOutput.speak(lastRun.response)}
							onStop={speechOutput.stop}
							speechSupported={speechOutput.isSupported}
						/>
					) : null}
					{showHistory ? (
						<section className="llm-history-drawer">
							{history.data?.length ? (
								history.data.map((run) => (
									<button
										className="history-load-card"
										key={run.id}
										onClick={() => setMessage(run.prompt)}
										type="button"
									>
										<strong>{run.prompt}</strong>
										<span>{new Date(run.createdAt).toLocaleString()}</span>
									</button>
								))
							) : (
								<div className="direct-empty">아직 불러올 질문이 없습니다.</div>
							)}
						</section>
					) : null}
				</section>
			</div>
		</PageFrame>
	);
}

const controlTowerActions = [
	"관리 사이트 read API 조회",
	"메모 요약",
	"오늘/스케줄/건강 기록 조회",
	"AI 업무보고 조회",
	"작업함 항목 정리 초안",
	"write/admin 작업은 실행 전 확인 요청",
];

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
			<strong>{provider.model}</strong>
			{provider.status === "ready" ? null : (
				<em>{provider.status === "needs_key" ? "키 필요" : "준비중"}</em>
			)}
		</button>
	);
}

function SpeechButton({
	label,
	speech,
}: {
	label: string;
	speech: ReturnType<typeof useSpeechInput>;
}) {
	const disabled = !speech.isSupported;
	return (
		<button
			aria-label={disabled ? "이 브라우저는 음성입력을 지원하지 않습니다." : label}
			className="speech-button"
			data-listening={speech.isListening}
			disabled={disabled}
			onClick={speech.isListening ? speech.stop : speech.start}
			title={disabled ? "이 브라우저는 음성입력을 지원하지 않습니다." : label}
			type="button"
		>
			{speech.isListening ? <MicOff aria-hidden="true" size={18} /> : <Mic aria-hidden="true" size={18} />}
			<span>{speech.isListening ? "듣는 중" : "음성"}</span>
		</button>
	);
}

function LlmRunCard({
	featured,
	isSpeaking,
	onSpeak,
	onStop,
	run,
	speechSupported,
}: {
	featured?: boolean;
	isSpeaking?: boolean;
	onSpeak?: () => void;
	onStop?: () => void;
	run: LlmRun;
	speechSupported?: boolean;
}) {
	return (
		<article className={featured ? "llm-run-card featured" : "llm-run-card"}>
			<div>
				<p>
					{run.provider} · {run.model} · {run.status}
				</p>
				<h3>{run.prompt}</h3>
			</div>
			<span>{run.response}</span>
			{onSpeak ? (
				<button
					className="llm-speak-button"
					type="button"
					disabled={!speechSupported}
					onClick={isSpeaking ? onStop : onSpeak}
				>
					{isSpeaking ? <VolumeX aria-hidden="true" size={15} /> : <Volume2 aria-hidden="true" size={15} />}
					{isSpeaking ? "읽기 중지" : "답변 읽기"}
				</button>
			) : null}
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

function MemosPage() {
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [file, setFile] = useState<File>();
	const [isSaving, setIsSaving] = useState(false);
	const [ocrStatus, setOcrStatus] = useState("");
	const memos = useQuery({
		queryKey: ["memos"],
		queryFn: rpcClient.getMemos,
	});

	const save = async () => {
		if (!title.trim() && !file) {
			return;
		}
		setIsSaving(true);
		try {
			const fileBase64 = file ? await readFileAsBase64(file) : undefined;
			const extractedText = file ? await extractMemoText(file, setOcrStatus) : undefined;
			await rpcClient.createMemo({
				title: title.trim() || file?.name || "새 메모",
				content: content.trim() || undefined,
				fileName: file?.name,
				mimeType: file?.type,
				fileBase64,
				ocrText: extractedText,
				tags: file ? ["upload"] : undefined,
			});
			setTitle("");
			setContent("");
			setFile(undefined);
			setOcrStatus("");
			await memos.refetch();
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<PageFrame title={text.memos} eyebrow="사진/PDF 메모">
			<div className="memo-shell">
				<section className="memo-compose">
					<div>
						<p className="app-eyebrow">빠른 저장</p>
						<h2>메모 또는 파일 추가</h2>
					</div>
					<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="제목" />
					<textarea
						value={content}
						onChange={(event) => setContent(event.target.value)}
						placeholder="내용을 직접 입력하거나 사진/PDF를 올리세요."
					/>
					<label className="memo-upload">
						<input
							type="file"
							accept="image/*,application/pdf,text/plain,text/markdown"
							onChange={(event) => setFile(event.target.files?.[0])}
						/>
						<span>{file ? file.name : "사진첩/파일 선택"}</span>
					</label>
					{ocrStatus ? <p className="memo-ocr-status">{ocrStatus}</p> : null}
					<button className="schedule-save-button" type="button" onClick={save} disabled={isSaving}>
						{isSaving ? "저장 중" : "메모 저장"}
					</button>
				</section>
				<section className="memo-list">
					{memos.data?.length ? (
						memos.data.map((memo) => <MemoCard item={memo} key={memo.id} onDone={() => memos.refetch()} />)
					) : (
						<div className="direct-empty">아직 저장된 메모가 없습니다.</div>
					)}
				</section>
			</div>
		</PageFrame>
	);
}

function MemoCard({ item, onDone }: { item: Memo; onDone: () => void }) {
	const [isSummarizing, setIsSummarizing] = useState(false);
	const canSummarize = Boolean(item.ocrText || item.content);

	const summarize = async () => {
		if (!canSummarize) {
			return;
		}
		setIsSummarizing(true);
		try {
			await rpcClient.summarizeMemo(item.id);
			onDone();
		} finally {
			setIsSummarizing(false);
		}
	};

	return (
		<article className="memo-card">
			<div>
				<strong>{item.title}</strong>
				<span>
					{item.fileName ?? "텍스트 메모"} · {memoOcrLabel[item.ocrStatus]}
				</span>
			</div>
			<p>{item.summary ?? item.ocrText ?? item.content ?? "OCR 처리가 필요한 파일입니다."}</p>
			<button type="button" disabled={!canSummarize || isSummarizing} onClick={summarize}>
				{isSummarizing ? "요약 중" : "LLM 요약"}
			</button>
		</article>
	);
}

const memoOcrLabel: Record<Memo["ocrStatus"], string> = {
	none: "텍스트 없음",
	pending: "OCR 대기",
	completed: "텍스트 추출됨",
	failed: "OCR 실패",
};

function isTextLikeFile(file: File) {
	return file.type.startsWith("text/") || file.name.endsWith(".md");
}

function isImageFile(file: File) {
	return file.type.startsWith("image/");
}

async function extractMemoText(file: File, setStatus: (status: string) => void) {
	if (isTextLikeFile(file)) {
		setStatus("텍스트 읽는 중");
		return readFileAsText(file);
	}
	if (isImageFile(file)) {
		setStatus("이미지 OCR 준비 중");
		const { recognize } = await import("tesseract.js");
		const result = await recognize(file, "kor+eng", {
			logger: (message) => {
				if (message.status === "recognizing text") {
					setStatus(`OCR 진행 중 ${Math.round(message.progress * 100)}%`);
				}
			},
		});
		setStatus("OCR 완료");
		return result.data.text.trim();
	}
	if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
		setStatus("PDF OCR은 다음 단계에서 페이지 이미지 변환 후 처리됩니다.");
		return undefined;
	}
	return undefined;
}

function readFileAsBase64(file: File) {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}

function readFileAsText(file: File) {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result ?? ""));
		reader.onerror = () => reject(reader.error);
		reader.readAsText(file);
	});
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
}: PropsWithChildren<{ title: string; count: number; to: "/" | "/work" | "/ai-reports" | "/news" | "/health" | "/schedule" }>) {
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

function HealthCompactLine({
	health,
	summary,
}: {
	health?: HealthEntry;
	summary?: HealthConnectDailySummary;
}) {
	const exerciseMinutes = health?.exerciseMinutes ?? summary?.exerciseMinutes ?? 0;
	const steps = typeof summary?.steps === "number" ? `${summary.steps.toLocaleString()}보` : "걸음 없음";
	const stress = health?.stress ?? "-";
	const title = health?.symptoms ?? (summary ? "Health Connect 자동 기록" : "오늘 건강 기록");

	return (
		<CompactLine
			title={title}
			meta={`스트레스 ${stress} / 운동 ${exerciseMinutes}분 / ${steps}`}
		/>
	);
}

function humanText(value: string) {
	return value.replace(/\\u([0-9a-fA-F]{4})/g, (_, code: string) =>
		String.fromCharCode(Number.parseInt(code, 16)),
	);
}

function formatTime(value: string) {
	return new Date(value).toLocaleTimeString(undefined, {
		hour: "2-digit",
		minute: "2-digit",
	});
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
	const { session } = useAuthGuard();

	return (
		<PageFrame title={text.settings} eyebrow="계정 및 앱 관리">
			<div className="settings-grid">
				<section className="settings-panel">
					<div>
						<h2>계정</h2>
						<p>{session?.email ?? text.localUser}</p>
					</div>
					<button
						className="settings-action"
						type="button"
						onClick={() => {
							clearAuthSession();
							globalThis.location.assign("/login");
						}}
					>
						로그아웃
					</button>
				</section>
				<section className="settings-panel">
					<div>
						<h2>개인정보</h2>
						<p>현재는 로컬 세션 기반입니다. Cloudflare Access 프로필 연동 후 이름/알림 설정을 확장합니다.</p>
					</div>
					<span>준비 중</span>
				</section>
				<section className="settings-panel">
					<div>
						<h2>관리 사이트</h2>
						<p>등록된 사이트, 원본 관리자, 직접 API 연결 상태를 확인합니다.</p>
					</div>
					<Link className="settings-action" to="/sites">
						열기
					</Link>
				</section>
				<section className="settings-panel">
					<div>
						<h2>연동 관리</h2>
						<p>서비스 토큰, 커넥터, 외부 API 연결 상태를 정리합니다.</p>
					</div>
					<Link className="settings-action" to="/connectors">
						열기
					</Link>
				</section>
				<section className="settings-panel">
					<div>
						<h2>API 연결</h2>
						<p>
							{health.data?.ok
								? "All For One API가 정상 응답 중입니다."
								: "API 연결을 확인하는 중입니다."}
						</p>
					</div>
					<span>{health.data?.checkedAt ?? "확인 중"}</span>
				</section>
				<section className="settings-panel">
					<div>
						<h2>앱 정보</h2>
						<p>설치형 웹앱, Health Connect, GPS 지역 기능을 순차적으로 확장 중입니다.</p>
					</div>
					<span>PWA</span>
				</section>
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

