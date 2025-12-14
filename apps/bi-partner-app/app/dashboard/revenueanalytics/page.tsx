
"use client"

import React, { useMemo } from "react"
import {
	IconCurrencyDollar,
	IconUsers,
	IconRoute,
	IconArrowUpRight
} from "@tabler/icons-react"
import { WalletLoadingPatternsChart } from "@/components/charts/wallet-loading-patterns-chart"
import { RevenuePerDistanceMetricsChart } from "@/components/charts/revenue-per-distance-metrics-chart"

// Data definition for analysis (mirrors chart data)
const WALLET_DATA = [
	{ day: "Mon", value: 20 },
	{ day: "Tue", value: 40 },
	{ day: "Wed", value: 35 },
	{ day: "Thu", value: 75 },
	{ day: "Fri", value: 20 },
	{ day: "Sat", value: 65 },
	{ day: "Sun", value: 100 },
];

const REVENUE_DATA = [
	{ distance: "0-5km", revenue: 4500 },
	{ distance: "5-10km", revenue: 15000 },
	{ distance: "10-20km", revenue: 24000 },
	{ distance: "20-50km", revenue: 27500 },
	{ distance: "50+km", revenue: 16000 },
];

function generateStrategies(walletData: typeof WALLET_DATA, revenueData: typeof REVENUE_DATA) {
	const strategies = [];

	// 1. Analyze Wallet Loading for Dynamic Trends
	const peakDay = walletData.reduce((prev, current) => (prev.value > current.value) ? prev : current);
	if (peakDay.value > 60) {
		strategies.push({
			title: "Dynamic Base Fare",
			description: "Implement time-based pricing adjustments during peak loading windows.",
			potential: "Potential: +$32K/month"
		});
	}

	// 2. Analyze Distance for Tier Optimization
	const midRangeRevenue = revenueData.find(d => d.distance === "10-20km")?.revenue || 0;
	if (midRangeRevenue > 20000) {
		strategies.push({
			title: "Distance Tier Optimization",
			description: "Adjust pricing for 10-20km range to maximize yield on high volume segments.",
			potential: "Potential: +$28K/month"
		});
	}

	// 3. Analyze Overall Engagement for Wallet Incentives
	// Always relevant for retention
	strategies.push({
		title: "Wallet Incentive Program",
		description: "Encourage higher wallet balances with bonus credits on recharge.",
		potential: "Potential: +$45K/month"
	});

	return strategies;
}

export default function RevenueAnalyticsPage() {
	const strategies = useMemo(() => generateStrategies(WALLET_DATA, REVENUE_DATA), []);

	return (
		<div className="flex flex-1 flex-col h-full w-full bg-white text-black font-sans overflow-y-auto pb-10">

			{/* Header Section */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight text-[#006400]">Enhanced Revenue Analytics</h1>
				<p className="text-neutral-500 mt-1">Deep dive into revenue metrics and optimization strategies</p>
			</div>

			{/* Stats Cards Grid - 4 Columns */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<StatsCard
					title="Revenue/Distance"
					value="¢1.92/km"
					icon={<IconCurrencyDollar className="w-6 h-6 text-white" />}
					trend="+3.5%"
				/>
				<StatsCard
					title="Fare Calculation"
					value="99.2%"
					icon={<IconUsers className="w-6 h-6 text-white" />}
					trend="+0.8%"
				/>
				<StatsCard
					title="Wallet Loading"
					value="¢2.8M"
					icon={<IconCurrencyDollar className="w-6 h-6 text-white" />}
					trend="+15.3%"
				/>
				<StatsCard
					title="Pricing Efficiency"
					value="94.5%"
					icon={<IconRoute className="w-6 h-6 text-white" />}
					trend="+12%"
					label="Pricing Efficiency"
				/>
			</div>

			{/* Charts Grid - 2 Columns */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 h-[400px]">
				<div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-2 h-full">
					<WalletLoadingPatternsChart />
				</div>
				<div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-2 h-full">
					<RevenuePerDistanceMetricsChart />
				</div>
			</div>

			{/* Optimal Pricing Strategies */}
			<div className="w-full bg-white rounded-xl border border-neutral-200 p-8 shadow-sm mt-12">
				<h2 className="text-xl font-bold text-[#006400] mb-6">Optimal Pricing Strategies</h2>

				<div className="space-y-4">
					{strategies.map((strategy, index) => (
						<StrategyCard
							key={index}
							title={strategy.title}
							description={strategy.description}
							potential={strategy.potential}
						/>
					))}
				</div>
			</div>

		</div>
	)
}

function StatsCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string, label?: string }) {
	return (
		<div className="bg-white rounded-xl border border-[#0CCF0E] p-6 shadow-sm relative overflow-hidden h-32 flex flex-col justify-between">
			<div className="flex justify-between items-start">
				<div className="w-10 h-10 rounded-md bg-[#0CCF0E] flex items-center justify-center">
					{icon}
				</div>
				<div className="flex items-center gap-1 text-xs font-bold text-[#0CCF0E]">
					<IconArrowUpRight className="w-3 h-3" />
					{trend}
				</div>
			</div>
			<div>
				<div className="text-2xl font-bold text-black">{value}</div>
				<div className="text-xs text-neutral-500 font-medium">{title}</div>
			</div>
		</div>
	)
}

function StrategyCard({ title, description, potential }: { title: string, description: string, potential: string }) {
	return (
		<div className="bg-[#DCFCE7] rounded-lg p-5">
			<h3 className="text-sm font-bold text-[#003300] mb-1">{title}</h3>
			<p className="text-xs text-[#003300] mb-2">{description}</p>
			<p className="text-xs font-bold text-[#003300]">{potential}</p>
		</div>
	)
}
