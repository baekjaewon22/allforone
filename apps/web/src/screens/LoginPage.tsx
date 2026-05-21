import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import NET from "vanta/dist/vanta.net.min";
import { setAuthSession } from "../auth";

type VantaEffect = {
	destroy: () => void;
};

export function LoginPage() {
	const backgroundRef = useRef<HTMLDivElement | null>(null);
	const [showPassword, setShowPassword] = useState(false);

	useEffect(() => {
		if (!backgroundRef.current) {
			return;
		}

		const effect = NET({
			el: backgroundRef.current,
			THREE,
			mouseControls: true,
			touchControls: true,
			gyroControls: false,
			minHeight: 200,
			minWidth: 200,
			scale: 1,
			scaleMobile: 1,
			color: 0x20f26a,
			backgroundColor: 0x050708,
			points: 13,
			maxDistance: 21,
			spacing: 15,
			showDots: true,
		}) as VantaEffect;

		return () => effect.destroy();
	}, []);

	return (
		<main className="hero-shell">
			<div ref={backgroundRef} className="vanta-stage" aria-hidden="true" />
			<div className="scene-shade" aria-hidden="true" />
			<section className="login-panel" aria-label="All For One 로그인">
				<p className="kicker">개인 통합 관리 시스템</p>
				<h1>All For One</h1>
				<form className="login-form">
					<div className="login-fields">
						<label>
							<span>아이디</span>
							<input type="email" name="email" autoComplete="email" />
						</label>
						<label>
							<span>비밀번호</span>
							<div className="password-field">
								<input
									type={showPassword ? "text" : "password"}
									name="password"
									autoComplete="current-password"
								/>
								<button
									type="button"
									className="password-toggle"
									aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
									onClick={() => setShowPassword((visible) => !visible)}
								>
									{showPassword ? "숨김" : "보기"}
								</button>
							</div>
						</label>
					</div>
					<button
						type="button"
						className="login-action"
						aria-label="로그인"
						onClick={() => {
							setAuthSession({
								userId: "local-dev",
								email: "operator@allforone.local",
							});
							globalThis.location.assign("/");
						}}
					>
						<span>입장</span>
					</button>
				</form>
			</section>
		</main>
	);
}
