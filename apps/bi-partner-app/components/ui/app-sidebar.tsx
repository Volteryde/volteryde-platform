"use client";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
	IconDeviceDesktopAnalytics,
	IconChartDots2,
	IconCreditCard,
	IconBolt,
	IconCurrencyDollar,
	IconArrowLeft,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function AppSidebar({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();

	const links = [
		{
			label: "BI Overview",
			href: "/dashboard",
			icon: (
				<IconDeviceDesktopAnalytics className={cn("h-5 w-5 shrink-0", pathname === "/dashboard" ? "text-white" : "text-neutral-700")} />
			),
		},
		{
			label: "Financial Forecast",
			href: "/dashboard/financialforcast",
			icon: (
				<IconChartDots2 className={cn("h-5 w-5 shrink-0", pathname === "/dashboard/financialforcast" ? "text-white" : "text-neutral-700")} />
			),
		},
		{
			label: "Payment Behavior",
			href: "/dashboard/paymentbehavior",
			icon: (
				<IconCreditCard className={cn("h-5 w-5 shrink-0", pathname === "/dashboard/paymentbehavior" ? "text-white" : "text-neutral-700")} />
			),
		},
		{
			label: "Integration Insights",
			href: "/dashboard/integrationinsights",
			icon: (
				<IconBolt className={cn("h-5 w-5 shrink-0", pathname === "/dashboard/integrationinsights" ? "text-white" : "text-neutral-700")} />
			),
		},
		{
			label: "Revenue Analytics",
			href: "/dashboard/revenueanalytics",
			icon: (
				<IconCurrencyDollar className={cn("h-5 w-5 shrink-0", pathname === "/dashboard/revenueanalytics" ? "text-white" : "text-neutral-700")} />
			),
		},
	];

	const [open, setOpen] = useState(false); // Default to closed, open on hover

	return (
		<div
			className={cn(
				"mx-auto flex w-full flex-1 flex-col overflow-hidden rounded-md border border-neutral-200 bg-white md:flex-row h-screen"
			)}
		>
			<Sidebar open={open} setOpen={setOpen}>
				<SidebarBody className="justify-between gap-10 bg-white border-r border-neutral-200">
					<div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
						{open ? <Logo /> : <LogoIcon />}
						<div className="mt-8 flex flex-col gap-2">
							{links.map((link, idx) => {
								const isActive = pathname === link.href;
								return (
									<SidebarLink
										key={idx}
										link={link}
										className={cn(
											"rounded-md px-2 transition-colors",
											isActive
												? "bg-[#0CCF0E] text-white hover:bg-[#0bb00d]"
												: "hover:bg-gray-100 text-neutral-700"
										)}
									/>
								);
							})}
						</div>
					</div>
					<div>
						{/* Logout Link */}
						<SidebarLink
							link={{
								label: "Logout",
								href: "/",
								icon: <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700" />
							}}
							className="hover:bg-gray-100 rounded-md px-2"
						/>
					</div>
				</SidebarBody>
			</Sidebar>
			<div className="flex flex-1 bg-white">
				<div className="flex h-full w-full flex-1 flex-col gap-2 rounded-tl-2xl bg-white p-2 md:p-10 overflow-y-auto border-neutral-200">
					{children}
				</div>
			</div>
		</div>
	);
}

export const Logo = () => {
	return (
		<div className="relative z-20 flex flex-col items-center gap-2 py-6 border-b border-neutral-100 w-full mb-6">
			<Image src="/vlogo.png" width={180} height={80} alt="Volteryde" className="h-20 w-auto object-contain" />
			<div className="flex flex-col items-center text-center mt-2">
				<h1 className="text-sm font-bold text-[#003300] leading-tight">Business Intelligence</h1>
				<span className="text-[10px] text-neutral-500 font-normal">Partner Intelligence Dashboard</span>
			</div>
		</div>
	);
};

export const LogoIcon = () => {
	return (
		<div className="relative z-20 flex items-center justify-center py-1">
			<Image src="/vlogo.png" width={40} height={40} alt="Volteryde" className="h-8 w-auto object-contain" />
		</div>
	);
};
