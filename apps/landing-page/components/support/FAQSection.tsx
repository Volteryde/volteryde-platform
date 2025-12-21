'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Plus, Minus, Search } from 'lucide-react';

const faqs = [
	{
		question: "How do I integrate Volteryde with my existing fleet?",
		answer: "Our platform supports standard OCPP 1.6/2.0 protocols. Simply point your chargers to our websocket endpoint `wss://api.volteryde.com/ocpp` and configure your API keys in the dashboard."
	},
	{
		question: "What happens if the vehicle loses internet connection?",
		answer: "The Volteryde telemetry unit caches up to 48 hours of data locally. Once connectivity is restored, the data is batched and uploaded to the cloud without loss."
	},
	{
		question: "Is V2G (Vehicle-to-Grid) supported on all EVs?",
		answer: "No, V2G requires bi-directional charging hardware and vehicle firmware support. Please check our Compatibility Matrix for a list of certified vehicles (Nissan Leaf, Ford F-150 Lightning, etc.)."
	},
	{
		question: "How is billing handled for public charging?",
		answer: "We aggregate charging sessions and invoice monthly. You can also set up automated credit card payments or connect your corporate fleet fuel card."
	},
];

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
								<Minus className="text-neon w-5 h-5 flex-shrink-0" />
							) : (
								<Plus className="text-neutral-500 w-5 h-5 flex-shrink-0" />
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
