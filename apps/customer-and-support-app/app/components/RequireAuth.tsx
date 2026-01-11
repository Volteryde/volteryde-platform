import { useEffect, useState } from "react";
import { getAuthServiceUrl } from '@volteryde/config';

// Helper to get cookie
function getCookie(name: string) {
	if (typeof document === 'undefined') return undefined; // SSR check
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop()?.split(';').shift();
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
	const [isAuth, setIsAuth] = useState(false);

	useEffect(() => {
		// 1. Check for SSO callback
		const searchParams = new URLSearchParams(window.location.search);
		const code = searchParams.get("code");

		if (code) {
			// Save token
			// Calculate 24h expiry
			const d = new Date();
			d.setTime(d.getTime() + (24 * 60 * 60 * 1000));
			const expires = "expires=" + d.toUTCString();

			document.cookie = `volteryde_auth_access_token=${code};${expires};path=/;SameSite=Lax`;

			// Clear URL
			window.history.replaceState({}, document.title, window.location.pathname);
			setIsAuth(true);
			return;
		}

		// 2. Check existing token
		const token = getCookie("volteryde_auth_access_token");
		if (!token) {
			// Redirect to Auth
			const AUTH_URL = getAuthServiceUrl();

			const loginUrl = new URL('/login', AUTH_URL);
			loginUrl.searchParams.set('app', 'customer-and-support-app');
			loginUrl.searchParams.set('redirect', window.location.href);

			window.location.href = loginUrl.toString();
			return;
		}

		setIsAuth(true);
	}, []);

	if (!isAuth) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
			</div>
		);
	}

	return <>{children}</>;
}
