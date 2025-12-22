"use client";

import Image from "next/image";

const FullLogo = () => {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/applogo.png"
        alt="Volteryde Admin"
        width={40}
        height={40}
        className="object-contain"
      />
      <span className="text-xl font-bold dark:text-white text-dark">
        Volteryde Admin
      </span>
    </div>
  );
};

export default FullLogo;
