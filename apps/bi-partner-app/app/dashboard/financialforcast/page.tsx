import React from "react";
import {
	IconTrendingUp,
	IconCalendarEvent,
	IconNavigation,
	IconArrowUpRight,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { TripDistanceChart } from "@/components/charts/trip-distance-chart";
import { SeasonalDemandChart } from "@/components/charts/seasonal-demand-chart";

export default function FinancialForecastPage() {
	return (
		<div className="flex flex-1 flex-col h-full w-full bg-white text-black font-sans overflow-y-auto pb-10">
			{/* Header Section */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight text-[#006400]">Financial Forecasting</h1>
				<p className="text-neutral-500 mt-1">Predict demand patterns and revenue optimization opportunities</p>
			</div>

			{/* Cards Grid */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				<ForecastCard
					title="Forecasted Revenue"
					value="¢489.2k"
					trend="+ 6.1%"
					icon={<IconTrendingUp className="w-6 h-6 text-white" />}
				/>
				<ForecastCard
					title="Seasonal Peak"
					value="Q4 2025"
					trend="High Demand"
					icon={<IconCalendarEvent className="w-6 h-6 text-white" />}
				/>
				<ForecastCard
					title="Avg Trip Distance"
					value="12.4 km"
					trend="+ 3.2%"
					icon={<IconNavigation className="w-6 h-6 text-white" />}
				/>
			</div>

			{/* Seasonal Demand Patterns Chart */}
			<div className="w-full bg-white rounded-xl border border-neutral-200 p-8 shadow-sm mb-8 relative">
				<h2 className="text-2xl font-bold text-[#006400] mb-8">Seasonal Demand Patterns</h2>
				<div className="w-full">
					<SeasonalDemandChart />
				</div>
			</div>

			{/* Trip Distance Analysis Chart */}
			<div className="mb-8">
				<TripDistanceChart />
			</div>
		</div>
	);
}

function ForecastCard({
	title,
	value,
	trend,
	icon
}: {
	title: string,
	value: string,
	trend: string,
	icon: React.ReactNode
}) {
	return (
		<div className="bg-white rounded-xl border border-neutral-200 p-6 flex flex-col justify-between h-40 shadow-sm relative overflow-hidden">
			<div className="flex justify-between items-start">
				<div className="w-10 h-10 rounded-md bg-[#0CCF0E] flex items-center justify-center shadow-sm">
					{icon}
				</div>
				<div className="flex items-center gap-1 text-xs font-semibold text-[#006400]">
					<IconArrowUpRight className="w-3 h-3" />
					{trend}
				</div>
			</div>
			<div>
				<h3 className="text-3xl font-bold text-neutral-800 tracking-tight">{value}</h3>
				<p className="text-xs font-semibold text-neutral-500 mt-1">{title}</p>
			</div>
		</div>
	)
}
