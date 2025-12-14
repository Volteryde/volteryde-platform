"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
	{ day: "Mon", value: 20 },
	{ day: "Tue", value: 40 },
	{ day: "Wed", value: 35 },
	{ day: "Thu", value: 75 }, // bump
	{ day: "Fri", value: 20 }, // dip
	{ day: "Sat", value: 65 }, // rise
	{ day: "Sun", value: 100 }, // huge rise per image end
]
// Note: Image curve:
// Starts ~20.
// Small rise ~40 (Tue).
// Dip ~35.
// Big Rise ~75 (Wed/Thu transition?). The label says Wed is under the low part? 
// Let's look at image:
// Mon (low), Tue (bump), Wed (dip?? No, wait).
// Mon (20), Tue (40), Wed (35), Thu (big spike ~80?), Fri (dip ~20), Sat (rise ~65), Sun (dip ~50?).
// Wait, image:
// Mon: start low.
// Tue: small peak.
// Wed: dip.
// Thu: huge peak.
// Fri: dip.
// Sat: mid peak.
// Sun: dip/rise?
// Actually the labels in image are Mon..Sun. The points are distributed.
// I will try to approximate the curve visually.

const chartConfig = {
	value: {
		label: "Loading",
		color: "#0CCF0E",
	},
} satisfies ChartConfig

export function WalletLoadingPatternsChart() {
	return (
		<Card className="w-full border-neutral-200 shadow-sm h-full flex flex-col bg-white border-0 shadow-none">
			<CardHeader>
				<CardTitle className="text-lg font-bold text-[#003300]">Wallet Loading Patterns</CardTitle>
			</CardHeader>
			<CardContent className="flex-1">
				<ChartContainer config={chartConfig} className="min-h-[250px] w-full h-full">
					<AreaChart
						accessibilityLayer
						data={chartData}
						margin={{
							left: -20,
							right: 12,
							top: 12,
							bottom: 0,
						}}
					>
						<defs>
							<linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.3} />
								<stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.05} />
							</linearGradient>
						</defs>
						<CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
						<XAxis
							dataKey="day"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							className="text-xs text-neutral-400"
						/>
						<YAxis
							axisLine={false}
							tickLine={false}
							tickCount={6}
							className="text-xs text-neutral-400"
						/>
						<ChartTooltip
							cursor={{ stroke: '#0CCF0E', strokeWidth: 1 }}
							content={<ChartTooltipContent hideLabel />}
						/>
						<Area
							dataKey="value"
							type="monotone" // smooth curve
							fill="url(#fillValue)"
							stroke="var(--color-value)"
							strokeWidth={2}
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	)
}
