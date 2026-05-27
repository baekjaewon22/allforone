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
	const embeddedRef = useRef<HTMLElement>(null);
	const detail = useQuery({
		queryKey: ["managed-site", siteId],
		queryFn: () => rpcClient.getManagedSiteDetail(siteId),
	});
	const data = detail.data;
	const selectedLink =
		data?.adminLinks.find((link) => link.url === embeddedUrl) ??
		data?.adminLinks[0];

	useEffect(() => {
		setEmbeddedUrl(undefined);
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
		</section>
	);
}

