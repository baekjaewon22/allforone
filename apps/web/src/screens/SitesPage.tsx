import type { SiteLiveAction, SiteLiveReadCard } from "@all-for-one/shared";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { rpcClient } from "../lib/rpcClient";

const ko = {
	adminFallback: "관리자",
	embeddedAdmin: "내장 관리자 화면",
	fullView: "전체보기",
	exitFullView: "전체보기 종료",
	loading: "불러오는 중",
	managedSite: "관리 사이트",
	managedTargets: "통합 관리 대상",
	open: "열기",
	directManage: "직접 관리",
	originalAdmin: "원본 관리자",
	readApi: "Read API",
	writeApi: "Write API",
	adminApi: "Admin API",
	todayWork: "오늘 처리",
	allData: "전체 데이터",
};

const statusLabel: Record<string, string> = {
	active: "활성",
	paused: "일시중지",
	archived: "보관됨",
};

const siteCardVisuals: Record<string, { className: string; label: string; previewUrl: string }> = {
	"my-auction-docs": {
		className: "site-preview-mydocs",
		label: "문서 관리",
		previewUrl: "https://my-docs.kr",
	},
	"landing-law": {
		className: "site-preview-law",
		label: "법무 관리",
		previewUrl: "https://lawitgo.com",
	},
};

function getSiteVisual(siteId: string) {
	return siteCardVisuals[siteId] ?? {
		className: "site-preview-default",
		label: "운영 관리",
		previewUrl: "",
	};
}

export function SitesPage() {
	const sites = useQuery({
		queryKey: ["managed-sites"],
		queryFn: rpcClient.getManagedSites,
	});

	return (
		<section className="page-frame">
			<p className="app-eyebrow">{ko.managedTargets}</p>
			<h1>{ko.managedSite}</h1>
			<div className="site-list site-card-grid">
				{sites.data?.map((site) => {
					const visual = getSiteVisual(site.id);

					return (
						<Link
							className="site-card"
							key={site.id}
							params={{ siteId: site.id }}
							to="/sites/$siteId"
						>
							<div className={`site-preview-panel ${visual.className}`}>
								{visual.previewUrl ? (
									<iframe
										aria-hidden="true"
										className="site-preview-frame"
										referrerPolicy="strict-origin-when-cross-origin"
										sandbox="allow-same-origin allow-scripts"
										src={visual.previewUrl}
										tabIndex={-1}
										title={`${site.name} preview`}
									/>
								) : null}
							</div>
							<div className="site-card-body">
								<div>
									<p>{statusLabel[site.status] ?? site.status}</p>
									<h2>{site.name}</h2>
									<span>{site.domain}</span>
								</div>
								<div className="site-card-footer">
									<small>{visual.label}</small>
									<strong>{ko.open}</strong>
								</div>
							</div>
						</Link>
					);
				})}
			</div>
		</section>
	);
}

export function SiteDetailPage({ siteId }: { siteId: string }) {
	const [embeddedUrl, setEmbeddedUrl] = useState<string>();
	const [isFullView, setIsFullView] = useState(false);
	const [mode, setMode] = useState<"direct" | "iframe">("direct");
	const embeddedRef = useRef<HTMLElement>(null);
	const detail = useQuery({
		queryKey: ["managed-site", siteId],
		queryFn: () => rpcClient.getManagedSiteDetail(siteId),
	});
	const live = useQuery({
		queryKey: ["managed-site-live-overview", siteId],
		queryFn: () => rpcClient.getManagedSiteLiveOverview(siteId),
	});
	const data = detail.data;
	const overview = live.data;
	const selectedLink =
		data?.adminLinks.find((link) => link.url === embeddedUrl) ??
		data?.adminLinks[0];

	useEffect(() => {
		setEmbeddedUrl(undefined);
		setMode("direct");
	}, [siteId]);

	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullView(document.fullscreenElement === embeddedRef.current);
		};

		document.addEventListener("fullscreenchange", handleFullscreenChange);
		return () => {
			document.removeEventListener("fullscreenchange", handleFullscreenChange);
		};
	}, []);

	if (!data) {
		return (
			<section className="page-frame">
				<p className="app-eyebrow">{ko.managedSite}</p>
				<h1>{ko.loading}</h1>
			</section>
		);
	}

	const toggleFullView = async () => {
		if (document.fullscreenElement) {
			await document.exitFullscreen();
			return;
		}

		await embeddedRef.current?.requestFullscreen();
	};

	const currentUrl = selectedLink?.url ?? data.site.domain;

	return (
		<section className="page-frame site-admin-frame">
			<div className="site-admin-header">
				<div>
					<p className="app-eyebrow">{ko.managedSite}</p>
					<h1>{data.site.name}</h1>
				</div>
				<span>{data.site.domain}</span>
			</div>
			<div className="site-mode-tabs">
				<button
					aria-pressed={mode === "direct"}
					onClick={() => setMode("direct")}
					type="button"
				>
					{ko.directManage}
				</button>
				<button
					aria-pressed={mode === "iframe"}
					onClick={() => setMode("iframe")}
					type="button"
				>
					{ko.originalAdmin}
				</button>
			</div>
			{mode === "direct" ? (
				<DirectManagePanel
					actions={overview?.actions ?? []}
					cards={overview?.readCards ?? []}
					message={overview?.message}
					status={overview?.status ?? "pending"}
					today={overview?.today ?? []}
					updatedAt={overview?.updatedAt}
				/>
			) : (
				<section className="embedded-admin" ref={embeddedRef}>
					<div className="embedded-toolbar">
						<div>
							<p className="app-eyebrow">{ko.embeddedAdmin}</p>
							<h2>{selectedLink?.label ?? data.site.name}</h2>
						</div>
						<div className="embedded-actions">
							<div className="embedded-switcher">
								{data.adminLinks.map((page) => (
									<button
										aria-pressed={currentUrl === page.url}
										key={page.id}
										onClick={() => setEmbeddedUrl(page.url)}
										type="button"
									>
										{page.label}
									</button>
								))}
							</div>
							<button
								className="full-view-button"
								onClick={toggleFullView}
								type="button"
							>
								{isFullView ? ko.exitFullView : ko.fullView}
							</button>
						</div>
					</div>
					<iframe
						className="embedded-frame"
						referrerPolicy="strict-origin-when-cross-origin"
						sandbox="allow-forms allow-same-origin allow-scripts allow-popups allow-downloads"
						src={currentUrl}
						title={`${data.site.name} ${selectedLink?.label ?? ko.adminFallback}`}
					/>
				</section>
			)}
		</section>
	);
}

