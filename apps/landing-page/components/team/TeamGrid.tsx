'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const teamMembers = [
	{
		name: "Alex V.",
		role: "Chief Architect",
		image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop",
	},
	{
		name: "Sarah L.",
		role: "Head of Engineering",
		image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop",
	},
	{
		name: "Davide K.",
		role: "Product Design",
		image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop",
	},
	{
		name: "Elena R.",
		role: "Grid Operations",
		image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1000&auto=format&fit=crop",
	},
	{
		name: "Marcus J.",
		role: "Security Lead",
		image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000&auto=format&fit=crop",
	},
	{
		name: "Priya S.",
		role: "Frontend Engineer",
		image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop",
	},
	{
		name: "Tom H.",
		role: "Backend Engineer",
		image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop",
	},
	{
		name: "Yuki M.",
		role: "Data Scientist",
		image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop",
	},
];

export function TeamGrid() {
	return (
		<section className="py-24 px-6 max-w-[1400px] mx-auto">
			<div className="mb-24 text-center">
				<h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#1D1D1F] mb-4">
					The Minds Behind the Current.
				</h1>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-y-24 gap-x-12">
				{teamMembers.map((member, i) => (
					<motion.div
						key={member.name}
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
						className="group cursor-default"
					>
						{/* Image Container - No borders, pure layout */}
						<div className="relative aspect-[3/4] mb-6 overflow-hidden bg-[#F5F5F7] rounded-[4px]">
							<Image
								src={member.image}
								alt={member.name}
								fill
								className="object-cover filter grayscale contrast-125 group-hover:grayscale-0 group-hover:contrast-100 transition-all duration-700 ease-in-out"
							/>
						</div>

						<div className="flex items-center gap-3">
							<div>
								<h3 className="text-[#1D1D1F] font-bold text-xl">{member.name}</h3>
								<p className="text-[#86868B] text-sm font-medium">{member.role}</p>
							</div>
							{/* Green indicator light on hover */}
							<div className="w-2 h-2 rounded-full bg-[#39FF14] opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_8px_#39FF14]" />
						</div>

					</motion.div>
				))}
			</div>
		</section>
	);
}
