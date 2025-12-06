"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set the access token
if (process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
} else if (typeof window !== 'undefined') {
  console.warn('Mapbox access token is missing');
}

export interface MapRef {
  zoomIn: () => void;
  zoomOut: () => void;
  flyTo: (options: any) => void;
  resize: () => void;
}

interface MapProps {
  className?: string;
  onLoad?: () => void;
  padding?: { top: number; bottom: number; left: number; right: number };
}

export const Map = forwardRef<MapRef, MapProps>(({ className, onLoad, padding }, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      map.current?.zoomIn();
    },
    zoomOut: () => {
      map.current?.zoomOut();
    },
    flyTo: (options) => {
      map.current?.flyTo(options);
    },
    resize: () => {
      map.current?.resize();
    }
  }));

  // Update padding when prop changes
  useEffect(() => {
    if (map.current && padding) {
      map.current.setPadding(padding);
    }
  }, [padding]);

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
        attributionControl: false,
      });

      map.current.on('load', () => {
        if (onLoad) onLoad();

        // Add custom driver puck
        const el = document.createElement('div');
        el.className = 'driver-puck-container';

        // Create the halo
        const halo = document.createElement('div');
        halo.className = 'driver-puck-halo';
        el.appendChild(halo);

        // Create the puck
        const puck = document.createElement('div');
        puck.className = 'driver-puck';
        el.appendChild(puck);

        if (map.current) {
          markerRef.current = new mapboxgl.Marker({ element: el })
            .setLngLat([-0.1870, 5.6037]) // Start at center
            .addTo(map.current);
        }
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
});

Map.displayName = 'Map';
