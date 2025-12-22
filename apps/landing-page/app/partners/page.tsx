'use client';

import { motion } from 'framer-motion';

const partners = [
	{ name: "Tesla", color: "#E82127" },
	{ name: "ChargePoint", color: "#F05A22" },
	{ name: "Siemens", color: "#009999" },
	{ name: "Rivian", color: "#F7B500" },
	{ name: "NextEra", color: "#8BBA25" },
	{ name: "Fluence", color: "#00C4D4" },
	{ name: "ABB", color: "#FF000F" },
	{ name: "Enel X", color: "#E20688" },
	{ name: "Volta", color: "#3D3C3A" },
	{ name: "EVgo", color: "#1E4F91" },
	{ name: "Blink", color: "#00A9E0" },
	{ name: "Wallbox", color: "#6DB33F" },
];

export default function PartnersPage() {
	return (
		<main className="bg-[#F5F5F7] min-h-screen py-32 px-6">
			<div className="max-w-[1200px] mx-auto text-center mb-24">
				<h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-[#1D1D1F] mb-6">
					Powered by Collaboration.
				</h1>
				<p className="text-[#86868B] text-xl max-w-2xl mx-auto">
					Our network of hardware and utility partners.
				</p>
			</div>

			<div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
				{partners.map((partner, i) => (
					<motion.div
						key={i}
						className="aspect-square bg-white rounded-[32px] flex items-center justify-center p-8 cursor-default group relative overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ delay: i * 0.05 }}
					>
						{/* Network Line Simulation */}
						<div className="absolute top-1/2 left-0 w-full h-[1px] bg-[#39FF14] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
						<div className="absolute left-1/2 top-0 h-full w-[1px] bg-[#39FF14] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

						<div
							className="w-24 h-24 rounded-full bg-[#F5F5F7] flex items-center justify-center font-bold text-2xl transition-all duration-500 relative z-10 opacity-60 grayscale group-hover:opacity-100 group-hover:grayscale-0"
							style={{ color: partner.color }}
						>
							{partner.name[0]}
						</div>
						<span className="absolute bottom-6 font-semibold text-[#1D1D1F] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
							{partner.name}
						</span>
					</motion.div>
				))}
			</div>
		</main>
	);
}
