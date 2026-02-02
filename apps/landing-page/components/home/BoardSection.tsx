'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';
import { boardMembers } from '@/data/board';

export function BoardSection() {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, amount: 0.2 });

	return (
		<section id="board" ref={ref} className="py-20 relative">

			<div className="max-w-7xl mx-auto px-8 relative">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={isInView ? { opacity: 1, y: 0 } : {}}
					transition={{ duration: 0.6 }}
					className="text-center mb-10"
				>
					<h2 className="font-poppins font-bold text-[48px] leading-[56px] text-[#033604]">
						Meet the <span className="text-[#0CCF0E]">Board</span>
					</h2>
				</motion.div>

				<div className="flex justify-center gap-[64px]">
					{boardMembers.map((member, index) => (
						<motion.div
							key={index}
							initial={{ opacity: 0, y: 30 }}
							animate={isInView ? { opacity: 1, y: 0 } : {}}
							transition={{ duration: 0.5, delay: 0.1 * index }}
							className="flex flex-col items-center gap-4"
						>
							<div className="w-[260px] h-[260px] rounded-[24px] overflow-hidden bg-gray-100">
								<Image
									src={member.image}
									alt={member.name}
									width={260}
									height={260}
									className="w-full h-full object-cover"
								/>
							</div>
							<div className="text-center">
								<h3 className="font-outfit font-semibold text-[18px] leading-[20px] text-[#033604]">
									{member.name}
								</h3>
								<p className="font-outfit font-medium text-[16px] leading-[20px] text-[#033604] opacity-80 mt-1">
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
