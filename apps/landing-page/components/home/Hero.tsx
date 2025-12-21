'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export function Hero() {
	return (
		<section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white pt-32">
			{/* Background Ambience - Keeping it very clean, potentially a very faint mesh */}

			{/* Centered Content */}
			<div className="z-10 text-center space-y-8 max-w-5xl px-6">
				<motion.h1
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
					className="text-7xl md:text-9xl font-semibold tracking-tight text-[#1D1D1F]"
				>
					Energy, <span className="text-neon-green">Directed.</span>
				</motion.h1>

				<motion.p
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
					className="text-2xl md:text-3xl text-[#86868B] font-normal max-w-2xl mx-auto leading-relaxed"
				>
					The future of propulsion is silent and seamless.
				</motion.p>

				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.5, delay: 0.4 }}
				>
					<Button variant="neon" size="lg" className="rounded-full text-lg px-10 py-6">
						Experience the Flow
					</Button>
				</motion.div>
			</div>

			{/* 3D Abstract Representation (Refined & Visible) */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 2, delay: 0.6 }}
				className="mt-24 relative w-64 h-64 md:w-96 md:h-96"
			>
				{/* Outer Ring - Static Chassis */}
				<div className="absolute inset-0 rounded-full border-[1px] border-neutral-300/60 shadow-inner" />

				{/* Middle Ring - Slow rotation */}
				<div className="absolute inset-8 rounded-full border-[1px] border-neutral-300 animate-[spin_60s_linear_infinite]" />

				{/* Inner Ring - Counter rotation & Neon hint */}
				<div className="absolute inset-16 rounded-full border-[1px] border-dashed border-[#39FF14]/30 animate-[spin_40s_linear_infinite_reverse]" />

				{/* Core - The Generator */}
				<div className="absolute inset-1/4 rounded-full bg-gradient-to-br from-neutral-100 to-white shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-white flex items-center justify-center">
					<div className="w-8 h-8 rounded-full bg-[#1D1D1F]/5 animate-pulse" />
				</div>

				{/* The Horizontal Beam - Subtle Wash */}
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[1px] bg-gradient-to-r from-transparent via-[#39FF14] to-transparent opacity-30 blur-xl" />
			</motion.div>

		</section>
	);
}
