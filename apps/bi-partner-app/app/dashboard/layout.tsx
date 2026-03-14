'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/sidebar/Sidebar'
import Header from '@/components/layout/header/Header'

const EXPANDED_WIDTH = 270
const COLLAPSED_WIDTH = 72

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const sidebarWidth = isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH

  return (
    <div className='flex h-screen overflow-hidden bg-background'>

      {/* Sidebar — fixed, width animates via its own transition */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed((prev) => !prev)}
      />

      {/* Main column — shifts in sync with sidebar via inline style */}
      <div
        className='flex flex-col flex-1 min-w-0 h-screen overflow-hidden transition-all duration-300'
        style={{ marginLeft: sidebarWidth }}
      >
        {/* Header — never grows, always at top */}
        <div className='shrink-0'>
          <Header />
        </div>

        {/* Page content — fills remaining height, scrollable */}
        <main className='flex-1 overflow-auto'>
          {children}
        </main>
      </div>

    </div>
  )
}
