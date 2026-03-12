import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import type { Metadata } from "next";
import { Outfit, Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Volteryde - Transforming Ghana's Transportation",
  description:
    "Experience the future of urban mobility with Volteryde. On-time electric buses, real-time tracking, and cashless payments for a cleaner Ghana.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon-16x16.png",
  },
  openGraph: {
    title: "Volteryde - Transforming Ghana's Transportation",
    description:
      "Experience the future of urban mobility with Volteryde. On-time electric buses, real-time tracking, and cashless payments for a cleaner Ghana.",
    siteName: "Volteryde",
    type: "website",
    images: [
      {
        url: "/OG-IMAGE.png",
        width: 1200,
        height: 630,
        alt: "Volteryde - Electric Bus Transportation in Ghana",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Volteryde - Transforming Ghana's Transportation",
    description:
      "Experience the future of urban mobility with Volteryde. On-time electric buses, real-time tracking, and cashless payments for a cleaner Ghana.",
    images: ["OG-IMAGE.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${outfit.variable}`}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
