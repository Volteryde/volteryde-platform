
"use client"

import { Chart, useChart } from "@chakra-ui/charts"
import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react"
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"

// Create a custom system that disables Chakra's global CSS reset (preflight)
// to prevent it from breaking the existing Tailwind styling.
const customSystem = createSystem(defaultConfig, {
	preflight: false,
})

function DistanceFarePerformanceChartContent() {
	const chart = useChart({
		data: [
			{ range: "0-5km", revenue: 2300 },
			{ range: "10-20km", revenue: 2400 },
			{ range: "30-40km", revenue: 3200 },
			{ range: "50+km", revenue: 1500 },
		],
		series: [{ name: "revenue", color: "#0CCF0E" }],
	})

	return (
		<Card className="w-full border-neutral-200 shadow-sm h-full flex flex-col bg-white border-0 shadow-none">
			<CardHeader className="flex flex-row items-center justify-between pb-4">
				<CardTitle className="text-base font-bold text-[#003300]">Distance-Based Fare Performance</CardTitle>
				<div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
					<span className="w-2 h-2 rounded-full bg-[#00cf0e]"></span>
					Revenue ¢
				</div>
			</CardHeader>
			<CardContent className="flex-1 min-h-[300px]">
				<Chart.Root maxH="sm" chart={chart} className="w-full h-full">
					<BarChart data={chart.data}>
						<CartesianGrid stroke={chart.color("border.muted") || "#f0f0f0"} vertical={false} />
						<XAxis
							axisLine={false}
							tickLine={false}
							dataKey={chart.key("range")}
							tickMargin={10}
							className="text-xs text-neutral-500"
						/>
						<YAxis
							axisLine={false}
							tickLine={false}
							className="text-xs text-neutral-400"
							tickFormatter={chart.formatNumber({
								style: "currency",
								currency: "USD",
								notation: "compact",
							})}
						/>
						<Tooltip
							cursor={{ fill: chart.color("bg.muted") || "#f9f9f9" }}
							animationDuration={0}
							content={<Chart.Tooltip />}
						/>
						{chart.series.map((item) => (
							<Bar
								isAnimationActive={false}
								key={item.name}
								dataKey={chart.key(item.name)}
								fill={item.color}
								radius={[0, 0, 0, 0]}
							/>
						))}
					</BarChart>
				</Chart.Root>
			</CardContent>
		</Card>
	)
}

export function DistanceFarePerformanceChart() {
	return (
		<ChakraProvider value={customSystem}>
			<DistanceFarePerformanceChartContent />
		</ChakraProvider>
	)
}
