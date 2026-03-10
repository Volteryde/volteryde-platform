"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import Profile from "./Profile";
import Notifications from "./Notifications";
import SidebarLayout from "../sidebar/Sidebar";
import FullLogo from "../shared/logo/FullLogo";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const PAGE_TITLES: Record<string, string> = {
  "/live-map":    "Live Map",
  "/assignments": "Assignments",
  "/drivers":     "Drivers",
  "/trips":       "Trips",
  "/buses":       "Buses",
  "/settings":    "Settings",
  "/dashboard":   "Dashboard",
};

function LiveClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="text-sm font-semibold tabular-nums text-dark dark:text-white px-3 select-none">
      {time}
    </span>
  );
}

const Header = () => {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [isSticky, setIsSticky] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMode = () => setTheme((p) => (p === "light" ? "dark" : "light"));

  // Match the current page title (handles nested routes too)
  const pageTitle =
    Object.entries(PAGE_TITLES).find(([key]) => pathname.startsWith(key))?.[1] ?? "";

  return (
    <>
      <header className={`sticky top-0 z-2 ${isSticky ? "bg-background shadow-md" : "bg-transparent"}`}>
        <nav className="py-4 px-6 sm:px-10 dark:bg-dark flex items-center justify-between">

          {/* Left: mobile hamburger OR page title */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setIsOpen(true)}
              className="xl:hidden px-[15px] hover:text-primary dark:hover:text-primary text-link dark:text-darklink relative after:absolute after:w-10 after:h-10 after:rounded-full hover:after:bg-lightprimary after:bg-transparent rounded-full flex justify-center items-center cursor-pointer"
            >
              <Icon icon="tabler:menu-2" height={20} width={20} />
            </div>

            <div className="xl:hidden">
              <FullLogo />
            </div>

            {/* Desktop page title */}
            {pageTitle && (
              <h1 className="hidden xl:block text-xl font-bold text-dark dark:text-white">
                {pageTitle}
              </h1>
            )}
          </div>

          {/* Right: clock → theme → notifications → profile */}
          <div className="flex items-center gap-1">
            <LiveClock />

            <div
              onClick={toggleMode}
              className="hover:text-primary px-3 group focus:ring-0 rounded-full flex justify-center items-center cursor-pointer text-gray relative"
            >
              <span className="flex items-center justify-center relative after:absolute after:w-10 after:h-10 after:rounded-full after:-top-1/2 group-hover:after:bg-lightprimary">
                {theme === "light"
                  ? <Icon icon="tabler:moon" width="20" />
                  : <Icon icon="solar:sun-bold-duotone" width="20" className="group-hover:text-primary" />}
              </span>
            </div>

            <Notifications />
            <Profile />
          </div>

        </nav>
      </header>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <VisuallyHidden><SheetTitle>sidebar</SheetTitle></VisuallyHidden>
          <SidebarLayout onClose={() => setIsOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Header;
