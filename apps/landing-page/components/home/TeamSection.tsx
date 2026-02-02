'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';
import { teamMembers } from '@/data/team';

export function TeamSection() {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, amount: 0.2 });

	return (
		<section ref={ref} className="py-20 relative overflow-visible">

			<div className="max-w-7xl mx-auto px-8 relative">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={isInView ? { opacity: 1, y: 0 } : {}}
					transition={{ duration: 0.6 }}
					className="text-center mb-10"
				>
					<h2 className="font-poppins font-bold text-[48px] leading-[56px] text-[#033604]">
						Meet the <span className="text-[#0CCF0E]">Team</span>
					</h2>
				</motion.div>

				<div className="flex flex-wrap justify-center gap-[64px]">
					{teamMembers.map((member, index) => (
						<motion.div
							key={index}
							initial={{ opacity: 0, y: 30 }}
							animate={isInView ? { opacity: 1, y: 0 } : {}}
							transition={{ duration: 0.5, delay: 0.05 * index }}
							className="flex flex-col items-center gap-4"
						>
							<div className="w-[220px] h-[220px] rounded-[24px] overflow-hidden">
								<Image
									src={member.image}
									alt={member.name}
									width={220}
									height={220}
									className="w-full h-full object-cover"
								/>
							</div>
							<div className="text-center">
								<h3 className="font-outfit font-semibold text-[18px] leading-[20px] text-[#033604]">
									{member.name}
								</h3>
								<p className="font-outfit font-medium text-[14px] leading-[20px] text-[#033604] opacity-80 mt-1">
									{member.title}
								</p>
							</div>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
