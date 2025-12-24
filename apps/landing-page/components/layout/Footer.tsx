import Link from 'next/link';
import { AppStoreBadge, GooglePlayBadge } from '@/components/ui/DownloadBadges';

export function Footer() {
	return (
		<footer className="w-full bg-[#0CCF0E] pt-24 pb-12 border-t border-black/5 font-sans">
			<div className="max-w-[1400px] mx-auto px-6 flex flex-col gap-16">

				{/* Top Section: Main Content */}
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">

					{/* Brand Column (Span 5) */}
					<div className="lg:col-span-5 space-y-8">
						<div className="space-y-6">
							<img src="/vlogo.png" alt="Volteryde" className="h-8 w-auto brightness-0" />
							<p className="max-w-sm text-black/90 font-medium leading-relaxed text-sm">
								The silent revolution is here. Experience the future of urban mobility today.
							</p>
						</div>

						{/* App Store Buttons */}
						<div className="flex flex-col sm:flex-row gap-3">
							<AppStoreBadge theme="light" className="shadow-sm" />
							<GooglePlayBadge theme="light" className="shadow-sm" />
						</div>
					</div>

					{/* Links Grid (Span 7) */}
					<div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-2 gap-8 md:gap-12 text-sm text-[#052605]">

						{/* Company */}
						<div className="space-y-6">
							<h5 className="text-black font-bold uppercase tracking-wider text-xs">Company</h5>
							<ul className="space-y-4 font-medium">
								<li><Link href="/about" className="hover:text-black/70 transition-colors">About Us</Link></li>
								<li><Link href="/sustainability" className="hover:text-black/70 transition-colors">Sustainability</Link></li>
							</ul>
							{/* Social Links */}
							<div className="flex gap-4 pt-2">
								<Link href="#" className="hover:scale-110 transition-transform hover:text-black/70 p-1">
									<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
										<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
									</svg>
								</Link>
								<Link href="#" className="hover:scale-110 transition-transform hover:text-black/70 p-1">
									<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
										<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
									</svg>
								</Link>
								<Link href="#" className="hover:scale-110 transition-transform hover:text-black/70 p-1">
									<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
										<path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
									</svg>
								</Link>
							</div>
						</div>

						{/* Legal */}
						<div className="space-y-6">
							<h5 className="text-black font-bold uppercase tracking-wider text-xs">Legal</h5>
							<ul className="space-y-4 font-medium">
								<li><Link href="/legal/privacy" className="hover:text-black/70 transition-colors">Privacy Policy</Link></li>
								<li><Link href="/legal/terms" className="hover:text-black/70 transition-colors">Terms of Service</Link></li>
							</ul>
						</div>

					</div>
				</div>

				{/* Bottom Section: Copyright */}
				<div className="pt-8 border-t border-black/10 flex flex-col md:flex-row justify-between items-end md:items-center gap-4 text-xs font-semibold text-black/60">
					<p>© 2025 Volteryde Inc. All systems nominal.</p>

					<a
						href={process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3007'}
						className="hover:text-black/100 transition-colors mr-1"
						target="_blank"
						rel="noopener noreferrer"
					>
						Employee Portal
					</a>
				</div>

			</div>
		</footer>
	);
}
