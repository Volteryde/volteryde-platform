import React from "react";
import {
	IconCurrencyDollar,
	IconUsers,
	IconWallet,
	IconBrandZeit,
	IconArrowUpRight,
	IconArrowDownRight
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend
} from "recharts";

const data = [
	{ name: 'Jan', revenue: 24000, forecast: 18000 },
	{ name: 'Feb', revenue: 38000, forecast: 32000 },
	{ name: 'Mar', revenue: 42000, forecast: 36000 },
	{ name: 'Apr', revenue: 48000, forecast: 45000 },
	{ name: 'May', revenue: 52000, forecast: 50000 },
	{ name: 'Jun', revenue: 58000, forecast: 62000 },
];

export default function OverviewPage() {
	return (
		<div className="flex flex-1 flex-col h-full w-full bg-white text-black font-sans">
			{/* Header Section */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight text-[#006400]">Business Intelligence Overview</h1>
				<p className="text-neutral-500 mt-1">Real-time insights into your mobility platform performance</p>
			</div>

			{/* Cards Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<StatsCard
					title="Total Revenue"
					value="¢389.2k"
					trend="+ 12%"
					trendUp={true}
					icon={<IconCurrencyDollar className="w-6 h-6 text-white" />}
				/>
				<StatsCard
					title="Active Users"
					value="28,450"
					trend="+ 8.3%"
					trendUp={true}
					icon={<IconUsers className="w-6 h-6 text-white" />}
				/>
				<StatsCard
					title="Avg Wallet Balance"
					value="¢142.50"
					trend="+ 12%"
					trendUp={true}
					icon={<IconWallet className="w-6 h-6 text-white" />}
				/>
				<StatsCard
					title="Trip Volume"
					value="9,070"
					trend="- 12%"
					trendUp={false}
					icon={<IconBrandZeit className="w-6 h-6 text-white" />}
				/>
			</div>

			{/* Chart Section */}
			<div className="w-full bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
				<h2 className="text-xl font-bold text-[#006400] mb-6">Revenue vs Forecast</h2>

				<div className="h-[400px] w-full">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart
							data={data}
							margin={{
								top: 5,
								right: 30,
								left: 20,
								bottom: 5,
							}}
						>
							<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
							<XAxis 
								dataKey="name" 
								axisLine={false}
								tickLine={false}
								tick={{ fill: '#737373', fontSize: 12 }}
								dy={10}
							/>
							<YAxis 
								axisLine={false}
								tickLine={false}
								tick={{ fill: '#737373', fontSize: 12 }}
								tickFormatter={(value) => `¢${value / 1000}k`}
							/>
							<Tooltip 
								contentStyle={{ 
									backgroundColor: '#fff', 
									borderRadius: '8px', 
									border: '1px solid #E5E5E5',
									boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
								}}
							/>
							<Legend 
								verticalAlign="top" 
								height={36} 
								iconType="circle"
								formatter={(value) => <span className="text-sm font-semibold text-neutral-600 ml-2">{value}</span>}
							/>
							<Line 
								type="monotone" 
								dataKey="revenue" 
								name="Revenue"
								stroke="#0CCF0E" 
								strokeWidth={3} 
								dot={{ r: 4, fill: '#0CCF0E', strokeWidth: 0 }}
								activeDot={{ r: 6 }}
							/>
							<Line 
								type="monotone" 
								dataKey="forecast" 
								name="Forecast"
								stroke="#A3A3A3" 
								strokeWidth={2} 
								strokeDasharray="5 5"
								dot={{ r: 4, fill: '#A3A3A3', strokeWidth: 0 }}
								activeDot={{ r: 6 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			</div>
		</div>
	);
}

function StatsCard({
	title,
	value,
	trend,
	trendUp,
	icon
}: {
	title: string,
	value: string,
	trend: string,
	trendUp: boolean,
	icon: React.ReactNode
}) {
	return (
		<div className="flex flex-col p-6 bg-white rounded-xl border border-neutral-200 shadow-sm relative overflow-hidden h-40 justify-between">
			<div className="flex justify-between items-start">
				<div className={cn(
					"w-10 h-10 rounded-md flex items-center justify-center shadow-sm",
					trendUp ? "bg-[#0CCF0E]" : "bg-[#0CCF0E]" // Using green base for brand consistency as per image, icon differs
				)}>
					{icon}
				</div>
				<div className={cn(
					"flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
					trendUp ? "text-[#006400]" : "text-red-500"

				)}>
					{trendUp ? <IconArrowUpRight className="w-3 h-3" /> : <IconArrowDownRight className="w-3 h-3" />}
					{trend}
				</div>
			</div>

			<div>
				<h3 className="text-3xl font-bold text-neutral-800">{value}</h3>
				<p className="text-xs font-medium text-neutral-500 mt-1">{title}</p>
			</div>
		</div>
	);
}
