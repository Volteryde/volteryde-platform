import { LegalLayout } from '@/components/legal/LegalLayout';

export default function TermsPage() {
	const sections = [
		{
			id: "acceptance",
			title: "Acceptance of Terms",
			content: (
				<p>
					By accessing or using the Volteryde platform ("Service"), you agree to be bound by these Terms of Service ("Terms").
					If you disagree with any part of the terms, you may not access the Service.
				</p>
			)
		},
		{
			id: "fleet-usage",
			title: "Fleet Usage Rights",
			content: (
				<>
					<p>
						You retain all rights to the physical assets (vehicles) connected to the Service.
						However, you grant Volteryde a perpetual, irrevocable license to aggregate and anonymize
						telemetry data for the purpose of improving grid optimization algorithms.
					</p>
					<p>
						Unauthorized manipulation of the hardware to spoof telemetry data is a violation
						of these terms and may result in immediate suspension.
					</p>
				</>
			)
		},
		{
			id: "liability",
			title: "Limitation of Liability",
			content: (
				<p>
					In no event shall Volteryde, nor its directors, employees, partners, agents, suppliers, or affiliates,
					be liable for any indirect, incidental, special, consequential or punitive damages, including without
					limitation, loss of profits, data, use, goodwill, or other intangible losses.
				</p>
			)
		},
		{
			id: "termination",
			title: "Termination",
			content: (
				<p>
					We may terminate or suspend your account immediately, without prior notice or liability,
					for any reason whatsoever, including without limitation if you breach the Terms.
					Upon termination, your right to use the Service will immediately cease.
				</p>
			)
		}
	];

	return (
		<LegalLayout
			title="Terms of Service"
			lastUpdated="December 12, 2025"
			sections={sections}
		/>
	);
}
