"use client";

import { DOWNLOAD_LINK, NAV_LINKS } from "@/mock";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const mobileLinks = [...NAV_LINKS, DOWNLOAD_LINK];

  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > 32);
    const onResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const isSolid = hasScrolled || isOpen;

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4">
      <nav
        className={`mx-auto w-full max-w-7xl rounded-2xl border transition-all duration-300 ${
          isSolid
            ? "border-[#DCF6DD] bg-white/95 shadow-[0_10px_30px_rgba(3,54,4,0.08)] backdrop-blur-xl"
            : "border-white/30 bg-black/15 shadow-[0_12px_28px_rgba(0,0,0,0.2)] backdrop-blur-xl"
        }`}
      >
        <div className="flex w-full items-center justify-between px-4 py-3 md:px-6">
          <Link
            href="/"
            className="flex items-center"
            aria-label="Volteryde home"
          >
            <Image
              src={isSolid ? "/branding/greenlogo.svg" : "/branding/logo.svg"}
              alt="Volteryde"
              width={120}
              height={24}
              className="h-6 w-auto"
              priority
            />
          </Link>

          <ul className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`font-outfit text-[15px] font-medium leading-5 transition-colors ${
                    isSolid
                      ? "text-[#033604] hover:text-[#0a7d0c]"
                      : "text-white hover:text-white/80"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden md:block">
            <Link
              href={DOWNLOAD_LINK.href}
              className={`inline-flex items-center rounded-full px-5 py-2.5 font-outfit text-sm font-semibold transition-all duration-200 ${
                isSolid
                  ? "bg-[#0CCF0E] text-white hover:bg-[#0bb40d]"
                  : "bg-white text-[#033604] hover:bg-[#f4fff4]"
              }`}
            >
              {DOWNLOAD_LINK.label}
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`rounded-lg p-2 transition-colors md:hidden ${
              isSolid
                ? "text-[#033604] hover:bg-[#F2FFF2]"
                : "text-white hover:bg-white/10"
            }`}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
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
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mx-auto mt-2 w-full max-w-7xl overflow-hidden rounded-2xl border border-[#DDF2DE] bg-white p-3 shadow-[0_10px_30px_rgba(3,54,4,0.12)] md:hidden"
          >
            <div className="space-y-2">
              {mobileLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between rounded-xl  px-3 py-2.5 font-outfit text-base font-medium text-[#033604] transition-colors hover:bg-[#ECFAED]"
                >
                  <span>{link.label}</span>
                  {/* <span className="text-[#0CCF0E]">&#8594;</span> */}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
