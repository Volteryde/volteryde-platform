'use client';

import { CreditCard, Server, Smartphone, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';

const topics = [
	{ icon: CreditCard, title: "Billing & Subscriptions", desc: "Manage payments and invoices" },
	{ icon: Server, title: "Hardware Integration", desc: "OCPP setup and charger configs" },
	{ icon: Smartphone, title: "Mobile App", desc: "Driver accounts and navigation" },
	{ icon: Wrench, title: "Troubleshooting", desc: "Common error codes and fixes" },
];

export function TopicGrid() {
	return (
		<div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10 -mt-8 mb-16">
			{topics.map((topic, i) => (
				<motion.div
					key={topic.title}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: i * 0.1 }}
					className="glass-card p-6 flex flex-col items-center text-center hover:scale-105 transition-transform cursor-pointer hover:border-green-500/30 group"
				>
					<div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-[#39FF14] transition-colors duration-300">
						<topic.icon className="w-6 h-6 text-neutral-300 group-hover:text-black transition-colors duration-300" />
					</div>
					<h3 className="font-semibold text-lg mb-1">{topic.title}</h3>
					<p className="text-sm text-neutral-500">{topic.desc}</p>
				</motion.div>
			))}
		</div>
	);
}
