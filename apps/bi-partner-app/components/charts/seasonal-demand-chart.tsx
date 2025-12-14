"use client"

import { useMemo } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
	Card,
	CardContent,
} from "@/components/ui/card"
import {
	ChartContainer,
	ChartTooltip,
	type ChartConfig,
} from "@/components/ui/chart"

// Original monthly anchors
const anchors = [
	{ month: "Jan", revenue: 2500 },
	{ month: "Feb", revenue: 3200 },
	{ month: "Mar", revenue: 2100 },
	{ month: "Apr", revenue: 2800 },
	{ month: "May", revenue: 3600 },
	{ month: "Jun", revenue: 3000 },
	{ month: "Jul", revenue: 3200 },
	{ month: "Aug", revenue: 3400 },
	{ month: "Sep", revenue: 3348 },
	{ month: "Oct", revenue: 2600 },
	{ month: "Nov", revenue: 2400 },
	{ month: "Dec", revenue: 4100 },
]

// Spline interpolation to generate smooth high-res data
function getInterpolatedData(points: typeof anchors, stepsPerSegment: number = 8) {
	const data: { stepIndex: number; label: string; revenue: number; isMonthStart?: boolean }[] = []

	// Helper to get point at index with clamping
	const getPt = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))]

	let globalIndex = 0;

	for (let i = 0; i < points.length - 1; i++) {
		const p0 = getPt(i - 1)
		const p1 = getPt(i)
		const p2 = getPt(i + 1)
		const p3 = getPt(i + 2)

		for (let t = 0; t < stepsPerSegment; t++) {
			const tf = t / stepsPerSegment

			// Catmull-Rom spline interpolation
			const v0 = p1.revenue
			const v1 = 0.5 * (p2.revenue - p0.revenue)
			const v2 = p0.revenue - 2.5 * p1.revenue + 2 * p2.revenue - 0.5 * p3.revenue
			const v3 = -0.5 * p0.revenue + 1.5 * p1.revenue - 1.5 * p2.revenue + 0.5 * p3.revenue

			const revenue = ((v3 * tf + v2) * tf + v1) * tf + v0

			// Label generation
			let label = ""
			let isMonthStart = false
			if (t === 0) {
				label = p1.month
				isMonthStart = true
			}

			// Simple week/day approximations for finer labels if needed, 
			// but user just wants the curve to be calculatable.
			data.push({
				stepIndex: globalIndex++,
				label: label, // Only populated at start
				revenue: Math.round(revenue),
				isMonthStart
			})
		}
	}
	// Add last point
	data.push({
		stepIndex: globalIndex++,
		label: points[points.length - 1].month,
		revenue: points[points.length - 1].revenue,
		isMonthStart: true
	})

	return data
}

const chartConfig = {
	revenue: {
		label: "Forecast",
		color: "#0CCF0E",
	},
} satisfies ChartConfig

export function SeasonalDemandChart() {
	const chartData = useMemo(() => getInterpolatedData(anchors), [])

	return (
		<Card className="w-full border-neutral-200 shadow-sm border-0 shadow-none">
			{/* Removing CardHeader/Title here because the page already has a header for this section, 
           or I can include it. The original code had the header inside the white box. 
           I will let the parent handle the container style or replicate it here. 
           In the previous instruction, the user had a wrapper div with 'rounded-xl border ... p-8'. 
           I will make this component just the chart or fit nicely into that.
           Actually, Recharts needs height.
       */}
			<CardContent className="p-0">
				<ChartContainer config={chartConfig} className="min-h-[300px] w-full">
					<AreaChart
						accessibilityLayer
						data={chartData}
						margin={{
							left: 0,
							right: 0,
							top: 20, // space for tooltip
							bottom: 0,
						}}
					>
						<defs>
							<linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="5%"
									stopColor="var(--color-revenue)"
									stopOpacity={0.4}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-revenue)"
									stopOpacity={0.0}
								/>
							</linearGradient>
						</defs>
						<CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f5f5f5" />
						<XAxis
							dataKey="stepIndex"
							tickLine={false}
							axisLine={false}
							tickMargin={10}
							interval={0}
							type="number"
							domain={['dataMin', 'dataMax']}
							ticks={chartData.filter(d => d.isMonthStart).map(d => d.stepIndex)}
							tickFormatter={(value) => {
								const payload = chartData[value];
								return payload ? payload.label.toUpperCase() : ""
							}}
							className="text-neutral-400 text-xs"
						/>
						{/* YAxis to match design 0-5k on right side ideally, but standard left is easier. 
                Design had it on right. Recharts YAxis orientation="right".
            */}
						<YAxis
							orientation="right"
							axisLine={false}
							tickLine={false}
							tickCount={6}
							domain={[0, 5000]}
							className="text-neutral-400 text-xs"
							tickFormatter={(value) => value === 0 ? "0" : `${value / 1000}k`}
						/>
						<ChartTooltip
							cursor={{ stroke: '#0CCF0E', strokeWidth: 2, strokeDasharray: "" }}
							content={<CustomTooltip />}
							offset={0}
						/>
						<Area
							dataKey="revenue"
							type="monotone" // changed from natural to monotone for better fit with interpolated points
							fill="url(#fillRevenue)"
							fillOpacity={0.4}
							stroke="var(--color-revenue)"
							strokeWidth={3}
							stackId="a"
							activeDot={{ r: 6, fill: "#0CCF0E", stroke: "white", strokeWidth: 3 }}
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	)
}

const CustomTooltip = ({ active, payload, label }: any) => {
	if (active && payload && payload.length) {
		return (
			<div className="transform -translate-x-1/2 -translate-y-full -mt-4 pointer-events-none">
				<div className="bg-[#1a1a2e] text-white text-xs rounded-lg py-3 px-4 shadow-xl flex flex-col items-center min-w-[100px] relative">
					<div className="text-gray-400 mb-1 text-[10px] uppercase tracking-wide">Forecast:</div>
					<div className="font-bold text-lg">¢{payload[0].value.toLocaleString()}</div>
					{/* Triangle pointer */}
					<div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 rotate-45 w-3 h-3 bg-[#1a1a2e]"></div>
				</div>
			</div>
		);
	}
	return null;
};
