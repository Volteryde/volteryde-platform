"use client";

import { boardMembers } from "@/mock";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

// Returns responsive slide width % and centering offset %
function useSlideWidth() {
  const [config, setConfig] = useState({ slideWidth: 80, offset: 10, gap: 16 });

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 768) {
        // md tablets — show ~42% per card, center active
        setConfig({ slideWidth: 42, offset: 29, gap: 20 });
      } else if (w >= 640) {
        // sm tablets — show ~55% per card
        setConfig({ slideWidth: 55, offset: 22.5, gap: 16 });
      } else {
        // mobile — show ~80% per card
        setConfig({ slideWidth: 80, offset: 10, gap: 16 });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return config;
}

export function BoardSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const [activeIndex, setActiveIndex] = useState(0);
  const startX = useRef(0);
  const isDragging = useRef(false);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { slideWidth, offset, gap } = useSlideWidth();

  const goTo = useCallback((index: number) => {
    setActiveIndex(Math.max(0, Math.min(index, boardMembers.length - 1)));
  }, []);

  const goToWrapped = useCallback((index: number) => {
    setActiveIndex((index + boardMembers.length) % boardMembers.length);
  }, []);

  const resetAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % boardMembers.length);
    }, 3000);
  }, []);

  // Start autoplay when section comes into view
  useEffect(() => {
    if (!isInView) return;
    resetAutoPlay();
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isInView, resetAutoPlay]);

  const handleInteraction = (fn: () => void) => {
    fn();
    resetAutoPlay(); // reset timer on manual interaction
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const diff = startX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40)
      handleInteraction(() => goToWrapped(activeIndex + (diff > 0 ? 1 : -1)));
    isDragging.current = false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    isDragging.current = true;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const diff = startX.current - e.clientX;
    if (Math.abs(diff) > 40)
      handleInteraction(() => goToWrapped(activeIndex + (diff > 0 ? 1 : -1)));
    isDragging.current = false;
  };

  return (
    <section
      id="board"
      ref={ref}
      className="relative scroll-mt-28 py-16 sm:py-20 md:py-28 overflow-hidden z-10"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-150 h-150 rounded-full bg-[#0CCF0E]/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 md:px-0">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 sm:mb-16 text-center"
        >
          <p className="mb-3 font-outfit text-xs font-semibold uppercase tracking-[0.25em] text-[#0CCF0E]">
            Leadership
          </p>
          <h2 className="font-poppins text-4xl font-bold leading-tight text-[#033604] sm:text-5xl md:text-6xl">
            Meet the{" "}
            <span className="relative inline-block">
              Board
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 8"
                fill="none"
              >
                <path
                  d="M2 6 Q100 1 198 6"
                  stroke="#0CCF0E"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h2>
        </motion.div>

        {/* Mobile / Tablet: Auto-scrolling Peek Carousel */}
        <div className="lg:hidden">
          <div
            className="relative select-none cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              isDragging.current = false;
            }}
          >
            <motion.div
              className="flex items-stretch"
              style={{ gap: `${gap}px` }}
              animate={{
                x: `calc(${-activeIndex * slideWidth}% - ${activeIndex * gap}px + ${offset}%)`,
              }}
              transition={{ type: "spring", stiffness: 280, damping: 32 }}
            >
              {boardMembers.map((member, index) => {
                const isActive = index === activeIndex;
                return (
                  <motion.div
                    key={member.name}
                    onClick={() => handleInteraction(() => goTo(index))}
                    animate={{
                      scale: isActive ? 1 : 0.9,
                      opacity: isActive ? 1 : 0.45,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="shrink-0"
                    style={{ width: `${slideWidth}%` }}
                  >
                    <div
                      className={`relative overflow-hidden rounded-3xl transition-shadow duration-300 ${isActive ? "shadow-2xl shadow-[#033604]/15" : "shadow-md"}`}
                    >
                      <div
                        className="relative w-full"
                        style={{ paddingBottom: "133.33%" }}
                      >
                        <Image
                          src={member.image}
                          alt={member.name}
                          fill
                          className="object-cover object-top"
                          draggable={false}
                          sizes="(max-width: 640px) 80vw, (max-width: 768px) 55vw, (max-width: 1024px) 42vw, 25vw"
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-[#033604]/90 via-[#033604]/40 to-transparent px-5 pb-5 pt-14">
                        <h3 className="font-poppins text-lg font-bold text-white leading-tight">
                          {member.name}
                        </h3>
                        <p className="mt-1 font-outfit text-sm text-[#0CCF0E] font-medium">
                          {member.title}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Controls */}
          <div className="mt-6 sm:mt-8 flex items-center justify-between px-2">
            <div className="font-outfit text-xs sm:text-sm font-medium text-[#033604]/40">
              <span className="text-xl sm:text-2xl font-bold text-[#033604]">
                {String(activeIndex + 1).padStart(2, "0")}
              </span>{" "}
              / {String(boardMembers.length).padStart(2, "0")}
            </div>

            {/* Animated progress bar that resets with each slide */}
            <div className="flex-1 mx-3 sm:mx-6 h-0.5 rounded-full bg-[#033604]/10 overflow-hidden">
              <motion.div
                key={activeIndex}
                className="h-full rounded-full bg-[#0CCF0E]"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "linear" }}
              />
            </div>

            <div className="flex gap-1.5 sm:gap-2">
              <button
                onClick={() =>
                  handleInteraction(() => goToWrapped(activeIndex - 1))
                }
                className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full border-2 border-[#033604]/15 text-[#033604] transition-all duration-200 hover:border-[#0CCF0E] hover:bg-[#0CCF0E] hover:text-white"
                aria-label="Previous"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="sm:w-4 sm:h-4">
                  <path
                    d="M10 12L6 8L10 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                onClick={() =>
                  handleInteraction(() => goToWrapped(activeIndex + 1))
                }
                className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full border-2 border-[#033604]/15 text-[#033604] transition-all duration-200 hover:border-[#0CCF0E] hover:bg-[#0CCF0E] hover:text-white"
                aria-label="Next"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="sm:w-4 sm:h-4">
                  <path
                    d="M6 4L10 8L6 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop: Grid */}
        <div className="hidden lg:grid grid-cols-4 gap-6 xl:gap-8">
          {boardMembers.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: 0.1 * index,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group relative"
            >
              <div className="relative overflow-hidden rounded-3xl shadow-md transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-[#033604]/10">
                <div
                  className="relative w-full"
                  style={{ paddingBottom: "133.33%" }}
                >
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    sizes="(min-width: 1024px) 25vw"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-[#033604]/90 via-[#033604]/40 to-transparent px-5 pb-5 pt-14 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="font-poppins text-base font-bold text-white leading-tight">
                    {member.name}
                  </h3>
                  <p className="mt-1 font-outfit text-sm text-[#0CCF0E] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {member.title}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
