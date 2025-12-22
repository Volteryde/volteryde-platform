'use client';

import { Hero } from '@/components/home/Hero';
import { BentoGrid } from '@/components/home/BentoGrid';
import { SocialProof } from '@/components/home/SocialProof';
import { EnergyBeam } from '@/components/ui/EnergyBeam';
import GetVolteryde from '@/components/home/GetVolteryde';
import { Footer } from '@/components/layout/Footer';

export default function Home() {

  return (
    <main className="relative bg-white min-h-screen flex flex-col items-center overflow-hidden">

      {/* Narrative Energy Beam - Central Vertical Line */}
      <EnergyBeam />

      <Hero />
      <SocialProof />
      <BentoGrid />
      <GetVolteryde />

      <Footer />
    </main>
  );
}
