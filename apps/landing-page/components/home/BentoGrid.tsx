'use client';

import { motion } from 'framer-motion';
import { Zap, LayoutGrid, BarChart3, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
	{
		title: "Velocity",
		description: "Instantaneous torque vectoring analyzed in real-time.",
		icon: Zap,
		className: "col-span-1 md:col-span-2 row-span-2",
	},
	{
		title: "Range",
		description: "Predictive energy usage algorithms.",
		icon: LayoutGrid,
		className: "col-span-1",
	},
	{
		title: "Ecology",
		description: "Zero-emission fleet orchestration.",
		icon: BarChart3,
		className: "col-span-1",
	},
	{
		title: "Security",
		description: "End-to-end encrypted telemetry.",
		icon: ShieldCheck,
		className: "col-span-1 md:col-span-2",
	},
];

export function BentoGrid() {
	return (
		<section className="py-32 px-6 max-w-[1200px] mx-auto mb-24">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
				{features.map((feature, i) => (
					<motion.div
						key={feature.title}
						initial={{ opacity: 0, scale: 0.98 }}
						whileInView={{ opacity: 1, scale: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
						className={cn(
							"bg-white p-10 flex flex-col justify-between group overflow-hidden relative cursor-default border-[1.5px] border-[#39FF14] rounded-[32px] hover:shadow-[0_0_40px_-10px_rgba(57,255,20,0.3)] transition-all duration-500",
							feature.className
						)}
					>

						<div className="relative z-10">
							<feature.icon className="w-8 h-8 text-[#1D1D1F] mb-6" />
							<h3 className="text-3xl font-semibold mb-3 text-[#1D1D1F] tracking-tight">{feature.title}</h3>
							<p className="text-[#86868B] text-lg leading-relaxed">{feature.description}</p>
						</div>

					</motion.div>
				))}
			</div>
		</section>
	);
}
