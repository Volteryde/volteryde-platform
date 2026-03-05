"use client"
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Loader2 } from "lucide-react";
import CardBox from "../shared/CardBox";
import { useRevenueCharts } from "@/hooks/useRevenueCharts";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Austin — Format currency for display
function formatCurrency(amount: number): string {
    if (amount >= 1_000_000) return `GHS ${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `GHS ${(amount / 1_000).toFixed(1)}K`;
    return `GHS ${amount.toFixed(2)}`;
}

const MonthlyEarning = () => {
    const { data, isLoading, error } = useRevenueCharts();

    // Austin — Live sparkline data from the API
    const sparklineData = data?.monthlyEarnings.data ?? [];
    const currentMonth = data?.monthlyEarnings.currentMonth ?? 0;
    const momChange = data?.monthlyEarnings.momChangePercent ?? 0;
    const isPositive = momChange >= 0;

    const ChartData: any = {
        series: [
            {
                name: 'monthly earnings',
                color: "var(--color-secondary)",
                data: sparklineData.length > 0 ? sparklineData : [0],
            },
        ],
        chart: {
            id: "weekly-stats2",
            type: "area",
            height: 60,
            sparkline: {
                enabled: true,
            },
            group: 'sparklines',
            fontFamily: "inherit",
            foreColor: "#adb0bb",
        },
        stroke: {
            curve: "smooth",
            width: 2,
        },
        fill: {
            type: "gradient",
            gradient: {
                shadeIntensity: 0,
                inverseColors: false,
                opacityFrom: 0.1,
                opacityTo: 0,
                stops: [20, 180],
            },
        },

        markers: {
            size: 0,
        },
        tooltip: {
            theme: "dark",
            fixed: {
                enabled: true,
                position: "right",
            },
            x: {
                show: false,
            },
            y: {
                formatter: (val: number) => {
                    return formatCurrency(val);
                }
            }
        },
    };

    if (isLoading) {
        return (
            <CardBox className="p-0! mt-0">
                <div className="flex items-center justify-center h-[170px] text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Loading…
                </div>
            </CardBox>
        );
    }

    if (error) {
        return (
            <CardBox className="p-0! mt-0">
                <div className="flex items-center justify-center h-[170px] text-destructive text-sm">
                    {error}
                </div>
            </CardBox>
        );
    }

    return (
        <>
            <CardBox className="p-0! mt-0" >
                <div className="px-6 pt-6">
                    <div className="flex items-center justify-between mb-2">
                        <h5 className="card-title mb-0">Monthly Earnings</h5>
                        <div className="text-white bg-secondary rounded-full h-11 w-11 flex items-center justify-center">
                            <Icon icon='tabler:currency-dollar' className="text-xl" />
                        </div>
                    </div>
                    <div className="grid grid-cols-12 gap-6 mb-4">
                        <div className="lg:col-span-8 md:col-span-8  col-span-8">
                            <h4 className="text-xl mb-3">{formatCurrency(currentMonth)}</h4>
                            <div className="flex items-center gap-2">
                                <span className={`rounded-full p-1 ${isPositive ? 'bg-lightsuccess dark:bg-darksuccess' : 'bg-lighterror dark:bg-darkerror'} flex items-center justify-center`}>
                                    <Icon
                                        icon={isPositive ? 'tabler:arrow-up-left' : 'tabler:arrow-down-right'}
                                        className={isPositive ? 'text-success' : 'text-error'}
                                    />
                                </span>
                                <p className="text-dark dark:text-darklink mb-0">{isPositive ? '+' : ''}{momChange}%</p>
                                <p className="dark:text-darklink mb-0">last month</p>
                            </div>
                        </div>
                    </div>
                </div>
                <Chart
                    options={ChartData}
                    series={ChartData.series}
                    type="area"
                    height={60}
                    width={"100%"}
                />
            </CardBox>
        </>
    )
}
export { MonthlyEarning }