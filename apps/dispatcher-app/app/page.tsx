"use client";

import { IconArrowLeft } from "@tabler/icons-react";
import { getAuthServiceUrl } from '@volteryde/config';

export default function Dashboard() {
  const handleLogout = () => {
    // 1. Clear Cookies
    document.cookie = 'volteryde_auth_access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';

    // 2. Clear Local Storage
    localStorage.removeItem('volteryde_auth_access_token');

    // 3. Redirect to Auth Platform
    const authUrl = getAuthServiceUrl();

    window.location.href = `${authUrl}/login?logout=true`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
            DP
          </div>
          <h1 className="text-xl font-bold text-gray-800">Dispatcher Portal</h1>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <IconArrowLeft size={20} />
          Logout
        </button>
      </header>

      <main className="flex-1 p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Dispatcher Portal</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            This application is currently under development. The authentication and logout flow have been set up.
          </p>
        </div>
      </main>
    </div>
  );
}
