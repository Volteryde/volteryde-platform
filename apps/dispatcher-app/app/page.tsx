import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import LoginForm from "@/components/Login/LoginForm";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-black text-black dark:text-white font-sans">
      {/* Left Side - Visual/Branding */}
      <div className="hidden lg:flex w-1/2 bg-[#0CCF0E] relative items-center justify-center overflow-hidden">
        {/* Background Effect */}
        <div className="absolute inset-0 z-0">
          <BackgroundRippleEffect
            rows={15}
            cols={15}
            cellSize={50}
          />
        </div>

        <div className="relative z-20 flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex items-center justify-center">
            {/* Using a relative path for the image, assuming it's in public folder as logo.png or similar */}
            {/* The user used '/logo1.png' in bi-partner-app, assuming similar asset exists or we use 'logo.png' we saw in admin dashboard */}
            {/* I saw logo.png in admin-dashboard, let's assume logo.png or similar exists. Wait, I copied favicon assets but did I copy logo? */}
            {/* I copied ALL from favicon_io_internal-apps. Let me check what was there. */}
            {/* logo.png was updated in admin-dashboard. */}
            {/* Let's try /logo.png first, if not I will default to text */}
            <Image
              src="/android-chrome-512x512.png"
              alt="Volteryde Logo"
              width={600}
              height={300}
              className="w-auto h-48 object-contain"
              priority
            />
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 relative bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo (Visible only on small screens) */}
          <div className="lg:hidden flex justify-center mb-6">
            <div className="p-4 bg-[#0CCF0E]/10 rounded-2xl">
              <Image src="/android-chrome-192x192.png" width={120} height={120} alt="Volteryde" className="w-auto h-16 object-contain" />
            </div>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
