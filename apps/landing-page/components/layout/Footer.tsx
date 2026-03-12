"use client";

import { fadeIn, fadeUp, staggerContainer, staggerItem } from "@/lib/animation";
import { bottomLinks, contactItems, quickLinks, socialLinks } from "@/mock";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full bg-white py-16 font-outfit overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-0">
        {/* Main Footer Content */}
        <div className="flex flex-col lg:flex-row justify-between gap-12 mb-8">
          {/* Brand Column */}
          <motion.div
            className="max-w-[256px]"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={0}
          >
            <div className="flex flex-col items-start gap-4 mb-4">
              {/* Logo */}
              <Image
                src="/branding/greenlogo.svg"
                alt="Volteryde"
                width={72}
                height={45}
                className="h-11.25 w-auto"
              />
            </div>
            <p className="font-outfit font-normal text-[16px] leading-5 text-[#737373] opacity-50">
              VolteRyde builds public transportation, connecting riders through
              fixed stops with efficient routing and predictable travel.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={1}
          >
            <h5 className="font-outfit font-semibold text-[18px] leading-5 text-[#033604] mb-6">
              Quick Links
            </h5>
            <motion.ul
              className="space-y-4"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {quickLinks.map((item) => (
                <motion.li key={item.label} variants={staggerItem}>
                  <Link
                    href={item.href}
                    className="font-outfit font-normal text-[16px] leading-5 text-[#737373] hover:text-[#033604] transition-colors"
                  >
                    {item.label}
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={2}
          >
            <h5 className="font-outfit font-semibold text-[18px] leading-5 text-[#033604] mb-6">
              Contact
            </h5>
            <motion.ul
              className="space-y-3"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {contactItems.map((item) => (
                <motion.li
                  key={item.label}
                  className="font-outfit font-normal text-[16px] leading-5 text-[#737373]"
                  variants={staggerItem}
                >
                  {item.label}{" "}
                  <Link
                    href={item.href}
                    className="hover:text-[#033604] transition-colors"
                  >
                    {item.text}
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        </div>

        {/* Divider */}
        <motion.div
          className="w-full h-px bg-[#F5F5F5] mb-8"
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
        />

        {/* Bottom Bar */}
        <motion.div
          className="flex flex-col md:flex-row justify-between items-center gap-4"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          custom={0}
        >
          {/* Social Icons */}
          <motion.div
            className="flex gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {socialLinks.map((item) => (
              <motion.div key={item.label} variants={staggerItem}>
                <Link
                  href={item.href}
                  className="hover:opacity-70 transition-opacity"
                  aria-label={item.label}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                >
                  <Image
                    src={item.iconSrc}
                    alt={item.iconAlt}
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Copyright and Links */}
          <motion.div
            className="flex flex-col md:flex-row items-center gap-4 md:gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.p
              className="font-outfit font-normal text-[14px] leading-5 text-[#737373]"
              variants={staggerItem}
            >
              © 2025 Voltride. All rights reserved.
            </motion.p>
            {bottomLinks.map((item) => (
              <motion.div key={item.label} variants={staggerItem}>
                <Link
                  href={item.href}
                  className="font-outfit font-normal text-[14px] leading-5 text-[#033604] hover:opacity-70 transition-opacity"
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
}
