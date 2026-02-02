'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';

export default function GetVolteryde() {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, amount: 0.3 });

	return (
		<section
			id="download"
			ref={ref}
			className="py-16 px-8 bg-white"
		>
			<div className="max-w-7xl mx-auto">
				{/* Green container with rounded corners */}
				<div className="bg-[#0CCF0E] rounded-[64px] flex items-center justify-between pt-16 px-16 lg:px-32 relative overflow-hidden">
					{/* Left - Content */}
					<motion.div
						initial={{ opacity: 0, x: -30 }}
						animate={isInView ? { opacity: 1, x: 0 } : {}}
						transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
						className="flex flex-col gap-6 items-start max-w-[545px] pb-16"
					>
						<h2 className="font-poppins font-bold text-[40px] leading-[48px] text-white">
							Be part of a Cleaner Future
						</h2>

						<p className="font-outfit font-normal text-[18px] leading-[20px] text-white opacity-95">
							Volteryde is transforming public transport with electric buses that put sustainability first. Join us in building cleaner cities — start your journey with the Voltride app.
						</p>

						<motion.button
							initial={{ opacity: 0, y: 20 }}
							animate={isInView ? { opacity: 1, y: 0 } : {}}
							transition={{ duration: 0.5, delay: 0.3 }}
							className="bg-white h-[56px] px-8 py-4 rounded-[32px] flex items-center justify-center hover:bg-gray-50 transition-colors"
						>
							<span className="font-poppins font-medium text-[18px] leading-[20px] text-[#033604]">
								Download App
							</span>
						</motion.button>
					</motion.div>

					{/* Right - Phone Mockup */}
					<motion.div
						initial={{ opacity: 0, x: 30 }}
						animate={isInView ? { opacity: 1, x: 0 } : {}}
						transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
						className="hidden lg:flex justify-end items-end shrink-0"
					>
						<Image
							src="/branding/phone.png"
							alt="Volteryde App"
							width={369}
							height={524}
							priority
							quality={100}
							className="object-contain"
						/>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
