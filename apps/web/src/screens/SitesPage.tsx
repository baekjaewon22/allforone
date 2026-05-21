import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { rpcClient } from "../lib/rpcClient";

const ko = {
	adminFallback: "\uad00\ub9ac\uc790",
	embeddedAdmin: "\ub0b4\uc7a5 \uad00\ub9ac\uc790 \ud654\uba74",
	fullView: "\uc804\uccb4\ubcf4\uae30",
	exitFullView: "\uc804\uccb4\ubcf4\uae30 \uc885\ub8cc",
	loading: "\ubd88\ub7ec\uc624\ub294 \uc911",
	managedSite: "\uad00\ub9ac \uc0ac\uc774\ud2b8",
	managedTargets: "\ud1b5\ud569 \uad00\ub9ac \ub300\uc0c1",
	open: "\uc5f4\uae30",
};

const statusLabel: Record<string, string> = {
	active: "\ud65c\uc131",
	paused: "\uc77c\uc2dc\uc911\uc9c0",
	archived: "\ubcf4\uad00\ub428",
};

const siteCardVisuals: Record<string, { className: string; label: string; previewUrl: string }> = {
	"my-auction-docs": {
		className: "site-preview-mydocs",
		label: "\ubb38\uc11c \uad00\ub9ac",
		previewUrl: "https://my-docs.kr",
	},
	"landing-law": {
		className: "site-preview-law",
		label: "\ubc95\ubb34 \uad00\ub9ac",
		previewUrl: "https://lawitgo.com",
	},
};

function getSiteVisual(siteId: string) {
	return siteCardVisuals[siteId] ?? {
		className: "site-preview-default",
		label: "\uc6b4\uc601 \uad00\ub9ac",
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
