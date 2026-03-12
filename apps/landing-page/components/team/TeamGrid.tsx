"use client";

import { teamMembers } from "@/mock";
import { motion } from "framer-motion";
import Image from "next/image";

export function TeamGrid() {
  return (
    <section className="py-10 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 max-w-[1400px] mx-auto">
      <div className="mb-8 sm:mb-16 md:mb-20 lg:mb-24 text-center">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#1D1D1F] mb-2 sm:mb-4">
          The Minds Behind the Current.
        </h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 sm:gap-x-8 sm:gap-y-16 md:gap-y-20 lg:gap-y-24 md:gap-x-12 justify-items-center sm:justify-items-stretch">
        {teamMembers.map((member, i) => (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: i * 0.1,
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="group cursor-default w-full max-w-[150px] sm:max-w-none"
          >
            {/* Image Container */}
            <div className="relative aspect-square sm:aspect-3/4 mb-3 sm:mb-6 overflow-hidden bg-[#F5F5F7] rounded-lg sm:rounded-[4px]">
              <Image
                src={member.image}
                alt={member.name}
                fill
                className="object-cover filter grayscale contrast-125 group-hover:grayscale-0 group-hover:contrast-100 transition-all duration-700 ease-in-out"
              />
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div>
                <h3 className="text-[#1D1D1F] font-bold text-xs sm:text-xl">
                  {member.name}
                </h3>
                <p className="text-[#86868B] text-[10px] sm:text-sm font-medium">
                  {member.role}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
