'use client';

import { faqs } from '@/mock';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

export function FAQSection() {
	const [openIndex, setOpenIndex] = useState<number | null>(0);

	return (
		<div className="max-w-3xl mx-auto py-12">
			<h2 className="text-2xl font-bold mb-8 text-center md:text-left">Frequently Asked Questions</h2>
			<div className="space-y-4">
				{faqs.map((faq, index) => (
					<div
						key={index}
						className="border border-white/10 rounded-2xl overflow-hidden bg-white/5 transition-colors hover:border-white/20"
					>
						<button
							onClick={() => setOpenIndex(index === openIndex ? null : index)}
							className="w-full flex items-center justify-between p-6 text-left"
						>
							<span className="font-medium text-lg text-white">{faq.question}</span>
							{index === openIndex ? (
								<Minus className="text-neon w-5 h-5 shrink-0" />
							) : (
								<Plus className="text-neutral-500 w-5 h-5 shrink-0" />
							)}
						</button>
						<AnimatePresence>
							{index === openIndex && (
								<motion.div
									initial={{ height: 0, opacity: 0 }}
									animate={{ height: "auto", opacity: 1 }}
									exit={{ height: 0, opacity: 0 }}
									transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
								>
									<div className="p-6 pt-0 text-neutral-400 leading-relaxed border-t border-white/5">
										{faq.answer}
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				))}
			</div>
		</div>
	);
}
