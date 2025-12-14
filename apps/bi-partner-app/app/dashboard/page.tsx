import React from "react";
import {
	IconCurrencyDollar,
	IconUsers,
	IconWallet,
	IconBrandZeit,
	IconArrowUpRight,
	IconArrowDownRight
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export default function OverviewPage() {
	return (
		<div className="flex flex-1 flex-col h-full w-full bg-white text-black font-sans">
			{/* Header Section */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight text-[#006400]">Business Intelligence Overview</h1>
				<p className="text-neutral-500 mt-1">Real-time insights into your mobility platform performance</p>
			</div>

			{/* Cards Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<StatsCard
					title="Total Revenue"
					value="¢389.2k"
					trend="+ 12%"
					trendUp={true}
					icon={<IconCurrencyDollar className="w-6 h-6 text-white" />}
				/>
				<StatsCard
					title="Active Users"
					value="28,450"
					trend="+ 8.3%"
					trendUp={true}
					icon={<IconUsers className="w-6 h-6 text-white" />}
				/>
				<StatsCard
					title="Avg Wallet Balance"
					value="¢142.50"
					trend="+ 12%"
					trendUp={true}
					icon={<IconWallet className="w-6 h-6 text-white" />}
				/>
				<StatsCard
					title="Trip Volume"
					value="9,070"
					trend="- 12%"
					trendUp={false}
					icon={<IconBrandZeit className="w-6 h-6 text-white" />}
				/>
			</div>

			{/* Chart Section */}
			<div className="w-full bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
				<h2 className="text-xl font-bold text-[#006400] mb-6">Revenue vs Forecast</h2>

				{/* Simple CSS Chart Placeholder to match functionality without Recharts for now */}
				<div className="relative h-64 w-full flex items-end justify-between px-4 pb-4 border-l border-b border-neutral-200">
					{/* Y-Axis Labels */}
					<div className="absolute -left-12 top-0 bottom-0 flex flex-col justify-between text-xs text-neutral-400 py-2">
						<span>60000</span>
						<span>40000</span>
						<span>20000</span>
						<span>0</span>
					</div>

					{/* Chart Content Area - simulating the look */}
					<div className="w-full h-full relative">
						{/* Grid lines */}
						<div className="absolute top-0 w-full h-px bg-neutral-100"></div>
						<div className="absolute top-1/3 w-full h-px bg-neutral-100"></div>
						<div className="absolute top-2/3 w-full h-px bg-neutral-100"></div>

						{/* Trend Lines (SVG) */}
						<svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
							{/* Green Line (Revenue) */}
							<path
								d="M0,150 C100,160 200,140 300,80 C400,60 500,70 600,100"
								fill="none"
								stroke="#0CCF0E"
								strokeWidth="2"
								className="drop-shadow-sm"
							/>
							{[
								{ x: 0, y: 150 }, { x: 150, y: 160 }, { x: 300, y: 80 }, { x: 450, y: 70 }, { x: 600, y: 100 }
							].map((p, i) => (
								<circle key={'g' + i} cx={p.x} cy={p.y} r="3" fill="#0CCF0E" />
							))}

							{/* Grey Line (Forecast) */}
							<path
								d="M0,180 C100,150 200,110 300,100 C400,110 500,80 600,50"
								fill="none"
								stroke="#A3A3A3"
								strokeWidth="2"
								strokeDasharray="4 4"
							/>
							{[
								{ x: 0, y: 180 }, { x: 150, y: 150 }, { x: 300, y: 100 }, { x: 450, y: 110 }, { x: 600, y: 50 }
							].map((p, i) => (
								<circle key={'b' + i} cx={p.x} cy={p.y} r="3" fill="#A3A3A3" />
							))}
						</svg>
					</div>

					{/* X-Axis Labels */}
					<div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-neutral-400 px-4">
						<span>0</span>
						<span>Jan</span>
						<span>Feb</span>
						<span>Mar</span>
						<span>Apr</span>
						<span>May</span>
						<span>Jun</span>
					</div>
				</div>

				{/* Legend */}
				<div className="flex gap-4 mt-8 ml-4">
					<div className="flex items-center gap-2">
						<div className="w-2 h-2 rounded-full bg-[#0CCF0E]"></div>
						<span className="text-xs font-semibold text-neutral-700">Revenue</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-2 h-2 rounded-full bg-neutral-400"></div>
						<span className="text-xs font-semibold text-neutral-700">Forecast</span>
					</div>
				</div>
			</div>
		</div>
	);
}

function StatsCard({
	title,
	value,
	trend,
	trendUp,
	icon
}: {
	title: string,
	value: string,
	trend: string,
	trendUp: boolean,
	icon: React.ReactNode
}) {
	return (
		<div className="flex flex-col p-6 bg-white rounded-xl border border-neutral-200 shadow-sm relative overflow-hidden h-40 justify-between">
			<div className="flex justify-between items-start">
				<div className={cn(
					"w-10 h-10 rounded-md flex items-center justify-center shadow-sm",
					trendUp ? "bg-[#0CCF0E]" : "bg-[#0CCF0E]" // Using green base for brand consistency as per image, icon differs
				)}>
					{icon}
				</div>
				<div className={cn(
					"flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
					trendUp ? "text-[#006400]" : "text-red-500"

				)}>
					{trendUp ? <IconArrowUpRight className="w-3 h-3" /> : <IconArrowDownRight className="w-3 h-3" />}
					{trend}
				</div>
			</div>

			<div>
				<h3 className="text-3xl font-bold text-neutral-800">{value}</h3>
				<p className="text-xs font-medium text-neutral-500 mt-1">{title}</p>
			</div>
		</div>
	);
}
