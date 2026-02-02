'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
	const [isOpen, setIsOpen] = useState(false);

	const navLinks = [
		{ href: '/', label: 'Home' },
		{ href: '#board', label: 'About us' },
		{ href: '#download', label: 'Download App' },
	];

	return (
		<header className="fixed top-0 left-0 right-0 z-50">
			<nav className="w-full px-6 md:px-16 py-3">
				<div className="flex items-center justify-between">
					{/* Logo - White version for transparent header */}
					<Link href="/" className="flex items-center">
						<Image
							src="/branding/logo.svg"
							alt="Volteryde"
							width={120}
							height={24}
							className="h-6 w-auto"
							priority
						/>
					</Link>

					{/* Desktop Navigation */}
					<div className="hidden md:flex items-center gap-10">
						{navLinks.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className="font-outfit font-medium text-base text-white hover:text-white/80 transition-colors leading-5"
							>
								{link.label}
							</Link>
						))}
					</div>

					{/* Mobile Menu Button */}
					<button
						onClick={() => setIsOpen(!isOpen)}
						className="md:hidden p-2 text-white"
						aria-label="Toggle menu"
					>
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							{isOpen ? (
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							) : (
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 6h16M4 12h16M4 18h16"
								/>
							)}
						</svg>
					</button>
				</div>

				{/* Mobile Menu */}
				<AnimatePresence>
					{isOpen && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							exit={{ opacity: 0, height: 0 }}
							className="md:hidden overflow-hidden bg-black/50 backdrop-blur-md rounded-lg mt-4"
						>
							<div className="py-4 px-4 space-y-4">
								{navLinks.map((link) => (
									<Link
										key={link.href}
										href={link.href}
										onClick={() => setIsOpen(false)}
										className="block font-outfit font-medium text-white hover:text-white/80 transition-colors py-2"
									>
										{link.label}
									</Link>
								))}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</nav>
		</header>
	);
}
