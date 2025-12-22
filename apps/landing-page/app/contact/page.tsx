import { ContactForm } from '@/components/contact/ContactForm';
import { MapPin, Mail, Phone } from 'lucide-react';

export default function ContactPage() {
	return (
		<main className="min-h-screen bg-white flex flex-col lg:flex-row">
			<div className="lg:w-1/2 p-12 lg:p-24 flex flex-col justify-center bg-[#F5F5F7] lg:bg-white">
				<h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-[#1D1D1F] mb-12">
					Get in Touch.
				</h1>

				<div className="space-y-12">
					<div className="flex gap-6 items-center group">
						<div className="w-16 h-16 rounded-full bg-[#F5F5F7] flex items-center justify-center">
							<MapPin className="w-6 h-6 text-[#1D1D1F]" />
						</div>
						<div>
							<h3 className="font-semibold text-xl text-[#1D1D1F]">Headquarters</h3>
							<p className="text-[#86868B]">1200 Energy Way, SF CA</p>
						</div>
					</div>

					<div className="flex gap-6 items-center group">
						<div className="w-16 h-16 rounded-full bg-[#F5F5F7] flex items-center justify-center">
							<Mail className="w-6 h-6 text-[#1D1D1F]" />
						</div>
						<div>
							<h3 className="font-semibold text-xl text-[#1D1D1F]">Email</h3>
							<p className="text-[#86868B]">hello@volteryde.com</p>
						</div>
					</div>
				</div>
			</div>

			<div className="lg:w-1/2 p-12 lg:p-24 flex items-center bg-white">
				<ContactForm />
			</div>
		</main>
	);
}
