"use client"

import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import { IconArrowUpRight } from "@tabler/icons-react"

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
	{ day: "MON", balance: 160 },
	{ day: "TUE", balance: 20 },
	{ day: "WED", balance: 46 },
	{ day: "THU", balance: 15 },
	{ day: "FRI", balance: 80 },
	{ day: "SAT", balance: 120 },
	{ day: "SUN", balance: 90 },
]

const chartConfig = {
	balance: {
		label: "Balance",
		color: "#0CCF0E",
	},
} satisfies ChartConfig

export function WalletBalanceTrendChart() {
	return (
		<Card className="w-full border-neutral-200 shadow-sm h-full flex flex-col bg-white">
			<CardHeader className="flex flex-row items-start justify-between pb-2">
				<CardTitle className="text-lg font-bold text-[#006400]">Average Wallet Balance Trend</CardTitle>
				<div className="flex flex-col items-end">
					<div className="flex items-center gap-1 text-sm font-bold text-[#006400]">
						1.3% <IconArrowUpRight className="w-4 h-4 bg-[#0CCF0E] text-white rounded-full p-0.5" />
					</div>
					<div className="text-[10px] text-neutral-400 font-semibold tracking-wider uppercase">Vs Last Week</div>
				</div>
			</CardHeader>
			<CardContent className="flex-1">
				<ChartContainer config={chartConfig} className="min-h-[250px] w-full h-full">
					<LineChart
						accessibilityLayer
						data={chartData}
						margin={{
							left: 24,
							right: 24,
							top: 20,
							bottom: 10
						}}
					>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="day"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							interval={0}
							padding={{ left: 10, right: 10 }}
							tickFormatter={(value) => value.slice(0, 3)}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent hideLabel />}
						/>
						<Line
							dataKey="balance"
							type="linear"
							stroke="var(--color-balance)"
							strokeWidth={2}
							dot={false}
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	)
}

