# Volteryde k6 Load Testing

Performance and stress testing scripts for the Volteryde platform using [k6](https://k6.io/).

## Installation

```bash
# macOS
brew install k6

# Docker
docker pull grafana/k6
```

## Usage

### Load Test
Standard load test with ramping virtual users:

```bash
# Using installed k6
k6 run load-test.js

# With custom settings
k6 run --vus 100 --duration 5m load-test.js

# Custom base URL
BASE_URL=https://api.volteryde.com k6 run load-test.js

# Using Docker
docker run -i grafana/k6 run - < load-test.js
```

### Stress Test
Push the system to its limits:

```bash
# Default breaking point (200 VUs)
k6 run stress-test.js

# Custom breaking point
k6 run --env BREAK_POINT=300 stress-test.js
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:3010` | Volteryde API URL |
| `AUTH_SERVICE_URL` | `http://localhost:8081` | Auth service URL |
| `BOOKING_SERVICE_URL` | `http://localhost:3004` | Booking service URL |
| `ENVIRONMENT` | `local` | Environment tag for metrics |
| `BREAK_POINT` | `200` | Max VUs for stress test |

## Thresholds

### Load Test
- 95th percentile response time < 500ms
- 99th percentile response time < 1000ms
- Error rate < 1%

### Stress Test
- 95th percentile response time < 2000ms
- Error rate < 10%

## Results

Test results are saved as JSON files:
- `load-test-results.json` - Load test metrics
- `stress-test-results.json` - Stress test metrics

## Integration with Grafana

To visualize results in Grafana:

```bash
k6 run --out influxdb=http://localhost:8086/k6 load-test.js
```

Configure InfluxDB as a data source in Grafana and import k6 dashboards.
