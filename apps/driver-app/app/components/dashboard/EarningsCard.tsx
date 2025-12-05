import { useState } from 'react'

interface EarningsCardProps {
  todayEarnings: number
  weeklyEarnings: number
  monthlyEarnings: number
}

export function EarningsCard({ todayEarnings, weeklyEarnings, monthlyEarnings }: EarningsCardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today')

  const earnings = {
    today: todayEarnings,
    week: weeklyEarnings,
    month: monthlyEarnings,
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Earnings</h3>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['today', 'week', 'month'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                selectedPeriod === period
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="text-3xl font-bold text-green-600 mb-2">
        ${earnings[selectedPeriod].toFixed(2)}
      </div>

      <p className="text-gray-600 text-sm">
        {selectedPeriod === 'today' && "Today's earnings"}
        {selectedPeriod === 'week' && "This week's earnings"}
        {selectedPeriod === 'month' && "This month's earnings"}
      </p>
    </div>
  )
}