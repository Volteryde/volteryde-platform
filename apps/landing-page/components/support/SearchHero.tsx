'use client';

import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function SearchHero() {
	const [isFocused, setIsFocused] = useState(false);

	return (
		<div className="relative py-24 px-6 flex flex-col items-center justify-center text-center z-20">
			{/* Background Dim Overlay on Focus */}
			<div
				className={cn(
					"fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-500 pointer-events-none z-0",
					isFocused ? "opacity-100" : "opacity-0"
				)}
			/>

			<div className="relative z-10 w-full max-w-2xl">
				<h1 className="text-4xl md:text-5xl font-bold mb-8">How can we <span className="text-neon">help</span>?</h1>

				<div className={cn(
					"relative group transition-all duration-300",
					isFocused ? "scale-105" : "scale-100"
				)}>
					<div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
						<Search className={cn("w-6 h-6 transition-colors", isFocused ? "text-neon" : "text-neutral-500")} />
					</div>
					<input
						type="text"
						placeholder="Search for articles, guides, or troubleshooting..."
						className="w-full h-16 pl-14 pr-6 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:bg-black focus:border-[#39FF14] transition-all text-lg shadow-2xl"
						onFocus={() => setIsFocused(true)}
						onBlur={() => setIsFocused(false)}
					/>
				</div>

				<div className="flex gap-4 justify-center mt-6 text-sm text-neutral-400">
					<span>Popular:</span>
					<button className="hover:text-white underline">Billing</button>
					<button className="hover:text-white underline">API Keys</button>
					<button className="hover:text-white underline">Firmware Updates</button>
				</div>
			</div>
		</div>
	);
}
