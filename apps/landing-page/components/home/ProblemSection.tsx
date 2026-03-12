"use client";

import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";

export function ProblemSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="py-20 bg-white relative overflow-hidden">
      {/* Lightning bolt decoration - bottom left */}
      <Image
        src="/branding/lightening.svg"
        alt=""
        width={463}
        height={696}
        className="absolute -bottom-40 -left-40 z-0 pointer-events-none rotate-180"
      />

      <div className="max-w-6xl mx-auto px-4 md:px-0 relative z-10">
        <div className="flex flex-col-reverse lg:flex-row gap-16 items-center justify-center">
          {/* Left - Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 space-y-12 relative h-full "
          >
            {/* The Problem */}
            <div className="space-y-4">
              <h2 className="font-poppins font-bold text-[40px] leading-12 text-[#033604]">
                The Problem
              </h2>
              <p className="font-outfit font-normal text-[16px] leading-[1.6] text-[#033604]/80 max-w-120">
                As at 2025, public transportation in Ghana remains a daily
                challenge for many commuters. 65% experience long waiting times,
                while 56.7% face poor comfort and safety during their journeys.
                Additionally, 41.9% report unreliable schedules, making it
                difficult to plan trips and rely on public transport for work,
                school, and daily life.
              </p>
            </div>

            {/* The Solution */}
            <div className="space-y-4">
              <h2 className="font-poppins font-bold text-[40px] leading-12 text-[#033604]">
                The Solution
              </h2>
              <p className="font-outfit font-normal text-[16px] leading-[1.6] text-[#033604]/80 max-w-[520px]">
                Introducing Voltride&apos;s electric buses, designed to solve
                Ghana&apos;s public transport challenges. With reliable
                schedules and modern, comfortable vehicles, commuters can say
                goodbye to long waiting times and unsafe rides. Being fully
                electric, these buses eliminate fuel-related issues, reduce
                maintenance delays, and cut down air pollution, providing a
                cleaner, healthier, and more sustainable transportation option
                for urban Ghana.
              </p>
            </div>
          </motion.div>

          {/* Right - Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 w-full"
          >
            <div className="rounded-2xl overflow-hidden">
              <Image
                src="/branding/town.png"
                alt="Ghana Traffic"
                width={560}
                height={480}
                className="w-full h-auto object-cover"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
