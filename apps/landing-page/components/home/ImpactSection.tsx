'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';

export function ImpactSection() {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, amount: 0.3 });

	const impacts = [
		{
			title: 'Better Planning, Less Waiting',
			description: 'With predictable routes and timely arrivals, commuters can plan their day with confidence — reducing long waits, missed connections, and daily uncertainty.',
		},
		{
			title: 'Cleaner Cities, Healthier Lives',
			description: 'By running fully electric buses, Voltride cuts down fuel emissions and air pollution, helping create quieter streets and healthier urban environments.',
		},
		{
			title: 'Stress-Free Commuting Experience',
			description: 'Comfortable buses, clear trip information, and transparent payments remove the daily friction that makes public transport frustrating and exhausting.',
		},
	];

	return (
		<section ref={ref} className="py-16 bg-white overflow-hidden relative">
			{/* Lightning bolt decoration - bottom left */}
			<Image
				src="/branding/lightening.svg"
				alt=""
				width={463}
				height={696}
				className="absolute -bottom-[618px] -left-[214px] z-0 pointer-events-none"
			/>

			<div className="max-w-7xl mx-auto px-8 lg:px-12 relative z-10">
				<div className="flex flex-col lg:flex-row gap-16 items-center justify-center">
					{/* Left - Logo Card */}
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={isInView ? { opacity: 1, scale: 1 } : {}}
						transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
						className="shrink-0"
					>
						<Image
							src="/branding/volteryde.png"
							alt="Volteryde"
							width={500}
							height={500}
							className="w-[500px] h-[500px] rounded-[64px] object-cover"
						/>
					</motion.div>

					{/* Right - Impact List */}
					<motion.div
						initial={{ opacity: 0, x: 30 }}
						animate={isInView ? { opacity: 1, x: 0 } : {}}
						transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
						className="flex-1 flex flex-col gap-8"
					>
						<h2 className="font-poppins font-bold text-[48px] leading-[56px] text-[#033604]">
							The <span className="text-[#0CCF0E]">Impact</span> we bring
						</h2>

						<div className="flex flex-col gap-8">
							{impacts.map((impact, index) => (
								<motion.div
									key={index}
									initial={{ opacity: 0, y: 20 }}
									animate={isInView ? { opacity: 1, y: 0 } : {}}
									transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
									className="flex gap-4 items-start"
								>
									{/* Green circle with checkmark */}
									<div className="shrink-0 w-6 h-6 bg-[#0CCF0E] rounded-full flex items-center justify-center">
										<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M13.3334 4L6.00002 11.3333L2.66669 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
									</div>
									<div className="flex flex-col gap-2">
										<h3 className="font-outfit font-bold text-[18px] leading-[20px] text-[#033604] opacity-80">
											{impact.title}
										</h3>
										<p className="font-outfit font-normal text-[14px] leading-[20px] text-[#033604] opacity-80">
											{impact.description}
										</p>
									</div>
								</motion.div>
							))}
						</div>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
