'use client'; // This component will run in the browser

import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default Leaflet icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Get this from your AWS Secrets Manager / Environment
// The user MUST provide this URL from MapTiler.
// For now, we'll use OpenStreetMap tiles as fallback
const MAPTILER_API_KEY = 'YOUR_MAPTILER_API_KEY'; // <-- USER MUST REPLACE
const USE_MAPTILER = false; // Set to true when you have a MapTiler key

interface RouteLayerProps {
  start: [number, number];
  end: [number, number];
  routeData: any;
}

function RouteLayer({ start, end, routeData }: RouteLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (routeData?.routes?.length > 0) {
      const routeGeoJson = routeData.routes[0].geometry;

      // Draw the route on the map
      const routeLayer = L.geoJSON(routeGeoJson, {
        style: { color: '#3b82f6', weight: 5 },
      }).addTo(map);

      // Zoom to fit the route
      map.fitBounds(routeLayer.getBounds());
    }
  }, [routeData, map]);

  return null;
}

export function DriverMap() {
  const [center] = useState<[number, number]>([5.6037, -0.187]); // Accra, Ghana
  const [routeData, setRouteData] = useState<any>(null);

  // Function to draw a route
  const drawRoute = async (start: [number, number], end: [number, number]) => {
    // Calls your new OSRM service via the API Gateway
    const url = `/api/v1/route/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data?.routes?.length) {
        console.error('Invalid route data received:', data);
        return;
      }

      setRouteData(data);
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  // MapTiler tile URL (requires API key)
  const mapTilerUrl = `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`;

  // OpenStreetMap fallback (free, no API key required)
  const osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      {/* Example button to test routing */}
      <button
        onClick={() => drawRoute([5.6037, -0.187], [5.6137, -0.207])}
        style={{
          position: 'absolute',
          zIndex: 1000,
          top: 10,
          left: 50,
          padding: '10px 20px',
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        Test Route (Accra)
      </button>

      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={USE_MAPTILER ? mapTilerUrl : osmUrl}
        />

        {/* Example marker */}
        <Marker position={center}>
          <Popup>
            Driver location in Accra, Ghana
          </Popup>
        </Marker>

        {/* Route layer */}
        {routeData && (
          <RouteLayer
            start={[5.6037, -0.187]}
            end={[5.6137, -0.207]}
            routeData={routeData}
          />
        )}
      </MapContainer>
    </div>
  );
}
