import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import LoginForm from "@/components/Login/LoginForm";

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
            <img
              src="/android-chrome-512x512.png"
              alt="Volteryde Logo"
              width={600}
              height={300}
              className="w-auto h-48 object-contain"
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
              <img src="/android-chrome-192x192.png" width={120} height={120} alt="Volteryde" className="w-auto h-16 object-contain" />
            </div>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
