import React from "react";
import SalesOverview from "../components/dashboard/SalesOverview";
import { YearlyBreakup } from "../components/dashboard/YearlyBreakup";
import { MonthlyEarning } from "../components/dashboard/MonthlyEarning";
import { RecentTransaction } from "../components/dashboard/RecentTransaction";
import { ProductPerformance } from "../components/dashboard/ProductPerformance";
import { Footer } from "../components/dashboard/Footer";
import ProfileWelcome from "../components/dashboard/ProfileWelcome";
import { MetricCard } from "../components/dashboard/MetricCard";

const page = () => {
  return (
    <>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <ProfileWelcome />
        </div>
        <div className="col-span-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="Total Real Revenue"
              amount="$45,231.89"
              description="Total deposited amounts by customers (Mirroring)"
              color="text-green-600"
              tooltipText="Revenue generated from actual customer deposits."
            />
            <MetricCard
              title="Total System Balance"
              amount="$128,400.00"
              description="Total value in system"
              color="text-blue-600"
              tooltipText="Includes all deposited amounts, plus compensations, free ride balances, and system credits. We mirror monetary value to allow flexibility in user account population."
            />
          </div>
        </div>
        <div className="lg:col-span-8 col-span-12">
          <SalesOverview />
        </div>
        <div className="lg:col-span-4 col-span-12">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12">
              <YearlyBreakup />
            </div>
            <div className="col-span-12">
              <MonthlyEarning />
            </div>
          </div>
        </div>
        <div className="lg:col-span-4 col-span-12">
          <RecentTransaction />
        </div>
        <div className="lg:col-span-8 col-span-12 flex">
          <ProductPerformance />
        </div>
        <div className="col-span-12">
          <Footer />
        </div>
      </div>
    </>
  );
};

export default page;
