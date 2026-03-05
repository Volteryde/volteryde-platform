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

const YearlyBreakup = () => {
    const { data, isLoading, error } = useRevenueCharts();

    // Austin — Live data from the API or safe defaults
    const years = data?.yearlyBreakup.years ?? [];
    const values = data?.yearlyBreakup.values ?? [];
    const total = data?.yearlyBreakup.total ?? 0;
    const yoyChange = data?.yearlyBreakup.yoyChangePercent ?? 0;
    const isPositive = yoyChange >= 0;

    const ChartData: any = {
        series: values.length > 0 ? values : [0],
        color: "#adb5bd",
        labels: years.length > 0 ? years : ["—"],
        chart: {
            type: "donut",
            fontFamily: "inherit",
            foreColor: "#adb0bb",
            height: 200,
            offsetX: 18,
            toolbar: {
                show: false,
            },
        },
        plotOptions: {
            pie: {
                startAngle: 0,
                endAngle: 360,
                donut: {
                    size: '75%',
                },
            },
        },
        stroke: {
            show: false,
        },

        dataLabels: {
            enabled: false,
        },

        legend: {
            show: false,
        },
        colors: ["var(--color-primary)", "var(--color-lightprimary)", "var(--color-secondary)"],


        tooltip: {
            theme: "dark",
            fillSeriesColor: false,
            y: {
                formatter: (val: number) => {
                    return formatCurrency(val);
                }
            }
        },
    };

    if (isLoading) {
        return (
            <CardBox>
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Loading…
                </div>
            </CardBox>
        );
    }

    if (error) {
        return (
            <CardBox>
                <div className="flex items-center justify-center h-[200px] text-destructive text-sm">
                    {error}
                </div>
            </CardBox>
        );
    }

    return (
        <>
            <CardBox>
                <div className="grid grid-cols-12 ">
                    <div className="flex flex-col lg:col-span-6 md:col-span-6 col-span-7">
                        <div>
                            <h5 className="card-title mb-4 lg:whitespace-nowrap">Yearly Breakup</h5>
                            <h4 className="text-xl mb-2">{formatCurrency(total)}</h4>
                            <div className="flex items-center mb-3 gap-2">
                                <span className={`rounded-full p-1 ${isPositive ? 'bg-lightsuccess dark:bg-darksuccess' : 'bg-lighterror dark:bg-darkerror'} flex items-center justify-center`}>
                                    <Icon
                                        icon={isPositive ? "tabler:arrow-up-left" : "tabler:arrow-down-right"}
                                        className={isPositive ? "text-success" : "text-error"}
                                    />
                                </span>
                                <p className="text-dark dark:text-darklink mb-0">{isPositive ? '+' : ''}{yoyChange}%</p>
                                <p className="dark:text-darklink mb-0">last year</p>
                            </div>
                        </div>
                        {/* Austin — Year legend dots from live data */}
                        <div className="flex flex-wrap gap-4 items-center mt-4">
                            {years.map((year, i) => (
                                <div key={year} className="flex items-center">
                                    <Icon
                                        icon="tabler:point-filled"
                                        className={`text-xl me-1 ${
                                            i === 0 ? 'text-primary' : i === 1 ? 'text-secondary' : 'text-lightprimary'
                                        }`}
                                    />
                                    <span className="text-xs dark:text-darklink">{year}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="lg:col-span-6 md:col-span-6 col-span-4">
                        <div className="flex justify-center">
                            <Chart
                                options={ChartData}
                                series={ChartData.series}
                                type="donut"
                                height={200}
                                width={180}
                            />
                        </div>
                    </div>
                </div>

            </CardBox>
        </>
    )
}
export { YearlyBreakup }