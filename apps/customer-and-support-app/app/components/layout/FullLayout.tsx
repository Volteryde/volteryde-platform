
import { useState } from 'react';
import { Outlet } from 'react-router';
import Sidebar from './sidebar/Sidebar';
import Header from './header/Header';

export default function FullLayout() {
	const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

	return (
		<div className="flex w-full min-h-screen">
			{/* Sidebar */}
			<aside className="hidden xl:block w-[270px] flex-shrink-0">
				<Sidebar />
			</aside>

			{/* Mobile Sidebar Overlay - (Simplified for now, just show Sidebar if open) */}
			{/* Implementation of mobile sidebar using Shacdn Sheet would go here, or a custom overlay */}
			{isMobileSidebarOpen && (
				<div className="fixed inset-0 z-50 flex xl:hidden">
					<div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
					<div className="relative w-[270px] h-full bg-white z-50 shadow-xl animate-in slide-in-from-left">
						<Sidebar onClose={() => setMobileSidebarOpen(false)} />
					</div>
				</div>
			)}

			{/* Main Content Wrapper */}
			<div className="flex-1 flex flex-col min-w-0 bg-[#F2F6FA] dark:bg-gray-950 min-h-screen">
				<Header onMobileSidebarOpen={() => setMobileSidebarOpen(true)} />

				<main className="flex-1 p-6 md:p-8 overflow-y-auto w-full max-w-[1600px] mx-auto">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
