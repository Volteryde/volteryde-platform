"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart"

const chartData = [
	{ amount: "¢10", frequency: 1250 },
	{ amount: "¢20", frequency: 4250 },
	{ amount: "¢50", frequency: 2200 },
	{ amount: "¢100", frequency: 3350 },
	{ amount: "¢200+", frequency: 800 },
]

const chartConfig = {
	frequency: {
		label: "Frequency",
		color: "#0CCF0E",
	},
} satisfies ChartConfig

export function TopUpFrequencyChart() {
	return (
		<Card className="w-full border-neutral-200 shadow-sm h-full flex flex-col">
			<CardHeader>
				<CardTitle className="text-lg font-bold text-[#006400]">Top-Up Frequency by Amount</CardTitle>
			</CardHeader>
			<CardContent className="flex-1">
				<ChartContainer config={chartConfig} className="min-h-[250px] w-full h-full">
					<BarChart
						accessibilityLayer
						data={chartData}
						layout="vertical"
						margin={{
							left: 0,
							right: 20,
							top: 0,
							bottom: 20,
						}}
						barSize={32}
						barCategoryGap="15%"
					>
						<CartesianGrid horizontal={false} vertical={true} strokeDasharray="3 3" stroke="#e5e5e5" />
						<XAxis
							type="number"
							dataKey="frequency"
							domain={[0, 6000]}
							ticks={[0, 1000, 2000, 3000, 4000, 5000, 6000]}
							axisLine={false}
							tickLine={false}
							className="text-xs text-neutral-400"
						/>
						<YAxis
							dataKey="amount"
							type="category"
							tickLine={false}
							tickMargin={10}
							axisLine={{ stroke: '#e5e5e5', strokeWidth: 1 }}
							width={50}
							className="text-xs text-neutral-500 font-medium"
						/>
						<ChartTooltip
							cursor={{ fill: '#f5f5f5' }}
							content={<ChartTooltipContent hideLabel />}
						/>
						<Bar dataKey="frequency" fill="var(--color-frequency)" radius={[0, 2, 2, 0]} />
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	)
}
