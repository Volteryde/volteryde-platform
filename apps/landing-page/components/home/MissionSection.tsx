'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';

export function MissionSection() {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, amount: 0.3 });

	return (
		<section ref={ref} className="py-20 bg-white relative overflow-hidden">
			{/* Decorative Shape */}
			<div className="absolute -bottom-20 -right-20 w-[600px] h-[600px] bg-[#F0FDF4] rounded-full blur-3xl opacity-60 z-0 pointer-events-none" />
			<Image
				src="/branding/lightening.svg"
				alt=""
				width={306}
				height={212}
				className="absolute bottom-0 right-0 z-0 pointer-events-none"
			/>

			<div className="max-w-7xl mx-auto px-8 lg:px-12 relative z-10">
				<div className="flex flex-col lg:flex-row gap-16 items-center justify-center">
					{/* Left - Image */}
					<motion.div
						initial={{ opacity: 0, x: -30 }}
						animate={isInView ? { opacity: 1, x: 0 } : {}}
						transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
						className="shrink-0"
					>
						<div className="relative rounded-[16px] overflow-hidden">
							<Image
								src="/branding/city.png"
								alt="Volteryde Mission"
								width={500}
								height={625}
								className="object-cover"
							/>
						</div>
					</motion.div>

					{/* Right - Content */}
					<motion.div
						initial={{ opacity: 0, x: 30 }}
						animate={isInView ? { opacity: 1, x: 0 } : {}}
						transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
						className="flex flex-col gap-8 max-w-[472px]"
					>
						<h2 className="font-poppins font-bold text-[48px] leading-[56px] text-[#033604]">
							Our Mission
						</h2>

						<p className="font-outfit font-normal text-[18px] leading-[1.6] text-[#033604]/80">
							Volteryde exists to transform public transportation in Ghana by delivering clean, reliable, and technology-driven electric bus services that improve everyday commuting while protecting the environment.
						</p>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
