'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Login() {
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Handle Screen Size Check and Splash Timer
  useEffect(() => {
    // Check initial screen size
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 1024);
    };

    // Run immediately
    checkScreenSize();

    // Add event listener
    window.addEventListener('resize', checkScreenSize);

    // Splash Screen Timer
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
      clearTimeout(timer);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    router.push('/dashboard');
  };

  // 1. Small Screen Warning
  if (isSmallScreen) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-900 text-white p-8 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-4">Screen Size Too Small</h1>
          <p className="text-gray-300">
            For the best experience, please view this application on a larger screen (Laptop or Desktop).
          </p>
        </div>
      </div>
    );
  }

  // 2. Splash Screen
  if (showSplash) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0CCF0E] animate-out fade-out duration-500 fill-mode-forwards" style={{ animationDelay: '2.5s' }}>
        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src="/splash.png"
            alt="Volteryde Splash"
            width={800}
            height={600}
            className="object-contain max-w-[80%] max-h-[80%] animate-pulse"
            priority
          />
        </div>
      </div>
    );
  }

  // 4. Loading Overlay (New)
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center">
          <div className="relative w-24 h-24 mb-4">
            {/* Spinning Ring */}
            <div className="absolute inset-0 border-4 border-[#0CCF0E]/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[#0CCF0E] rounded-full border-t-transparent animate-spin"></div>
            {/* Brand Icon Center (Optional) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Image src="/volt.png" alt="V" width={32} height={32} className="object-contain" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Signing you in...</h3>
          <p className="text-gray-500 text-sm mt-2">Preparing your dashboard</p>
        </div>
      </div>
    );
  }

  // 3. Login Screen
  return (
    <div className="relative min-h-screen w-full flex overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/loginbg.png"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        {/* Dark Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 w-full flex flex-col md:flex-row">
        {/* Left Side Content */}
        <div className="flex-1 flex flex-col justify-between p-8 md:p-12 lg:p-16">
          {/* Logo */}
          <div>
            <Image
              src="/logo.png"
              alt="Volteryde Logo"
              width={180}
              height={60}
              className="h-auto w-auto"
            />
          </div>

          {/* Hero Text */}
          <div className="mt-auto max-w-lg mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              Your journey starts here!
            </h1>
            <p className="text-lg text-white/90">
              Easily track your trips updates all in one place.
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-12 lg:p-16">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#033604] mb-2">
                Driver Sign In
              </h2>
              <p className="text-gray-500 text-sm">
                Enter your credentials to access your dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label
                  htmlFor="staffId"
                  className="block text-sm font-semibold text-[#033604] mb-2"
                >
                  Staff ID
                </label>
                <div className="relative">
                  <input
                    id="staffId"
                    name="staffId"
                    type="text"
                    required
                    disabled={loading}
                    placeholder="Enter your staff ID"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    className="block w-full rounded-full border-0 bg-gray-100 py-3.5 px-6 text-gray-900 shadow-sm ring-0 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#0CCF0E] disabled:opacity-50 disabled:cursor-not-allowed sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-[#033604] mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={loading}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-full border-0 bg-gray-100 py-3.5 pl-6 pr-12 text-gray-900 shadow-sm ring-0 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#0CCF0E] disabled:opacity-50 disabled:cursor-not-allowed sm:text-sm sm:leading-6"
                  />
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none disabled:opacity-50"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center rounded-full bg-[#0CCF0E] px-3 py-3.5 text-sm font-bold leading-6 text-white shadow-sm hover:bg-[#0bb00d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0CCF0E] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  Log In
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
