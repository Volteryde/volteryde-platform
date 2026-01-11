'use client';

import Image from "next/image";
import { useUser } from "@/providers/AuthProvider";

const ProfileWelcome = () => {
    const user = useUser();

    // Get first name from auth context, fallback to "there" if not available
    const firstName = user?.firstName || "there";
    const avatarUrl = user?.avatarUrl || "/images/profile/user-1.jpg";

    return (
        <div className="relative flex items-center justify-between bg-lightsecondary rounded-lg p-6">
            <div className="flex items-center gap-3">
                <div>
                    <Image
                        src={avatarUrl}
                        alt="user-img"
                        width={50}
                        height={50}
                        className="rounded-full"
                        unoptimized={avatarUrl.startsWith('http')}
                    />
                </div>
                <div className="flex flex-col gap-0.5">
                    <h5 className="card-title">Welcome back, {firstName}! 👋</h5>
                    <p className="text-link/80 dark:text-white/80">Check your reports</p>
                </div>
            </div>
            <div className="hidden sm:block absolute right-8 bottom-0">
                <Image src={"/images/dashboard/customer-support-img.png"} alt="support-img" width={145} height={95} />
            </div>
        </div>
    );
};

export default ProfileWelcome;