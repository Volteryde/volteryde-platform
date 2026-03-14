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

	const peakDay = walletData.reduce((prev, current) => (prev.value > current.value) ? prev : current);
	if (peakDay.value > 60) {
		strategies.push({
			title: "Dynamic Base Fare",
			description: "Implement time-based pricing adjustments during peak loading windows.",
			potential: "Potential: +$32K/month"
		});
	}

	const midRangeRevenue = revenueData.find(d => d.distance === "10-20km")?.revenue || 0;
	if (midRangeRevenue > 20000) {
		strategies.push({
			title: "Distance Tier Optimization",
			description: "Adjust pricing for 10-20km range to maximize yield on high volume segments.",
			potential: "Potential: +$28K/month"
		});
	}

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
		<div className="flex flex-1 flex-col h-full w-full bg-background text-foreground font-sans p-6 overflow-y-auto pb-10">

			{/* Header Section */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight text-primary">Enhanced Revenue Analytics</h1>
				<p className="text-muted-foreground mt-1">Deep dive into revenue metrics and optimization strategies</p>
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
				/>
			</div>

			{/* Charts Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 h-[400px]">
				<div className="bg-card rounded-xl border border-border shadow-md p-2 h-full">
					<WalletLoadingPatternsChart />
				</div>
				<div className="bg-card rounded-xl border border-border shadow-md p-2 h-full">
					<RevenuePerDistanceMetricsChart />
				</div>
			</div>

			{/* Optimal Pricing Strategies */}
			<div className="w-full bg-card rounded-xl border border-border p-8 shadow-md mt-12">
				<h2 className="text-xl font-bold text-primary mb-6">Optimal Pricing Strategies</h2>

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

function StatsCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
	return (
		<div className="bg-card rounded-xl border border-primary p-6 shadow-md relative overflow-hidden h-32 flex flex-col justify-between">
			<div className="flex justify-between items-start">
				<div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
					{icon}
				</div>
				<div className="flex items-center gap-1 text-xs font-bold text-primary">
					<IconArrowUpRight className="w-3 h-3" />
					{trend}
				</div>
			</div>
			<div>
				<div className="text-2xl font-bold text-dark dark:text-white">{value}</div>
				<div className="text-xs text-muted-foreground font-medium">{title}</div>
			</div>
		</div>
	)
}

function StrategyCard({ title, description, potential }: { title: string, description: string, potential: string }) {
	return (
		<div className="bg-lightprimary rounded-lg p-5">
			<h3 className="text-sm font-bold text-dark dark:text-white mb-1">{title}</h3>
			<p className="text-xs text-muted-foreground mb-2">{description}</p>
			<p className="text-xs font-bold text-primary">{potential}</p>
		</div>
	)
}
