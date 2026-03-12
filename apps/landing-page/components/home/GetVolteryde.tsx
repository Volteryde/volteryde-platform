"use client";

import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";

export default function GetVolteryde() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section id="download" ref={ref} className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#0CCF0E] rounded-4xl sm:rounded-[48px] lg:rounded-[64px] relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between px-8 sm:px-12 lg:px-20 xl:px-32 pt-12 sm:pt-14 lg:pt-16">
            {/* Left - Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-5 items-center text-center lg:items-start lg:text-left max-w-lg pb-10 lg:pb-16"
            >
              <h2 className="font-poppins font-bold text-3xl sm:text-4xl lg:text-[40px] leading-tight text-white">
                Be part of a Cleaner Future
              </h2>

              <p className="font-outfit font-normal text-base sm:text-lg text-white/95 leading-relaxed">
                Volteryde is transforming public transport with electric buses
                that put sustainability first. Join us in building cleaner
                cities — start your journey with the Voltride app.
              </p>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white px-8 py-4 rounded-4xl hover:bg-gray-50 active:scale-95 transition-all duration-200"
              >
                <span className="font-poppins font-medium text-base sm:text-lg text-[#033604]">
                  Download App
                </span>
              </motion.button>
            </motion.div>

            {/* Right - Phone Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex justify-center lg:justify-end items-end self-end shrink-0"
            >
              <Image
                src="/branding/phone.png"
                alt="Volteryde App"
                width={1200}
                height={1200}
                priority
                quality={100}
                className="object-contain w-48 sm:w-56 lg:w-72 xl:w-92.25 h-auto"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
