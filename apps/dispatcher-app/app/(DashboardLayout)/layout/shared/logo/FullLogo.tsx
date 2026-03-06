"use client";

import Image from "next/image";

const FullLogo = () => {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/applogo.png"
        alt="Volteryde Dispatcher"
        width={40}
        height={40}
        className="object-contain"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      <span className="text-xl font-bold dark:text-white text-dark">
        Dispatcher
      </span>
    </div>
  );
};

export default FullLogo;
