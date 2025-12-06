"use client";

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set the access token
if (process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
} else if (typeof window !== 'undefined') {
  // Fallback or warning if not set, though it should be in .env
  console.warn('Mapbox access token is missing');
}

interface MapProps {
  className?: string;
  onLoad?: () => void;
}

export function Map({ className, onLoad }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    if (!mapContainer.current) return;

    if (!mapboxgl.accessToken) {
      setError('Mapbox access token is missing');
      return;
    }

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/kaeytee/cmi7zuj70001201s947af9oze',
        center: [-0.1870, 5.6037], // Accra, Ghana
        zoom: 13,
        attributionControl: false, // We'll add custom attribution if needed or keep it clean as requested
      });

      map.current.on('load', () => {
        if (onLoad) onLoad();
      });

    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to load map');
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [onLoad]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-red-500 ${className}`}>
        {error}
      </div>
    );
  }

  return (
    <div ref={mapContainer} className={`w-full h-full ${className}`} />
  );
}
