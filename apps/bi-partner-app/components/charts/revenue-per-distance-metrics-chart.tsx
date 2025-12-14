"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
	{ distance: "0-5km", revenue: 4500 },
	{ distance: "5-10km", revenue: 15000 },
	{ distance: "10-20km", revenue: 24000 },
	{ distance: "20-50km", revenue: 27500 },
	{ distance: "50+km", revenue: 16000 },
]

const chartConfig = {
	revenue: {
		label: "Revenue",
		color: "#0CCF0E",
	},
} satisfies ChartConfig

export function RevenuePerDistanceMetricsChart() {
	return (
		<Card className="w-full border-neutral-200 shadow-sm h-full flex flex-col bg-white border-0 shadow-none">
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="text-lg font-bold text-[#003300]">Revenue per Distance Metrics</CardTitle>
				<div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
					<span className="h-2 w-2 rounded-full bg-[#0CCF0E]" />
					Revenue
				</div>
			</CardHeader>
			<CardContent className="flex-1">
				<ChartContainer config={chartConfig} className="min-h-[250px] w-full h-full">
					<LineChart
						accessibilityLayer
						data={chartData}
						margin={{
							left: -10,
							right: 12,
							top: 12,
							bottom: 0,
						}}
					>
						<CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
						<XAxis
							dataKey="distance"
							tickLine={false}
							axisLine={{ stroke: '#f0f0f0' }} // solid bottom line per image
							tickMargin={10}
							className="text-xs text-neutral-400"
						/>
						<YAxis
							axisLine={false}
							tickLine={false}
							tickCount={6}
							domain={[0, 30000]}
							className="text-xs text-neutral-400"
						/>
						<ChartTooltip
							cursor={{ stroke: '#f0f0f0', strokeWidth: 2 }}
							content={<ChartTooltipContent hideLabel />}
						/>
						<Line
							dataKey="revenue"
							type="monotone"
							stroke="var(--color-revenue)"
							strokeWidth={2}
							dot={{ r: 4, fill: "#0CCF0E", strokeWidth: 0 }}
							activeDot={{ r: 6, fill: "#0CCF0E", stroke: "white", strokeWidth: 2 }}
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	)
}
