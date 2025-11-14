import { ClientOnly } from '../components/ClientOnly';
import { lazy, Suspense } from 'react';

// Lazy load the Map component (Leaflet requires browser window)
const DriverMap = lazy(() => import('../components/Map').then((mod) => ({ default: mod.DriverMap })));

export function meta() {
  return [
    { title: 'Volteryde Driver App - Map' },
    { name: 'description', content: 'Real-time driver map with routing' },
  ];
}

export default function Home() {
  return (
    <main>
      <ClientOnly fallback={
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
      }>
        {() => (
          <Suspense fallback={<div>Loading map...</div>}>
            <DriverMap />
          </Suspense>
        )}
      </ClientOnly>
    </main>
  );
}
