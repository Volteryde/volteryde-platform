'use client';

import dynamic from 'next/dynamic'

// Dynamically load the Map component with SSR disabled (Leaflet requires browser window)
const DriverMap = dynamic(
  () => import('@/app/components/Map').then((mod) => ({ default: mod.DriverMap })),
  { 
    ssr: false,
    loading: () => (
      <div style={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f0f0'
      }}>
        <p>Loading map...</p>
      </div>
    )
  }
)

export default function Home() {
  return (
    <main>
      <DriverMap />
    </main>
  )
}
