'use client';

import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface EnergyBeamProps {
	className?: string;
}

export function EnergyBeam({ className }: EnergyBeamProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ["start start", "end end"]
	});

	// Smooth out the scroll progress
	const pathLength = useSpring(scrollYProgress, {
		stiffness: 100,
		damping: 30,
		restDelta: 0.001
	});

	return (
		<div ref={containerRef} className={cn("absolute inset-y-0 left-1/2 -translate-x-1/2 w-full pointer-events-none z-0", className)}>
			<svg
				viewBox="0 0 100 1000"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				className="h-full w-full overflow-visible"
				preserveAspectRatio="none"
			>
				<motion.path
					d="M50 0 V 1000"
					stroke="#39FF14"
					strokeWidth="2"
					className="beam-glow opacity-50"
					style={{ pathLength }}
				/>
				{/* Plug Head Effect */}
				<motion.g
					style={{
						y: useTransform(pathLength, [0, 1], [0, 1000]),
					}}
				>
					{/* Glow behind the plug */}
					<circle cx="50" cy="0" r="15" fill="#39FF14" className="blur-xl opacity-50" />

					{/* Plug Body (Vertical connector) */}
					<rect
						x="46"
						y="-20"
						width="8"
						height="20"
						fill="#B2ECC1"
						rx="2"
						className="drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]"
					/>

					{/* Plug Base (The 'Contact' point) */}
					<ellipse
						cx="50"
						cy="0"
						rx="12"
						ry="4"
						fill="#39FF14"
						className="drop-shadow-[0_0_10px_#39FF14]"
					/>
				</motion.g>
			</svg>
		</div>
	);
}
