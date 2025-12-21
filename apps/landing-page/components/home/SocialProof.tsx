'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const partners = [
	"Tesla Energy",
	"ChargePoint",
	"Siemens",
	"Schneider Electric",
	"Rivian Fleet",
	"NextEra Energy",
	"Fluence",
	"ABB E-mobility"
];

export function SocialProof() {
	return (
		<section className="py-12 border-y border-white/5 bg-black/50 backdrop-blur-sm overflow-hidden z-10 relative">
			<div className="max-w-7xl mx-auto px-6 mb-8 text-center">
				<p className="text-sm font-mono text-neutral-500 uppercase tracking-widest">Trusted by Industry Leaders</p>
			</div>

			<div className="flex relative items-center">
				{/* Gradients for smooth fade out */}
				<div className="absolute left-0 w-32 h-full bg-gradient-to-r from-black to-transparent z-10" />
				<div className="absolute right-0 w-32 h-full bg-gradient-to-l from-black to-transparent z-10" />

				<div className="flex gap-12 animate-marquee whitespace-nowrap">
					{/* Double list for smooth infinite scroll */}
					{[...partners, ...partners, ...partners].map((partner, i) => (
						<div
							key={`${partner}-${i}`}
							className="text-xl md:text-2xl font-bold text-neutral-800 uppercase tracking-tighter"
						>
							{partner}
						</div>
					))}
				</div>
			</div>

			{/* Tailwind v4 animation utility can be handled in CSS, 
          but for now we'll add a style tag or rely on `animate-` class if configured.
          Framer Motion is safer here for the marquee effect.
      */}
			<MarqueeTrack />
		</section>
	);
}

function MarqueeTrack() {
	return (
		<div className="flex overflow-hidden">
			<motion.div
				className="flex gap-16 py-4"
				animate={{ x: ["0%", "-50%"] }}
				transition={{
					repeat: Infinity,
					ease: "linear",
					duration: 20
				}}
			>
				{[...partners, ...partners, ...partners, ...partners].map((partner, i) => (
					<span
						key={i}
						className="text-2xl font-bold text-neutral-700 hover:text-neutral-400 transition-colors cursor-default whitespace-nowrap"
					>
						{partner}
					</span>
				))}
			</motion.div>
		</div>
	);
}
