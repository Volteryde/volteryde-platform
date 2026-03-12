"use client";

import { BoardSection } from "@/components/home/BoardSection";
import GetVolteryde from "@/components/home/GetVolteryde";
import { Hero } from "@/components/home/Hero";
import { ImpactSection } from "@/components/home/ImpactSection";
import { MissionSection } from "@/components/home/MissionSection";
import { ProblemSection } from "@/components/home/ProblemSection";
import { TeamSection } from "@/components/home/TeamSection";
import Image from "next/image";

export default function Home() {
  return (
    <main className="relative bg-white min-h-screen overflow-x-hidden">
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
          className="absolute top-25 right-0 z-1 pointer-events-none"
        />
        <BoardSection />
        <TeamSection />
      </div>

      <GetVolteryde />
    </main>
  );
}
