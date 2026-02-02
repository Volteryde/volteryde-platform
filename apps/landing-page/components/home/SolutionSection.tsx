'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';

export function SolutionSection() {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, amount: 0.3 });

	return (
		<section ref={ref} className="section-padding bg-white">
			<div className="max-w-7xl mx-auto">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
					{/* Left - Image */}
					<motion.div
						initial={{ opacity: 0, x: -30 }}
						animate={isInView ? { opacity: 1, x: 0 } : {}}
						transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
						className="relative"
					>
						<Image
							src="/bus.png"
							alt="Volteryde Solution"
							width={500}
							height={350}
							className="w-full h-auto rounded-2xl shadow-lg"
						/>
					</motion.div>

					{/* Right - Content */}
					<motion.div
						initial={{ opacity: 0, x: 30 }}
						animate={isInView ? { opacity: 1, x: 0 } : {}}
						transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
						className="space-y-6"
					>
						<div>
							<h2 className="font-poppins font-bold text-3xl md:text-4xl text-[#033604] mb-2">
								The <span className="text-[#0CCF0E]">Solution</span>
							</h2>
							<div className="green-accent" />
						</div>

						<p className="font-outfit text-base md:text-lg text-[#737373] leading-relaxed">
							Comfortable buses, clear trip information, and transparent payments remove the daily friction that makes public transport frustrating and exhausting.
						</p>

						<p className="font-outfit text-base md:text-lg text-[#737373] leading-relaxed">
							Volteryde brings together modern electric buses, real-time arrival information, and cashless payment systems into one seamless experience. No more guessing, no more waiting, no more hassle.
						</p>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
