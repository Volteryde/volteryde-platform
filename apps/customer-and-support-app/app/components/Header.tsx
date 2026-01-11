
import { Link } from 'react-router';
import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { getAuthServiceUrl } from '@volteryde/config';

export function Header() {
	const handleLogout = () => {
		// 1. Clear Cookies
		document.cookie = 'volteryde_auth_access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';

		// 2. Redirect to Auth Platform
		const authUrl = getAuthServiceUrl();

		window.location.href = `${authUrl}/login?logout=true`;
	};

	return (
		<header className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
			<div className="flex items-center gap-2">
				<div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center text-white font-bold">
					CS
				</div>
				<span className="font-semibold text-gray-900">Customer Support</span>
			</div>

			<button
				onClick={handleLogout}
				className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
			>
				<LogOut size={16} />
				Logout
			</button>
		</header>
	);
}
