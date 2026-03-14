'use client'

import { useState } from 'react'
import Header from './layout/header/Header'
import Sidebar from './layout/sidebar/Sidebar'
import { AuthProvider } from '@/providers/AuthProvider'

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <AuthProvider>
      {/* Full-screen flex row — sidebar + content sit side by side in normal flow */}
      <div className='flex h-screen overflow-hidden bg-background'>

        {/* Sidebar — in-flow on desktop, width animates via its own transition */}
        <div className='hidden xl:block shrink-0 h-full'>
          <Sidebar
            isCollapsed={isCollapsed}
            onToggle={() => setIsCollapsed((p) => !p)}
          />
        </div>

        {/* Content column — flex-1 always fills exactly the remaining width */}
        <div className='flex flex-col flex-1 min-w-0 overflow-hidden'>
          <div className='shrink-0'>
            <Header />
          </div>
          <main className='flex-1 overflow-auto'>
            {children}
          </main>
        </div>

      </div>
    </AuthProvider>
  )
}
