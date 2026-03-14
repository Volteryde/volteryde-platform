import { createContext, useContext, useEffect, useState } from "react";
import { getAuthServiceUrl } from '@volteryde/config';

// Helper to get cookie
function getCookie(name: string) {
	if (typeof document === 'undefined') return undefined; // SSR check
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop()?.split(';').shift();
}

// Decode JWT payload without verification (verification happens server-side via middleware)
function decodeJwtPayload(token: string): Record<string, unknown> | null {
	try {
		const [, payload] = token.split('.');
		if (!payload) return null;
		// atob requires standard base64; JWT uses base64url — fix padding
		const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
		const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
		return JSON.parse(atob(padded));
	} catch {
		return null;
	}
}

export type SupportRole = 'CUSTOMER_SUPPORT' | 'SYSTEM_SUPPORT' | 'ADMIN' | 'SUPER_ADMIN';

interface RoleContextValue {
	role: SupportRole | null;
	roles: string[];
}

const RoleContext = createContext<RoleContextValue>({ role: null, roles: [] });

export function useRole(): RoleContextValue {
	return useContext(RoleContext);
}

const ROLE_PRIORITY: SupportRole[] = ['SUPER_ADMIN', 'ADMIN', 'SYSTEM_SUPPORT', 'CUSTOMER_SUPPORT'];

function extractPrimaryRole(roles: string[]): SupportRole | null {
	for (const priority of ROLE_PRIORITY) {
		if (roles.includes(priority)) return priority;
	}
	return null;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
	const [isAuth, setIsAuth] = useState(false);
	const [roleValue, setRoleValue] = useState<RoleContextValue>({ role: null, roles: [] });

	useEffect(() => {
		// 1. Check for SSO callback
		const searchParams = new URLSearchParams(window.location.search);
		const code = searchParams.get("code");

		if (code) {
			const d = new Date();
			d.setTime(d.getTime() + (24 * 60 * 60 * 1000));
			const expires = "expires=" + d.toUTCString();
			document.cookie = `volteryde_auth_access_token=${code};${expires};path=/;SameSite=Lax`;
			window.history.replaceState({}, document.title, window.location.pathname);

			const decoded = decodeJwtPayload(code);
			const roles: string[] = (decoded?.roles as string[]) || [];
			setRoleValue({ role: extractPrimaryRole(roles), roles });
			setIsAuth(true);
			return;
		}

		// 2. Check existing token
		const token = getCookie("volteryde_auth_access_token");
		if (!token) {
			const AUTH_URL = getAuthServiceUrl();
			const loginUrl = new URL('/login', AUTH_URL);
			loginUrl.searchParams.set('app', 'customer-and-support-app');
			loginUrl.searchParams.set('redirect', window.location.href);
			window.location.href = loginUrl.toString();
			return;
		}

		const decoded = decodeJwtPayload(token);
		const roles: string[] = (decoded?.roles as string[]) || [];
		setRoleValue({ role: extractPrimaryRole(roles), roles });
		setIsAuth(true);
	}, []);

	if (!isAuth) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
			</div>
		);
	}

	return (
		<RoleContext.Provider value={roleValue}>
			{children}
		</RoleContext.Provider>
	);
}
