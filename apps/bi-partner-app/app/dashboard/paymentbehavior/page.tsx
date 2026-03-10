"use client"

import React from "react"
import { IconCurrencyDollar, IconActivity, IconArrowsExchange, IconArrowUpRight } from "@tabler/icons-react"
import { TopUpFrequencyChart } from "@/components/charts/top-up-frequency-chart"
import { WalletBalanceTrendChart } from "@/components/charts/wallet-balance-trend-chart"
import { generateStrategies } from "@/lib/strategy-engine"

const topUpData = [
	{ amount: "¢10", frequency: 1250 },
	{ amount: "¢20", frequency: 4250 },
	{ amount: "¢50", frequency: 2200 },
	{ amount: "¢100", frequency: 3350 },
	{ amount: "¢200+", frequency: 800 },
]

const walletData = [
	{ day: "MON", balance: 160 },
	{ day: "TUE", balance: 20 },
	{ day: "WED", balance: 46 },
	{ day: "THU", balance: 15 },
	{ day: "FRI", balance: 80 },
	{ day: "SAT", balance: 120 },
	{ day: "SUN", balance: 90 },
]

export default function PaymentBehaviorPage() {
	const recommendations = generateStrategies(topUpData, walletData);

	return (
		<div className="flex flex-1 flex-col h-full w-full bg-background text-foreground font-sans p-6 overflow-y-auto pb-10">

			{/* Header Section */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight text-primary">Payment Behavior Analysis</h1>
				<p className="text-muted-foreground mt-1">Understanding customer payment patterns and optimization strategies</p>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				<StatsCard
					title="Avg Top-Up Amount"
					value="¢52.30"
					icon={<IconCurrencyDollar className="w-6 h-6 text-white" />}
					trend="+4.8%"
				/>
				<StatsCard
					title="Top-Up Frequency"
					value="2.3/month"
					icon={<IconActivity className="w-6 h-6 text-white" />}
					trend="+11.2%"
				/>
				<StatsCard
					title="Promo Redemption"
					value="34.5%"
					icon={<IconArrowsExchange className="w-6 h-6 text-white" />}
					trend="+6.7%"
				/>
			</div>

			{/* Charts Row */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 h-[400px]">
				<div className="h-full">
					<TopUpFrequencyChart />
				</div>
				<div className="h-full">
					<WalletBalanceTrendChart />
				</div>
			</div>

			{/* Recommendations Section */}
			<div className="w-full bg-card rounded-xl border border-border p-8 shadow-md">
				<h2 className="text-xl font-bold text-primary mb-6">Promotional Strategy Recommendations</h2>

				<div className="space-y-4">
					{recommendations.map((rec, index) => (
						<div key={index} className="bg-lightprimary rounded-lg p-5">
							<h3 className="text-sm font-bold text-dark dark:text-white mb-1">{rec.title}</h3>
							<p className="text-xs text-muted-foreground mb-2">{rec.description}</p>
							<p className="text-xs font-bold text-primary">{rec.impact}</p>
						</div>
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
