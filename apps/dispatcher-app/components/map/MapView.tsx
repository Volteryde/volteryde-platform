'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import Map, {
  NavigationControl,
  FullscreenControl,
  ScaleControl,
  GeolocateControl,
  type MapRef,
} from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

const INITIAL_VIEW = {
  longitude: -0.187,
  latitude: 5.6037,
  zoom: 12,
}

export default function MapView() {
  const mapRef = useRef<MapRef>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  const onMapLoad = useCallback(() => {
    setMapLoaded(true)
  }, [])

  // Resize the map canvas whenever the container dimensions change
  // (e.g. sidebar collapse/expand)
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver(() => {
      mapRef.current?.resize()
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className='w-full h-full'>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={INITIAL_VIEW}
        style={{ width: '100%', height: '100%' }}
        mapStyle='mapbox://styles/mapbox/dark-v11'
        onLoad={onMapLoad}
        attributionControl={false}
      >
        <NavigationControl position='bottom-right' />
        <FullscreenControl position='top-right' />
        <ScaleControl position='bottom-left' />
        <GeolocateControl position='bottom-right' trackUserLocation showUserHeading />
      </Map>

      {!mapLoaded && (
        <div className='absolute inset-0 flex items-center justify-center bg-[#1a1a2e]'>
          <div className='flex flex-col items-center gap-3'>
            <div className='w-8 h-8 rounded-full border-2 border-[#0CCF0E] border-t-transparent animate-spin' />
            <span className='text-sm text-gray-400'>Loading map…</span>
          </div>
        </div>
      )}
    </div>
  )
}
