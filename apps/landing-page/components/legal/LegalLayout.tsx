'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Section {
	id: string;
	title: string;
	content: React.ReactNode;
}

interface LegalLayoutProps {
	title: string;
	lastUpdated: string;
	sections: Section[];
}

export function LegalLayout({ title, lastUpdated, sections }: LegalLayoutProps) {
	const [activeSection, setActiveSection] = useState(sections[0].id);

	const scrollToSection = (id: string) => {
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'start' });
			setActiveSection(id);
		}
	};

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setActiveSection(entry.target.id);
					}
				});
			},
			{ rootMargin: '-20% 0px -50% 0px' }
		);

		sections.forEach((section) => {
			const el = document.getElementById(section.id);
			if (el) observer.observe(el);
		});

		return () => observer.disconnect();
	}, [sections]);

	return (
		<div className="min-h-screen bg-white text-[#1D1D1F] py-24 px-6">
			<div className="max-w-[1000px] mx-auto flex flex-col lg:flex-row gap-24">

				{/* Sticky Sidebar (TOC) */}
				<aside className="hidden lg:block w-48 flex-shrink-0">
					<div className="sticky top-32 space-y-2 border-l border-neutral-200 pl-4 relative">
						{/* Animated Active Indicator */}
						<motion.div
							layoutId="active-indicator"
							className="absolute left-[-1px] top-0 w-[2px] h-6 bg-[#39FF14]"
							style={{ top: sections.findIndex(s => s.id === activeSection) * 32 }} // Simple approx positioning or use refs for exact
							transition={{ type: "spring", stiffness: 300, damping: 30 }}
						/>

						{sections.map((section) => (
							<button
								key={section.id}
								onClick={() => scrollToSection(section.id)}
								className={cn(
									"block text-left text-sm transition-colors duration-200 h-6",
									activeSection === section.id ? "text-[#1D1D1F] font-semibold" : "text-[#86868B]"
								)}
							>
								{section.title}
							</button>
						))}
					</div>
				</aside>

				{/* Main Content */}
				<main className="flex-1 max-w-[700px]">
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
					>
						<div className="mb-16">
							<h1 className="text-5xl font-semibold tracking-tight text-[#1D1D1F] mb-4 decoration-[#39FF14] underline decoration-4 underline-offset-8 decoration-skip-ink-none">{title}</h1>
							<p className="text-[#86868B] text-sm font-medium">Last updated: {lastUpdated}</p>
						</div>

						<div className="prose prose-lg prose-neutral prose-headings:font-semibold prose-a:text-[#39FF14]">
							{sections.map((section) => (
								<section key={section.id} id={section.id} className="scroll-mt-32 mb-20">
									<h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
										{section.title}
									</h2>
									<div className="text-[#1D1D1F] leading-relaxed opacity-90">
										{section.content}
									</div>
								</section>
							))}
						</div>
					</motion.div>
				</main>
			</div>
		</div>
	);
}
