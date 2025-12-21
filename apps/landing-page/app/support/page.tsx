import { SearchHero } from '@/components/support/SearchHero';
import { TopicGrid } from '@/components/support/TopicGrid';
import { FAQSection } from '@/components/support/FAQSection';

export default function SupportPage() {
	return (
		<main className="relative bg-black min-h-screen selection:bg-green-500/30 pb-24">
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-green-900/10 via-black to-black opacity-50 pointer-events-none" />

			<SearchHero />
			<TopicGrid />
			<FAQSection />
		</main>
	);
}
