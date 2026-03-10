"use client";

import Image from "next/image";

const FullLogo = () => {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/logo.svg"
        alt="Volteryde"
        width={40}
        height={40}
        className="object-contain dark:brightness-0 dark:invert"
        unoptimized
      />
      <span className="text-xl font-bold dark:text-white text-dark">
        Dispatcher
      </span>
    </div>
  );
};

export default FullLogo;
