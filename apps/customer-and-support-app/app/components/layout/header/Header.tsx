
import { useState, useEffect } from "react";
// import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import Profile from "./Profile";
import { Link } from "react-router";
import FullLogo from "../shared/logo/FullLogo";
// import SidebarLayout from "../sidebar/Sidebar"; // For mobile menu if we implement it

const Header = ({ onMobileSidebarOpen }: { onMobileSidebarOpen?: () => void }) => {
	// const { theme, setTheme } = useTheme();
	const theme = 'light'; // Stub
	const setTheme = (t: string) => console.log('Set theme', t);

	const [isSticky, setIsSticky] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 50) {
				setIsSticky(true);
			} else {
				setIsSticky(false);
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	const toggleMode = () => {
		// setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
	};

	return (
		<header
			className={`sticky top-0 z-[5] ${isSticky ? "bg-white shadow-md w-full" : "bg-transparent"
				} border-b border-gray-100 transition-all duration-300`}
		>
			<nav className="rounded-none py-4 px-6 flex justify-between items-center bg-white dark:bg-gray-900 border-none">

				{/* Mobile Toggle Icon */}
				<div
					onClick={onMobileSidebarOpen}
					className="xl:hidden p-2 rounded-full cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600"
				>
					<Icon icon="tabler:menu-2" height={20} width={20} />
				</div>

				{/* Mobile Logo */}
				<div className="block xl:hidden">
					<Link to="/">
						<img src="/logo1.png" alt="Logo" width={32} height={32} className="object-contain" />
					</Link>
				</div>

				{/* Right Side Actions */}
				<div className="flex items-center gap-4 ml-auto">
					{/* Theme Toggle (Stub) */}
					{/* 
            <button onClick={toggleMode} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                <Icon icon={theme === 'light' ? "tabler:moon" : "solar:sun-bold-duotone"} width={20} />
            </button> 
            */}

					{/* Notifications (Stub) */}
					<div className="relative group p-2 rounded-full hover:bg-gray-100 cursor-pointer">
						<Icon icon="solar:bell-linear" width={22} className="text-gray-500 group-hover:text-[#0CCF0E]" />
						<span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border border-white"></span>
					</div>

					{/* Profile Dropdown */}
					<Profile />
				</div>
			</nav>
		</header>
	);
};

export default Header;
