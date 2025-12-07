interface PerformanceCardProps {
  rating: number
  totalRides: number
  acceptanceRate: number
  completionRate: number
}

export function PerformanceCard({
  rating,
  totalRides,
  acceptanceRate,
  completionRate
}: PerformanceCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>

      <div className="space-y-4">
        {/* Rating */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Rating</span>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-lg ${
                    i < Math.floor(rating)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="font-semibold">{rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Total Rides */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Total Rides</span>
          <span className="font-semibold text-gray-900">{totalRides}</span>
        </div>

        {/* Acceptance Rate */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Acceptance Rate</span>
          <span className={`font-semibold ${
            acceptanceRate >= 90 ? 'text-green-600' :
            acceptanceRate >= 70 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {acceptanceRate.toFixed(1)}%
          </span>
        </div>

        {/* Completion Rate */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Completion Rate</span>
          <span className={`font-semibold ${
            completionRate >= 95 ? 'text-green-600' :
            completionRate >= 85 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {completionRate.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}