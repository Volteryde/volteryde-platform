import Link from 'next/link';
import Image from 'next/image';
import { getAuthServiceUrl } from '@volteryde/config';

export function Footer() {
	return (
		<footer className="w-full bg-white py-16 font-outfit">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Main Footer Content */}
				<div className="flex flex-col lg:flex-row justify-between gap-12 mb-8">

					{/* Brand Column */}
					<div className="max-w-[256px]">
						<div className="flex flex-col items-start gap-4 mb-4">
							{/* Logo */}
							<Image
								src="/branding/greenlogo.svg"
								alt="Volteryde"
								width={72}
								height={45}
								className="h-[45px] w-auto"
							/>
						</div>
						<p className="font-outfit font-normal text-[16px] leading-[20px] text-[#737373] opacity-50">
							VolteRyde builds public transportation, connecting riders through fixed stops with efficient routing and predictable travel.
						</p>
					</div>

					{/* Quick Links */}
					<div>
						<h5 className="font-outfit font-semibold text-[18px] leading-[20px] text-[#033604] mb-6">
							Quick Links
						</h5>
						<ul className="space-y-4">
							<li>
								<Link
									href="/"
									className="font-outfit font-normal text-[16px] leading-[20px] text-[#737373] hover:text-[#033604] transition-colors"
								>
									Home
								</Link>
							</li>
							<li>
								<Link
									href="#board"
									className="font-outfit font-normal text-[16px] leading-[20px] text-[#737373] hover:text-[#033604] transition-colors"
								>
									About Us
								</Link>
							</li>
							<li>
								<Link
									href="#download"
									className="font-outfit font-normal text-[16px] leading-[20px] text-[#737373] hover:text-[#033604] transition-colors"
								>
									Download App
								</Link>
							</li>
						</ul>
					</div>

					{/* Contact */}
					<div>
						<h5 className="font-outfit font-semibold text-[18px] leading-[20px] text-[#033604] mb-6">
							Contact
						</h5>
						<ul className="space-y-3">
							<li className="font-outfit font-normal text-[16px] leading-[20px] text-[#737373]">
								Email: <a href="mailto:info@volteryde.com" className="hover:text-[#033604] transition-colors">info@volteryde.com</a>
							</li>
							<li className="font-outfit font-normal text-[16px] leading-[20px] text-[#737373]">
								Phone: <a href="tel:+233534544454" className="hover:text-[#033604] transition-colors">(233) 534544454</a>
							</li>
						</ul>
					</div>
				</div>

				{/* Divider */}
				<div className="w-full h-px bg-[#F5F5F5] mb-8" />

				{/* Bottom Bar */}
				<div className="flex flex-col md:flex-row justify-between items-center gap-4">
					{/* Social Icons */}
					<div className="flex gap-6">
						{/* LinkedIn */}
						<a
							href="https://www.linkedin.com/company/volteryde/"
							className="hover:opacity-70 transition-opacity"
							aria-label="LinkedIn"
							target="_blank"
							rel="noopener noreferrer"
						>
							<Image
								src="/icons/linkedin.svg"
								alt="LinkedIn"
								width={24}
								height={24}
								className="w-6 h-6"
							/>
						</a>
						{/* Message/Chat */}
						<a
							href="mailto:info@volteryde.com"
							className="hover:opacity-70 transition-opacity"
							aria-label="Chat"
						>
							<Image
								src="/icons/message.svg"
								alt="Email"
								width={24}
								height={24}
								className="w-6 h-6"
							/>
						</a>
						{/* Twitter/X */}
						<a
							href="https://x.com/volteryde?s=20"
							className="hover:opacity-70 transition-opacity"
							aria-label="Twitter/X"
							target="_blank"
							rel="noopener noreferrer"
						>
							<Image
								src="/icons/x.svg"
								alt="X (Twitter)"
								width={24}
								height={24}
								className="w-6 h-6"
							/>
						</a>
					</div>

					{/* Copyright and Links */}
					<div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
						<p className="font-outfit font-normal text-[14px] leading-[20px] text-[#737373]">
							© 2025 Voltride. All rights reserved.
						</p>
						<Link
							href="/terms"
							className="font-outfit font-normal text-[14px] leading-[20px] text-[#033604] hover:opacity-70 transition-opacity"
						>
							Terms & conditions
						</Link>
						<a
							href={getAuthServiceUrl()}
							className="font-outfit font-normal text-[14px] leading-[20px] text-[#033604] hover:opacity-70 transition-opacity"
							target="_blank"
							rel="noopener noreferrer"
						>
							Employee Portal
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
