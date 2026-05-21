import { useMemo } from "react";

const AUTH_STORAGE_KEY = "all-for-one.auth";

export type AuthSession = {
	userId: string;
	email: string;
};

export function getAuthSession(): AuthSession | null {
	const stored = globalThis.localStorage?.getItem(AUTH_STORAGE_KEY);

	if (!stored) {
		return null;
	}

	try {
		return JSON.parse(stored) as AuthSession;
	} catch {
		globalThis.localStorage?.removeItem(AUTH_STORAGE_KEY);
		return null;
	}
}

export function setAuthSession(session: AuthSession) {
	globalThis.localStorage?.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
	globalThis.localStorage?.removeItem(AUTH_STORAGE_KEY);
}

export function useAuthGuard() {
	return useMemo(() => {
		const session = getAuthSession();

		return {
			isAuthenticated: Boolean(session),
			session,
		};
	}, []);
}
