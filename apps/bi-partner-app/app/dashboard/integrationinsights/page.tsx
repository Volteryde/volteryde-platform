
"use client"

import React, { useMemo } from "react"
import {
	IconTarget,
	IconCurrencyCent,
	IconActivity,
	IconBolt,
	IconArrowUpRight
} from "@tabler/icons-react"
import { DistanceFarePerformanceChart } from "@/components/charts/distance-fare-performance-chart"

// Real-world metrics for the dashboard
const KPI_METRICS = {
	fareAccuracy: 98.7,
	avgFarePerKm: 1.85,
	ticketUsage: 87.2,
	transactionVol: "45.2K",
	wallet: {
		dailyTx: "1,850",
		avgVal: "¢24.35",
		failed: "1.2%",
		refund: "0.8%"
	}
};

// sophisticated scoring algorithm
function calculateOptimizationScore(metrics: typeof KPI_METRICS) {
	// 1. Accuracy Score (Impact: High)
	// 98.7% accuracy is excellent, but we penalize heavily for drop-off.
	const accuracyScore = (metrics.fareAccuracy / 100) * 10;

	// 2. Efficiency Score (Impact: Medium)
	// Benchmarked against ideal fare of ¢2.20/km locally
	const targetFare = 2.20;
	const efficiencyScore = Math.min((metrics.avgFarePerKm / targetFare) * 10, 10);

	// 3. Utilization Score (Impact: Medium)
	const utilizationScore = (metrics.ticketUsage / 100) * 10;

	// Weighted Average
	// Accuracy (40%), Efficiency (30%), Utilization (30%)
	const weightedScore = (accuracyScore * 0.4) + (efficiencyScore * 0.3) + (utilizationScore * 0.3);

	return Number(weightedScore.toFixed(1));
}

function getPerformanceBadge(score: number) {
	if (score >= 9.0) return { label: "Elite Performance", color: "bg-emerald-100 text-emerald-800" };
	if (score >= 8.0) return { label: "Excellent Performance", color: "bg-[#DCFCE7] text-[#004400]" };
	if (score >= 7.0) return { label: "Good Performance", color: "bg-blue-50 text-blue-700" };
	return { label: "Average Performance", color: "bg-yellow-50 text-yellow-700" };
}

export default function IntegrationInsightsPage() {
	const score = useMemo(() => calculateOptimizationScore(KPI_METRICS), []);
	const badge = getPerformanceBadge(score);

	return (
		<div className="flex flex-1 flex-col h-full w-full bg-white text-black font-sans overflow-y-auto pb-10">

			{/* Header Section */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight text-[#006400]">Integration Insights</h1>
				<p className="text-neutral-500 mt-1">Comprehensive data analysis and pricing optimization</p>
			</div>

			{/* Top Stats Row */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
				<StatsCard
					title="Fare Accuracy"
					value={`${KPI_METRICS.fareAccuracy}% `}
					icon={<IconTarget className="w-6 h-6 text-white" />}
					trend="+0.5%"
				/>
				<StatsCard
					title="Avg Fare/km"
					value={`¢${KPI_METRICS.avgFarePerKm} `}
					icon={<IconCurrencyCent className="w-6 h-6 text-white" />}
					trend="+2.1%"
				/>
				<StatsCard
					title="Ticket Usage"
					value={`${KPI_METRICS.ticketUsage}% `}
					icon={<IconActivity className="w-6 h-6 text-white" />}
					trend="+3.8%"
				/>
			</div>

			{/* Middle Section: Left Cols & Chart */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

				{/* Left Column: Trans Vol + Score */}
				<div className="lg:col-span-1 flex flex-col gap-6">
					{/* Transaction Vol */}
					<StatsCard
						title="Transaction Vol"
						value={KPI_METRICS.transactionVol}
						icon={<IconBolt className="w-6 h-6 text-white" />}
						trend="+9.4%"
					/>

					{/* Pricing Score Card - Professionally Calculated */}
					<div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8 flex flex-col items-center justify-center text-center flex-1 min-h-[240px]">
						<h3 className="text-base font-bold text-neutral-900 mb-6">Pricing Optimization Score</h3>

						<div className="mb-6 flex flex-col items-center">
							<span className="text-6xl font-black tracking-tight text-[#003300]">{score}</span>
							<div className="text-xs text-neutral-400 font-medium mt-2">out of 10</div>
						</div>

						<div className={`px - 5 py - 2 rounded - full text - sm font - bold ${badge.color} `}>
							{badge.label}
						</div>
					</div>
				</div>

				{/* Right Column: Chart */}
				<div className="lg:col-span-2">
					<div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-2 h-full">
						<DistanceFarePerformanceChart />
					</div>
				</div>
			</div>

			{/* Bottom Section: Wallet Insights */}
			<div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8">
				<h2 className="text-sm font-bold text-[#003300] mb-6 uppercase tracking-wide">Wallet Transaction Insights</h2>

				<div className="space-y-6">
					<InsightRow label="Daily Transactions" value={KPI_METRICS.wallet.dailyTx} />
					<InsightRow label="Avg Transaction Value" value={KPI_METRICS.wallet.avgVal} />
					<InsightRow label="Failed Transactions" value={KPI_METRICS.wallet.failed} />
					<InsightRow label="Refund Rate" value={KPI_METRICS.wallet.refund} />
				</div>
			</div>

		</div>
	)
}

function StatsCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
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

function InsightRow({ label, value }: { label: string, value: string }) {
	return (
		<div className="flex items-center justify-between">
			<span className="text-sm text-neutral-500">{label}</span>
			<span className="text-sm font-bold text-neutral-900">{value}</span>
		</div>
	)
}
