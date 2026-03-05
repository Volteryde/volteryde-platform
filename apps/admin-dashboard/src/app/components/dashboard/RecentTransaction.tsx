'use client';

import Link from 'next/link';
import CardBox from '../shared/CardBox';
import { useRecentTransactions } from '@/hooks/useRecentTransactions';

/**
 * Austin — Maps transaction status to timeline dot border color.
 * Keeps the original visual style with colored dots.
 */
function statusToBorderColor(status: string): string {
  switch (status) {
    case 'SUCCESS':
      return 'border-success';
    case 'PENDING':
      return 'border-warning';
    case 'FAILED':
      return 'border-error';
    case 'REFUNDED':
      return 'border-info';
    default:
      return 'border-primary';
  }
}

/**
 * Austin — Format timestamp to readable time string (e.g. "09:30 am").
 */
function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).toLowerCase();
}

/**
 * Austin — Build a concise description from transaction data.
 */
function buildDescription(tx: { userName: string; type: string; amount: number; currency: string }): string {
  const amt = `GH₵${tx.amount.toFixed(2)}`;
  return `${tx.type} — ${amt} by ${tx.userName}`;
}

export const RecentTransaction = () => {
  // Austin — Fetch latest 6 transactions for dashboard widget, auto-refresh every 2 minutes
  const { transactions, loading, error } = useRecentTransactions({
    limit: 6,
    autoRefreshMs: 2 * 60 * 1000,
  });

  return (
    <CardBox className="h-full w-full">
      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="card-title">Recent Transactions</h5>
            <p className="text-sm text-bodytext dark:text-darklink font-normal">
              Latest platform activity
            </p>
          </div>
          {/* Austin — View All navigates to /payments for full paginated list */}
          <Link
            href="/payments"
            className="text-sm text-primary font-semibold hover:underline"
          >
            View All →
          </Link>
        </div>
      </div>

      <div className="mt-6">
        {/* Loading state */}
        {loading && transactions.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            <span className="ml-2 text-sm text-bodytext">Loading transactions...</span>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="text-center py-8 text-sm text-error">
            Failed to load transactions. Please try again.
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && transactions.length === 0 && (
          <div className="text-center py-8 text-sm text-bodytext dark:text-darklink">
            No transactions recorded yet.
          </div>
        )}

        {/* Austin — Timeline items rendered from live transaction data */}
        {transactions.map((tx, index) => {
          const isLastItem = index === transactions.length - 1;
          const borderColor = statusToBorderColor(tx.status);
          const time = formatTime(tx.createdAt);
          const desc = buildDescription(tx);

          return (
            <div key={tx.id} className="flex gap-x-3">
              <div className="w-1/4 text-end">
                <span className="font-medium dark:text-darklink">
                  {time}
                </span>
              </div>
              <div
                className={`relative ${
                  isLastItem ? 'after:hidden' : ''
                } after:absolute after:top-7 after:bottom-0 after:start-3.5 after:w-px after:-translate-x-[0.5px] after:bg-defaultBorder`}
              >
                <div className="relative z-1 w-7 h-7 flex justify-center items-center">
                  <div
                    className={`h-3 w-3 rounded-full bg-transparent border-2 ${borderColor}`}
                  ></div>
                </div>
              </div>
              <div className="w-1/4 grow pt-0.5 pb-6">
                <p className="font-medium dark:text-darklink text-sm">{desc}</p>
                <span className="text-xs text-bodytext dark:text-darklink opacity-70">
                  {tx.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </CardBox>
  );
};
