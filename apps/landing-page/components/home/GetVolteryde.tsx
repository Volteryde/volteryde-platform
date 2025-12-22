"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { buttonContainerVariants, buttonVariants, descriptionVariants, titleVariants } from "@/lib/animation";
import { AppStoreBadge, GooglePlayBadge } from "@/components/ui/DownloadBadges";

export default function GetVolteryde() {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, amount: 0.3 });

	return (
		<section
			id="get-volteryde"
			className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white"
			ref={ref}
		>
			<div className="max-w-4xl mx-auto text-center">
				{/* Section Title */}
				<motion.h2
					className="text-4xl md:text-5xl font-black text-[#1D1D1F] mb-4"
					initial="hidden"
					animate={isInView ? "visible" : "hidden"}
					variants={titleVariants}
				>
					Get Volteryde
				</motion.h2>

				{/* Description */}
				<motion.p
					className="text-[#86868B] max-w-full md:max-w-2xl text-center mx-auto text-lg md:text-xl mb-12 leading-relaxed"
					initial="hidden"
					animate={isInView ? "visible" : "hidden"}
					variants={descriptionVariants}
				>
					Join the move toward greener transportation. Download Volteryde and
					ride the future today.
				</motion.p>

				{/* Download Buttons */}
				<motion.div
					className="flex flex-col sm:flex-row gap-4 mb-8 justify-center items-center"
					initial="hidden"
					animate={isInView ? "visible" : "hidden"}
					variants={buttonContainerVariants}
				>
					{/* Play Store Button */}
					<motion.div variants={buttonVariants}>
						<GooglePlayBadge theme="dark" />
					</motion.div>

					{/* App Store Button */}
					<motion.div variants={buttonVariants}>
						<AppStoreBadge theme="dark" />
					</motion.div>
				</motion.div>
			</div>
		</section>
	);
}
