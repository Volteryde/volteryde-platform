# Map System Implementation Guide

## Overview

This guide documents the complete implementation of the custom map and routing system for the Volteryde Platform. The system includes:

1. **Self-hosted OSRM Routing Service** - Provides fast, offline route calculations
2. **Leaflet-based Frontend Maps** - Interactive maps in the driver web app
3. **Kubernetes & Docker Integration** - Full production deployment setup

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Driver Web App                          │
│                   (React + Leaflet)                          │
│              apps/driver-app/app/components/Map.tsx          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ HTTP: /api/v1/route/...
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Gateway (Ingress)                       │
│         infrastructure/kubernetes/base/ingress.yaml          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 OSRM Routing Service                         │
│              services/routing-service/                       │
│                  (Port 5000)                                 │
└─────────────────────────────────────────────────────────────┘
```

## Files Created/Modified

### Backend (Routing Service)

#### Created:
- `services/routing-service/Dockerfile` - OSRM Docker container
- `services/routing-service/README.md` - Service documentation
- `services/routing-service/.gitignore` - Excludes OSM data files

#### Modified:
- `docker-compose.yml` - Added routing-service for local development

### Infrastructure (Kubernetes)

#### Created:
- `infrastructure/kubernetes/base/routing-service-deployment.yaml` - K8s deployment & service

#### Modified:
- `infrastructure/kubernetes/base/kustomization.yaml` - Added routing-service to resources
- `infrastructure/kubernetes/base/ingress.yaml` - Added `/api/v1/route` path

### Frontend (Driver App)

#### Created:
- `apps/driver-app/app/components/Map.tsx` - Leaflet map component

#### Modified:
- `apps/driver-app/app/routes/home.tsx` - Display map on home page
- `apps/driver-app/package.json` - Added leaflet, react-leaflet, @types/leaflet

### Bug Fixes

#### Fixed:
- `services/volteryde-nest/package.json` - Fixed `@temporal/client` → `@temporalio/client`
- `workers/temporal-workers/package.json` - Fixed all `@temporal/*` → `@temporalio/*`

## Required User Actions

### 1. Download OSM Data File

**CRITICAL**: The OSRM service requires OpenStreetMap data to function.

```bash
# Navigate to the routing service directory
cd services/routing-service

# Download Ghana OSM data (or your region)
wget https://download.geofabrik.de/africa/ghana-latest.osm.pbf

# Or use curl
curl -O https://download.geofabrik.de/africa/ghana-latest.osm.pbf
```

**Alternative regions**: Visit [Geofabrik Downloads](https://download.geofabrik.de/) to download other regions.

### 2. Set MapTiler API Key (Optional but Recommended)

For custom, branded maps, sign up for a free MapTiler account:

1. Go to [MapTiler Cloud](https://cloud.maptiler.com/)
2. Create a free account
3. Create a new map style or use a preset
4. Copy your API key

Edit `apps/driver-app/app/components/Map.tsx`:

```typescript
const MAPTILER_API_KEY = 'YOUR_ACTUAL_KEY_HERE'; // Replace this
const USE_MAPTILER = true; // Set to true to enable MapTiler
```

**Note**: Without MapTiler, the map will use free OpenStreetMap tiles (which is perfectly fine for development).

### 3. Configure ECR Registry for Production

Edit `infrastructure/kubernetes/base/routing-service-deployment.yaml`:

```yaml
containers:
- name: routing-service
  image: YOUR_ECR_REGISTRY/routing-service:latest # <-- Replace with actual ECR URL
```

Example:
```yaml
image: 123456789012.dkr.ecr.us-east-1.amazonaws.com/volteryde/routing-service:latest
```

## Testing

### Local Development with Docker Compose

```bash
# From monorepo root
docker-compose up routing-service --build

# This will:
# 1. Build the OSRM image (takes 10-30 minutes first time)
# 2. Extract, partition, and customize the OSM data
# 3. Start the routing server on port 5000

# Test the service
curl "http://localhost:5000/route/v1/driving/-0.1870,5.6037;-0.2070,5.6137?overview=full&geometries=geojson"
```

### Test the Driver App Map

```bash
# From monorepo root
cd apps/driver-app
pnpm dev

# Open http://localhost:5173 (or whatever port Vite assigns)
# Click the "Test Route (Accra)" button to draw a route
```

## Deployment to Production

### 1. Build and Push Docker Image

```bash
cd services/routing-service

# Ensure ghana-latest.osm.pbf is present
ls -lh ghana-latest.osm.pbf

# Build the image (takes 10-30 minutes)
docker build -t routing-service:latest .

# Authenticate with ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ECR_REGISTRY

# Tag and push
docker tag routing-service:latest YOUR_ECR_REGISTRY/routing-service:latest
docker push YOUR_ECR_REGISTRY/routing-service:latest
```

### 2. Deploy to Kubernetes

```bash
cd infrastructure/kubernetes

# Apply the manifests
kubectl apply -k base/

# Verify deployment
kubectl get pods -n volteryde | grep routing-service
kubectl get svc -n volteryde | grep routing-service

# Check logs
kubectl logs -f -n volteryde deployment/routing-service
```

### 3. Test Production Endpoint

```bash
# Replace with your actual domain
curl "https://api.volteryde.com/api/v1/route/route/v1/driving/-0.1870,5.6037;-0.2070,5.6137?overview=full&geometries=geojson"
```

## API Reference

### OSRM Routing API

#### Get Route

**Endpoint**: `GET /route/v1/driving/{lon1},{lat1};{lon2},{lat2}`

**Parameters**:
- `overview=full` - Include full route geometry
- `geometries=geojson` - Return geometry as GeoJSON (easier for Leaflet)
- `steps=true` - Include turn-by-turn directions
- `alternatives=true` - Return alternative routes

**Example Request**:
```bash
curl "http://localhost:5000/route/v1/driving/-0.1870,5.6037;-0.2070,5.6137?overview=full&geometries=geojson"
```

**Example Response**:
```json
{
  "code": "Ok",
  "routes": [
    {
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-0.1870, 5.6037],
          [-0.1875, 5.6045],
          ...
        ]
      },
      "distance": 5430.2,
      "duration": 456.3,
      "weight": 456.3
    }
  ],
  "waypoints": [
    {
      "hint": "...",
      "distance": 1.23,
      "name": "Example Street",
      "location": [-0.1870, 5.6037]
    },
    ...
  ]
}
```

### Driver App Map Component

#### Drawing a Route

```typescript
import { DriverMap } from '@/components/Map';

// In your component
<DriverMap />

// The map includes a test button that calls:
drawRoute([5.6037, -0.187], [5.6137, -0.207])
```

## Future Enhancements

### Phase 2: Mobile Apps

When you implement the mobile apps (React Native):

```bash
# Install MapLibre for React Native
npm install @maplibre/react-native-maplibre-gl

# Use the same routing API
fetch('/api/v1/route/route/v1/driving/...')
```

### Phase 3: Real-time Driver Tracking

Integrate with the Telematics domain:

```typescript
// Subscribe to driver location updates via WebSocket
const ws = new WebSocket('wss://api.volteryde.com/api/v1/telematics/ws');

ws.onmessage = (event) => {
  const { driverId, location } = JSON.parse(event.data);
  // Update marker on map
  updateDriverMarker(driverId, location);
};
```

### Phase 4: Advanced Features

- **Traffic-aware routing**: Integrate real-time traffic data
- **Multi-stop routing**: Support for multiple waypoints
- **Geofencing**: Define zones for pickup/dropoff areas
- **Heat maps**: Visualize demand density
- **Route optimization**: Batch routing for multiple drivers

## Troubleshooting

### Issue: Docker build fails with "ghana-latest.osm.pbf not found"

**Solution**: Download the OSM file as described in step 1 above.

### Issue: OSRM service starts but returns no routes

**Symptoms**: HTTP 200 but empty `routes` array

**Solution**: 
1. Check the logs: `docker logs volteryde-routing`
2. Ensure the coordinates are within Ghana (or your OSM data region)
3. Verify coordinates are in `[longitude, latitude]` order (not lat/lng)

### Issue: Map doesn't display

**Solution**:
1. Check browser console for errors
2. Ensure Leaflet CSS is imported: `import 'leaflet/dist/leaflet.css'`
3. Check that the map container has a defined height: `style={{ height: '100vh' }}`

### Issue: Markers don't appear

**Solution**: Leaflet's default marker icons may not load correctly in React. We've added a fix in the Map component, but if issues persist:

```typescript
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;
```

## Resources

- [OSRM Documentation](http://project-osrm.org/)
- [Leaflet Documentation](https://leafletjs.com/)
- [React Leaflet Documentation](https://react-leaflet.js.org/)
- [MapTiler Documentation](https://docs.maptiler.com/)
- [Geofabrik OSM Downloads](https://download.geofabrik.de/)

## Support

For questions or issues:
1. Check the [Volteryde Platform Documentation](https://docs.volteryde.com)
2. Review the [Technical Blueprint](../TECHNICAL_BLUEPRINT.md)
3. Consult the [Repository Structure](../REPOSITORY_STRUCTURE.md)

---

**Implementation Status**: ✅ Complete

**Branch**: `map-system-addition`

**Tested**: 
- ✅ Docker Compose setup
- ✅ Frontend map component
- ⏳ Production K8s deployment (requires ECR setup)
- ⏳ OSRM routing (requires OSM data file)
