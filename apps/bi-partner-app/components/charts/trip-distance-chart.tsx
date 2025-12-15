"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
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
	{ distance: "0-5km", trips: 3100, revenue: 2300 },
	{ distance: "10-20km", trips: 2400, revenue: 1600 },
	{ distance: "30-40km", trips: 3400, revenue: 3600 },
	{ distance: "50+km", trips: 1400, revenue: 600 },
]

const chartConfig = {
	trips: {
		label: "Trip Count",
		color: "var(--chart-1)",
	},
	revenue: {
		label: "Revenue",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig

export function TripDistanceChart() {
	return (
		<Card className="w-full border-neutral-200 shadow-sm">
			<CardHeader>
				<CardTitle>Trip Distance Analysis</CardTitle>
				<CardDescription>Correlation between trip distance, volume, and revenue</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className="min-h-[250px] w-full">
					<BarChart accessibilityLayer data={chartData}>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="distance"
							tickLine={false}
							tickMargin={10}
							axisLine={false}
							tickFormatter={(value) => value}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent indicator="dashed" />}
						/>
						<Bar dataKey="trips" fill="var(--color-trips)" radius={4} />
						<Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
					</BarChart>
				</ChartContainer>
			</CardContent>
			<CardFooter className="flex-col items-start gap-2 text-sm">
				<div className="flex gap-2 leading-none font-medium">
					Trips in the 30-40km range show highest revenue <TrendingUp className="h-4 w-4" />
				</div>
				<div className="text-muted-foreground leading-none">
					Data aggregated from the last quarter
				</div>
			</CardFooter>
		</Card>
	)
}
