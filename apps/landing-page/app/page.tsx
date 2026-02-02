'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Hero } from '@/components/home/Hero';
import { MissionSection } from '@/components/home/MissionSection';
import { ProblemSection } from '@/components/home/ProblemSection';
import { ImpactSection } from '@/components/home/ImpactSection';
import { BoardSection } from '@/components/home/BoardSection';
import { TeamSection } from '@/components/home/TeamSection';
import GetVolteryde from '@/components/home/GetVolteryde';
import { Footer } from '@/components/layout/Footer';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="relative bg-white min-h-screen overflow-x-hidden">
      <Navbar />
      <Hero />
      <MissionSection />
      <ProblemSection />
      <ImpactSection />

      {/* Board + Team wrapper with shared lightning bolt */}
      <div className="relative bg-white">
        <Image
          src="/branding/lightening.svg"
          alt=""
          width={463}
          height={696}
          className="absolute top-[100px] right-0 z-1 pointer-events-none"
        />
        <BoardSection />
        <TeamSection />
      </div>

      <GetVolteryde />
      <Footer />
    </main>
  );
}
