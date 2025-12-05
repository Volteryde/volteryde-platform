interface VehicleCardProps {
  vehicleName: string
  licensePlate: string
  batteryLevel: number
  status: 'online' | 'offline' | 'maintenance'
  lastMaintenance: string
}

export function VehicleCard({
  vehicleName,
  licensePlate,
  batteryLevel,
  status,
  lastMaintenance
}: VehicleCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100'
      case 'maintenance': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-red-600 bg-red-100'
    }
  }

  const getBatteryColor = (level: number) => {
    if (level >= 80) return 'text-green-600'
    if (level >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Vehicle Status</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="font-medium text-gray-900">{vehicleName}</p>
          <p className="text-sm text-gray-600">{licensePlate}</p>
        </div>

        {/* Battery Level */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Battery</span>
            <span className={`text-sm font-medium ${getBatteryColor(batteryLevel)}`}>
              {batteryLevel}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                batteryLevel >= 80 ? 'bg-green-500' :
                batteryLevel >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${batteryLevel}%` }}
            />
          </div>
        </div>

        {/* Last Maintenance */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Last maintenance: <span className="font-medium">{lastMaintenance}</span>
          </p>
        </div>
      </div>
    </div>
  )
}