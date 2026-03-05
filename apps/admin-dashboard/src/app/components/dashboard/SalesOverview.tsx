"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import CardBox from "../shared/CardBox";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRevenueCharts } from "@/hooks/useRevenueCharts";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const SalesOverview = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { data, isLoading, error } = useRevenueCharts(selectedYear);

  // Austin — Dynamic year dropdown: from first transaction year to current year
  const yearOptions = data?.availableYears ?? [currentYear];

  // Austin — Build series from live data or default to zeros
  const earnings = data?.revenueChart.earnings ?? Array(12).fill(0);
  const expenses = data?.revenueChart.expenses ?? Array(12).fill(0);
  const categories = data?.revenueChart.categories ?? [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

    // Austin — Calculate dynamic Y-axis range from actual data
  const maxVal = Math.max(...earnings, ...expenses, 1000);
  const yRange = Math.ceil(maxVal / 1000) * 1000;  const series = [
    { name: "Earnings", data: earnings },
    { name: "Expense", data: expenses },
  ];

  const baseChartOptions = {
    chart: {
      toolbar: { show: false },
      type: "bar" as const,
      fontFamily: "inherit",
      foreColor: "#7C8FAC",
      height: 310,
      stacked: true,
      width: "100%",
      offsetX: -20,
    },
    colors: ["var(--color-primary)", "var(--color-secondary)"],
    plotOptions: {
      bar: {
        horizontal: false,
        barHeight: "60%",
        columnWidth: "20%",
        borderRadius: 6,
        borderRadiusApplication: "end",
        borderRadiusWhenStacked: "all",
      } as any,
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    grid: {
      borderColor: "rgba(0,0,0,0.1)",
      strokeDashArray: 3,
    },
    yaxis: {
      min: 0,
      max: yRange,
      tickAmount: 4,
      labels: {
        formatter: (val: number) => {
          const rounded = Math.round(val);
          return rounded >= 1000 ? `${rounded / 1000}k` : `${rounded}`;
        },
      },
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: (val: number) => {
          return val >= 1000 ? `GHS ${(val / 1000).toFixed(1)}k` : `GHS ${val}`;
        },
      },
    },
  };

  const ChartData = {
    ...baseChartOptions,
    xaxis: {
      categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
  };

  return (
    <CardBox className="pb-0 h-full w-full">
      <div className="sm:flex items-center justify-between mb-6">
        <div>
          <h5 className="card-title">Revenue updates</h5>
          <p className="text-sm text-bodytext dark:text-darklink font-normal">
            Overview of Profit
          </p>
        </div>
        <div className="sm:mt-0 mt-4">
          <Select
            value={String(selectedYear)}
            onValueChange={(val: string) => setSelectedYear(Number(val))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map(y => (
                <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Austin — Show loading state or chart */}
      {isLoading ? (
        <div className="flex items-center justify-center h-[316px] text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading revenue data…
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-[316px] text-destructive text-sm">
          {error}
        </div>
      ) : (
        <Chart
          options={ChartData}
          series={series}
          type="bar"
          height="316px"
          width={"100%"}
        />
      )}
    </CardBox>
  );
};

export default SalesOverview;