function DirectManagePanel({
	actions,
	cards,
	message,
	status,
	today,
	updatedAt,
}: {
	actions: SiteLiveAction[];
	cards: SiteLiveReadCard[];
	message?: string;
	status: string;
	today: SiteLiveReadCard[];
	updatedAt?: string;
}) {
	const readyCards = cards.filter((card) => card.ok);
	const failedCards = cards.filter((card) => !card.ok);

	return (
		<section className="direct-manage">
			<div className="direct-hero">
				<div>
					<p className="app-eyebrow">{ko.readApi}</p>
					<h2>{statusLabelText(status)}</h2>
					<span>
						{message ??
							"iframe은 비상 접근으로 유지하고, 자주 보는 데이터는 All For One에서 바로 확인합니다."}
					</span>
				</div>
				<div className="direct-stats">
					<div>
						<strong>{readyCards.length}</strong>
						<span>연결됨</span>
					</div>
					<div>
						<strong>{failedCards.length}</strong>
						<span>확인 필요</span>
					</div>
					<div>
						<strong>{updatedAt ? new Date(updatedAt).toLocaleTimeString() : "-"}</strong>
						<span>갱신</span>
					</div>
				</div>
			</div>

			<div className="direct-section">
				<div className="direct-section-title">
					<h2>{ko.todayWork}</h2>
					<span>대기/알림/검토 항목</span>
				</div>
				<div className="direct-card-grid">
					{today.length ? (
						today.map((card) => <LiveReadCard card={card} compact key={card.id} />)
					) : (
						<div className="direct-empty">오늘 우선 처리할 API 항목이 없습니다.</div>
					)}
				</div>
			</div>

			<div className="direct-section">
				<div className="direct-section-title">
					<h2>{ko.allData}</h2>
					<span>사용자, 매출, 정산, 일정, 로그</span>
				</div>
				<div className="direct-card-grid">
					{cards.length ? (
						cards.map((card) => <LiveReadCard card={card} key={card.id} />)
					) : (
						<div className="direct-empty">직접 연결된 read API가 아직 없습니다.</div>
					)}
				</div>
			</div>

			<div className="direct-section">
				<div className="direct-section-title">
					<h2>다음 권한 단계</h2>
					<span>쓰기와 관리자 권한은 토큰 분리 후 활성화</span>
				</div>
				<div className="action-grid">
					{actions.map((action) => (
						<ActionCard action={action} key={action.id} />
					))}
				</div>
			</div>
		</section>
	);
}

function LiveReadCard({
	card,
	compact,
}: {
	card: SiteLiveReadCard;
	compact?: boolean;
}) {
	return (
		<article className="live-read-card" data-ok={card.ok}>
			<div className="live-read-card-head">
				<div>
					<p>{card.path}</p>
					<h3>{card.label}</h3>
				</div>
				<strong>{card.count ?? card.preview.length}</strong>
			</div>
			<span className="pill">{card.ok ? `HTTP ${card.status}` : card.error ?? "연결 실패"}</span>
			{compact ? null : <pre>{formatPreview(card.preview)}</pre>}
		</article>
	);
}

function ActionCard({ action }: { action: SiteLiveAction }) {
	return (
		<article className="action-card" data-enabled={action.enabled}>
			<div>
				<p>{action.phase === "write" ? ko.writeApi : ko.adminApi}</p>
				<h3>{action.label}</h3>
			</div>
			<span>{action.enabled ? "사용 가능" : action.reason ?? "대기"}</span>
		</article>
	);
}

function statusLabelText(status: string) {
	if (status === "ready") {
		return "직접 관리 연결 완료";
	}
	if (status === "partial") {
		return "일부 API 확인 필요";
	}
	if (status === "unavailable") {
		return "API 연결 확인 필요";
	}
	return "직접 관리 준비 중";
}

function formatPreview(value: unknown[]) {
	if (!value.length) {
		return "미리보기 데이터 없음";
	}

	return JSON.stringify(value, null, 2).slice(0, 900);
}
