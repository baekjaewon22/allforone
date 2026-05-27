import { useState } from "react";
import { setAuthSession } from "../auth";
import { HudBackground } from "./HudBackground";

export function LoginPage() {
	const [showPassword, setShowPassword] = useState(false);

	return (
		<main className="hero-shell">
			<HudBackground />
			<section className="login-panel" aria-label="All For One 로그인">
				<p className="kicker">개인 통합 관리 시스템 · v1.0</p>
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
