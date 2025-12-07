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
  resize: () => void;
  recenter: () => void;
}

interface MapProps {
  className?: string;
  onLoad?: () => void;
  // Route coordinates and stops are now "properties of the vehicle" fetched internally or passed as static config
  // For this implementation, we will fetch them internally or accept them if passed, but reliance is on "Assigned Route" concept
  routeCoordinates?: [number, number][];
  stops?: { name: string; position: [number, number]; completed: boolean }[];
  padding?: { top: number; bottom: number; left: number; right: number };
}

// Mock function to simulate fetching the assigned route for the vehicle
const fetchAssignedRoute = async (): Promise<GeoJSON.Feature<GeoJSON.LineString>> => {
  // Simulating an API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock Route Data (Accra: Stadium -> Tech Junction)
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [
        [-0.1870, 5.6037], // Stadium
        [-0.1840, 5.6050],
        [-0.1810, 5.6080],
        [-0.1780, 5.6120],
        [-0.1750, 5.6150], // Tech Junction
      ]
    }
  };
};

export const Map = forwardRef<MapRef, MapProps>(({ className, onLoad, padding }, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track last known position for recentering
  const lastPosition = useRef<[number, number] | null>(null);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      map.current?.zoomIn();
    },
    zoomOut: () => {
      map.current?.zoomOut();
    },
    resize: () => {
      map.current?.resize();
    },
    recenter: () => {
      if (lastPosition.current && map.current) {
        map.current.flyTo({
          center: lastPosition.current,
          zoom: 15,
          pitch: 0, // Top-down view for easy orientation
          bearing: 0 // North up
        });
      }
    }
  }));

  // Initialize Map
  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    if (!mapboxgl.accessToken) {
      setError('Mapbox access token is missing');
      return;
    }

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/kaeytee/cmi7zuj70001201s947af9oze',
        center: [-0.1870, 5.6037], // Default center (Accra)
        zoom: 13,
        attributionControl: false,
      });

      map.current.on('load', async () => {
        if (onLoad) onLoad();

        if (!map.current) return;

        // 1. Add the "Assigned Route" Layer (Static Geometry)
        try {
          const routeGeoJSON = await fetchAssignedRoute();

          map.current.addSource('assigned-route', {
            type: 'geojson',
            data: routeGeoJSON
          });

          map.current.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'assigned-route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3887be', // Volteryde Brand Blue
              'line-width': 6
            }
          });

          // Fit bounds to show the entire route
          const coordinates = routeGeoJSON.geometry.coordinates;
          const bounds = new mapboxgl.LngLatBounds(
            coordinates[0] as [number, number],
            coordinates[0] as [number, number]
          );

          for (const coord of coordinates) {
            bounds.extend(coord as [number, number]);
          }

          map.current.fitBounds(bounds, {
            padding: padding || { top: 50, bottom: 300, left: 50, right: 50 }
          });

        } catch (fetchErr) {
          console.error("Failed to load assigned route:", fetchErr);
        }

        // 2. Add the Bus Marker (Live Data Source)
        map.current.addSource('bus-location', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'Point', coordinates: [0, 0] } // Initial dummy position
          }
        });

        // Use a circle layer for the "Puck"
        map.current.addLayer({
          id: 'bus-puck-halo',
          type: 'circle',
          source: 'bus-location',
          paint: {
            'circle-radius': 20,
            'circle-color': '#3887be',
            'circle-opacity': 0.2,
          }
        });

        map.current.addLayer({
          id: 'bus-puck',
          type: 'circle',
          source: 'bus-location',
          paint: {
            'circle-radius': 10,
            'circle-color': '#3887be',
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff'
          }
        });
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
  }, []); // Run once on mount

  // 3. Track Position (Real-time Loop)
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude, latitude, heading } = pos.coords;
        lastPosition.current = [longitude, latitude];

        if (map.current && map.current.getSource('bus-location')) {
          const source = map.current.getSource('bus-location') as mapboxgl.GeoJSONSource;
          source.setData({
            type: 'Feature',
            properties: {
              heading: heading || 0
            },
            geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            }
          });

          // Optional: Auto-follow logic could go here, but we'll leave it manual for now
          // to avoid wrestling control from the driver
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

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
