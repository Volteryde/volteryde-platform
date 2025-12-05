# Routing Service (OSRM)

Self-hosted routing service using OpenStreetMap data for Ghana.

## Prerequisites

Before building the Docker image, you MUST download the OpenStreetMap data file:

1. Download `ghana-latest.osm.pbf` from [Geofabrik](https://download.geofabrik.de/africa/ghana.html)
2. Place it in this directory: `services/routing-service/ghana-latest.osm.pbf`

## Local Development

```bash
# From the monorepo root
docker-compose up routing-service --build
```

The service will be available at: `http://localhost:5000`

## API Usage

### Get Route

```bash
curl "http://localhost:5000/route/v1/driving/-0.1870,5.6037;-0.2070,5.6137?overview=full&geometries=geojson"
```

### Response Format

```json
{
  "routes": [
    {
      "geometry": {
        "type": "LineString",
        "coordinates": [[lng, lat], ...]
      },
      "distance": 5430.2,
      "duration": 456.3
    }
  ]
}
```

## Production Deployment

The service is deployed to Kubernetes using the manifests in `infrastructure/kubernetes/base/routing-service-deployment.yaml`.

### Build and Push to ECR

```bash
# Build the image
docker build -t routing-service:latest ./services/routing-service

# Tag and push to ECR (replace with your registry)
docker tag routing-service:latest YOUR_ECR_REGISTRY/routing-service:latest
docker push YOUR_ECR_REGISTRY/routing-service:latest
```

## Resources

- **Memory**: 2-4 GB (OSRM needs RAM for the routing graph)
- **CPU**: 1-2 cores
- **Replicas**: 2 (for high availability)

## Notes

- The initial build takes 10-30 minutes depending on the size of the OSM data
- The preprocessing step (extract, partition, customize) runs during the Docker build
- The routing graph is stored in memory for fast queries
