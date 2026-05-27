import { useEffect, useMemo, useState } from "react";

const codePool = [
	"0x00 init systemd_link",
	"0x01 alloc buffer 0x2F8",
	"0x02 read dispatch enqueue",
	"0x03 if logCounter > 1024",
	"0x04   logCounter = 0",
	"0x05   trigger reset_pulse",
	"0x06 endif",
	"0x07 nav.targets += 1",
	"0x08 radar.sweep += 1.6deg",
	"0x09 net.packet flush",
	"0x0A telemetry::push",
	"0x0B if temp > 88.0",
	"0x0C   raise warn::TEMP",
	"0x0D endif",
	"0x0E orbit.delta = 0.21",
	"0x0F yield_ms 60",
	"0x10 sync.ack 0xAF21",
	"0x11 verify hash 9C84",
	"0x12 dispatch::tick",
	"0x13 mem.free 0x1A",
];

function shuffleLines(): string[] {
	return [...codePool].sort(() => Math.random() - 0.5).slice(0, 10);
}

const radarDots = Array.from({ length: 6 }, (_, idx) => ({
	angle: (idx * 53 + 17) % 360,
	radius: 24 + ((idx * 7) % 20),
	delay: idx * 0.42,
}));

const tickLabels = ["-50", "-30", "-10", "0", "10", "30", "50"];

export function HudBackground() {
	const [lines, setLines] = useState<string[]>(() => shuffleLines());
	const codeSeed = useMemo(() => Math.random().toString(36).slice(2, 8).toUpperCase(), []);

	useEffect(() => {
		const id = window.setInterval(() => setLines(shuffleLines()), 2400);
		return () => window.clearInterval(id);
	}, []);

	return (
		<div className="hud-stage" aria-hidden="true">
			<div className="hud-grid" />
			<div className="hud-scanlines" />
			<div className="hud-vignette" />

			<article className="hud-pane hud-pane--code">
				<header>
					<span className="hud-pane-title">EDIT 01 FILE</span>
					<span className="hud-pane-meta">SRV 02 · IP 192.248.21.19</span>
				</header>
				<ul className="hud-codelist">
					{lines.map((line, idx) => (
						<li key={`${line}-${idx}`} style={{ animationDelay: `${idx * 0.05}s` }}>
							<span className="hud-codelist-idx">{(idx + 1).toString(16).padStart(2, "0").toUpperCase()}</span>
							<span className="hud-codelist-text">{line}</span>
						</li>
					))}
				</ul>
				<footer>
					<span>BACK</span>
					<span>SEED {codeSeed}</span>
					<span>EXIT</span>
				</footer>
			</article>

			<div className="hud-hex hud-hex--topright">
				{[0, 1, 2, 3, 4].map((i) => (
					<span key={i} className="hud-hex-cell" style={{ animationDelay: `${i * 0.18}s` }} />
				))}
			</div>

			<div className="hud-radar">
				<div className="hud-radar-ring hud-radar-ring--outer" />
				<div className="hud-radar-ring hud-radar-ring--mid" />
				<div className="hud-radar-ring hud-radar-ring--inner" />
				<div className="hud-radar-core" />
				<div className="hud-radar-sweep" />
				<div className="hud-radar-crosshair" />
				{radarDots.map((dot, idx) => (
					<span
						key={idx}
						className="hud-radar-dot"
						style={{
							transform: `rotate(${dot.angle}deg) translateX(${dot.radius}%) rotate(${-dot.angle}deg)`,
							animationDelay: `${dot.delay}s`,
						}}
					/>
				))}
				<div className="hud-radar-ticks" aria-hidden="true">
					{tickLabels.map((tick) => (
						<span key={tick}>{tick}</span>
					))}
				</div>
				<span className="hud-radar-label">RADAR · 002</span>
			</div>

			<div className="hud-dial hud-dial--left">
				<div className="hud-dial-ring" />
				<div className="hud-dial-core" />
				<span className="hud-dial-label">CORE</span>
			</div>

			<div className="hud-dial hud-dial--right">
				<div className="hud-dial-ring hud-dial-ring--reverse" />
				<div className="hud-dial-needle" />
				<span className="hud-dial-label">FLUX</span>
			</div>

			<div className="hud-warning">
				<span className="hud-warning-icon">▲</span>
				<span>Temp Warning</span>
			</div>

			<div className="hud-data-block">
				<div className="hud-data-head">
					<span className="hud-label">Data Information</span>
					<span className="hud-label hud-label--mute">Tracking Engine</span>
				</div>
				<svg className="hud-graph" viewBox="0 0 300 90" preserveAspectRatio="none">
					<defs>
						<linearGradient id="hud-graph-fill" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="rgba(0,212,255,0.5)" />
							<stop offset="100%" stopColor="rgba(0,212,255,0)" />
						</linearGradient>
					</defs>
					<path
						d="M0,80 C40,76 70,28 110,30 C150,32 170,68 210,72 C250,76 280,40 300,50 L300,90 L0,90 Z"
						fill="url(#hud-graph-fill)"
					/>
					<path
						className="hud-graph-line"
						d="M0,80 C40,76 70,28 110,30 C150,32 170,68 210,72 C250,76 280,40 300,50"
						fill="none"
					/>
				</svg>
				<div className="hud-graph-baseline">
					{Array.from({ length: 12 }).map((_, i) => (
						<span key={i} />
					))}
				</div>
			</div>

			<div className="hud-hex hud-hex--bottom">
				{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
					<span key={i} className="hud-hex-cell hud-hex-cell--bottom" style={{ animationDelay: `${i * 0.12}s` }} />
				))}
			</div>

			<div className="hud-corner hud-corner--tl" />
			<div className="hud-corner hud-corner--tr" />
			<div className="hud-corner hud-corner--bl" />
			<div className="hud-corner hud-corner--br" />
		</div>
	);
}
