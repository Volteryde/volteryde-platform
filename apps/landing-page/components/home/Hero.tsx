'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export function Hero() {
	const features = [
		{ icon: '/icons/bus.svg', label: 'On-Time & Reliable Trips' },
		{ icon: '/icons/location.svg', label: 'Real-Time Tracking' },
		{ icon: '/icons/cash.svg', label: 'Cashless Payments' },
	];

	return (
		<section className="relative h-screen min-h-[600px] w-full overflow-hidden">
			{/* Background Image */}
			<div className="absolute inset-0 z-0">
				<Image
					src="/images/hero.png"
					alt="Volteryde Hero"
					fill
					className="object-cover object-center"
					priority
					quality={100}
				/>
				{/* Overlay for text readability */}
				<div className="absolute inset-0 bg-black/30 md:bg-black/20" />
				<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
			</div>

			<div className="relative z-10 w-full h-full flex flex-col justify-end pb-12 md:pb-24 px-4 sm:px-6 lg:px-16 max-w-[1440px] mx-auto">
				<div className="max-w-4xl">
					{/* Headline */}
					<motion.h1
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
						className="font-poppins font-bold text-4xl sm:text-5xl md:text-6xl lg:text-[64px] lg:leading-[1.1] text-white mb-6 drop-shadow-lg"
					>
						Transforming Ghana's <br className="hidden md:block" />
						Transportation, One <br className="hidden md:block" />
						Electric Ride at a Time
					</motion.h1>

					{/* Subheading */}
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
						className="font-outfit text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mb-12 md:mb-20 leading-relaxed drop-shadow-md"
					>
						Volteryde is redefining public transportation in Ghana with electric buses that are cleaner, smarter, and more reliable — designed for everyday commuters and growing cities.
					</motion.p>
				</div>

				{/* Features Row - Bottom */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
					className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8  pt-8"
				>
					{features.map((feature, index) => (
						<div key={index} className="flex items-center gap-4">
							<div className="bg-white rounded-full p-2 w-12 h-12 flex items-center justify-center shrink-0">
								<Image
									src={feature.icon}
									alt=""
									width={24}
									height={24}
									className="w-6 h-6"
								/>
							</div>
							<span className="font-poppins font-bold text-lg md:text-xl text-white">
								{feature.label}
							</span>
						</div>
					))}
				</motion.div>
			</div>
		</section>
	);
}
