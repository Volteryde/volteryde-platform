'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const DriverMap = dynamic(
  () => import('../Map').then((mod) => ({ default: mod.DriverMap })),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading map...</p>
      </div>
    )
  }
)

interface DashboardOverlayProps {
  children: React.ReactNode
}

export function DashboardOverlay({ children }: DashboardOverlayProps) {
  const [showDashboard, setShowDashboard] = useState(false)

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Map Background - Always visible */}
      <div className={`absolute inset-0 transition-transform duration-300 ${
        showDashboard ? 'scale-95 -translate-x-4 pointer-events-none' : 'scale-100 translate-x-0'
      }`}>
        <DriverMap />
      </div>

      {/* Dashboard Overlay */}
      <div className={`absolute inset-0 bg-white transition-transform duration-300 ${
        showDashboard ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Mobile Header with Back Button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => setShowDashboard(false)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <span className="text-xl">←</span>
            <span>Back to Map</span>
          </button>
          <h1 className="font-semibold text-gray-900">Dashboard</h1>
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>

        {/* Dashboard Content */}
        <div className={`h-full overflow-y-auto ${
          showDashboard ? 'block' : 'hidden lg:block'
        }`}>
          {children}
        </div>
      </div>

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setShowDashboard(!showDashboard)}
        className={`lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center ${
          showDashboard ? 'hidden' : 'block'
        }`}
      >
        <span className="text-xl">📊</span>
      </button>

      {/* Desktop Toggle Button */}
      <button
        onClick={() => setShowDashboard(!showDashboard)}
        className={`hidden lg:flex fixed top-6 right-6 z-50 items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors border border-gray-200 ${
          showDashboard ? 'bg-blue-600 text-white hover:bg-blue-700' : ''
        }`}
      >
        <span className="text-lg">{showDashboard ? '🗺️' : '📊'}</span>
        <span>{showDashboard ? 'Map' : 'Dashboard'}</span>
      </button>
    </div>
  )
}