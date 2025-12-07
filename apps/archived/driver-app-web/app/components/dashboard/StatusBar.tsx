import { useState } from 'react'

interface StatusBarProps {
  isOnline: boolean
  onStatusChange: (isOnline: boolean) => void
}

export function StatusBar({ isOnline, onStatusChange }: StatusBarProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            isOnline ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <div>
            <h3 className="font-semibold text-gray-900">
              {isOnline ? 'Online' : 'Offline'}
            </h3>
            <p className="text-sm text-gray-600">
              {isOnline
                ? 'You are available to receive ride requests'
                : 'You are currently offline'
              }
            </p>
          </div>
        </div>

        <button
          onClick={() => onStatusChange(!isOnline)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            isOnline ? 'bg-green-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isOnline ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  )
}