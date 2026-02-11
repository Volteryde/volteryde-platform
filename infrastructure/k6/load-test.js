// ============================================================================
// Volteryde Platform - k6 Load Testing Script
// ============================================================================
// Usage: k6 run load-test.js
//        k6 run --vus 100 --duration 5m load-test.js
//
// Environment Variables:
//   BASE_URL - Base URL of the API (default: http://localhost:3010)

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ============================================================================
// Custom Metrics
// ============================================================================
const errorRate = new Rate('errors');
const requestDuration = new Trend('request_duration');
const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');

// ============================================================================
// Test Configuration
// ============================================================================
export const options = {
	// Ramping VUs pattern for realistic load testing
	stages: [
		{ duration: '30s', target: 10 },   // Ramp up to 10 users
		{ duration: '1m', target: 50 },    // Ramp up to 50 users
		{ duration: '2m', target: 50 },    // Stay at 50 users
		{ duration: '30s', target: 100 },  // Spike to 100 users
		{ duration: '1m', target: 100 },   // Stay at 100 users
		{ duration: '30s', target: 0 },    // Ramp down to 0
	],

	// Thresholds for pass/fail criteria
	thresholds: {
		http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% under 500ms, 99% under 1s
		http_req_failed: ['rate<0.01'],                  // Less than 1% errors
		errors: ['rate<0.01'],                           // Custom error rate
	},

	// Tags for better metric segmentation
	tags: {
		environment: __ENV.ENVIRONMENT || 'local',
		service: 'volteryde-api',
	},
};

// ============================================================================
// Test Data
// ============================================================================
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3010';
const AUTH_SERVICE_URL = __ENV.AUTH_SERVICE_URL || 'http://localhost:8081';

// ============================================================================
// Test Scenarios
// ============================================================================
export default function () {
	// Health Check
	group('Health Endpoints', function () {
		const healthRes = http.get(`${BASE_URL}/health`);

		const healthCheck = check(healthRes, {
			'health status is 200': (r) => r.status === 200,
			'health response time < 100ms': (r) => r.timings.duration < 100,
		});

		if (!healthCheck) {
			errorRate.add(1);
			failedRequests.add(1);
		} else {
			successfulRequests.add(1);
		}

		requestDuration.add(healthRes.timings.duration);
	});

	sleep(0.1);

	// GTFS Routes Endpoint
	group('GTFS Routes', function () {
		const routesRes = http.get(`${BASE_URL}/api/gtfs/routes`, {
			headers: { 'Content-Type': 'application/json' },
		});

		const routesCheck = check(routesRes, {
			'routes status is 200': (r) => r.status === 200,
			'routes response has data': (r) => {
				try {
					const body = JSON.parse(r.body);
					return body !== null;
				} catch (e) {
					return false;
				}
			},
			'routes response time < 500ms': (r) => r.timings.duration < 500,
		});

		if (!routesCheck) {
			errorRate.add(1);
			failedRequests.add(1);
		} else {
			successfulRequests.add(1);
		}

		requestDuration.add(routesRes.timings.duration);
	});

	sleep(0.5);

	// GTFS Stops Endpoint
	group('GTFS Stops', function () {
		const stopsRes = http.get(`${BASE_URL}/api/gtfs/stops`, {
			headers: { 'Content-Type': 'application/json' },
		});

		const stopsCheck = check(stopsRes, {
			'stops status is 200': (r) => r.status === 200,
			'stops response time < 500ms': (r) => r.timings.duration < 500,
		});

		if (!stopsCheck) {
			errorRate.add(1);
			failedRequests.add(1);
		} else {
			successfulRequests.add(1);
		}

		requestDuration.add(stopsRes.timings.duration);
	});

	sleep(0.3);

	// Auth Service Health (if accessible)
	group('Auth Service', function () {
		const authHealthRes = http.get(`${AUTH_SERVICE_URL}/api/auth/actuator/health`);

		const authCheck = check(authHealthRes, {
			'auth service is healthy': (r) => r.status === 200,
			'auth response time < 200ms': (r) => r.timings.duration < 200,
		});

		if (!authCheck) {
			errorRate.add(1);
		} else {
			successfulRequests.add(1);
		}
	});

	sleep(0.5);
}

// ============================================================================
// Setup and Teardown
// ============================================================================
export function setup() {
	console.log(`🚀 Starting load test against ${BASE_URL}`);

	// Verify services are reachable
	const healthCheck = http.get(`${BASE_URL}/health`);
	if (healthCheck.status !== 200) {
		throw new Error(`API is not reachable at ${BASE_URL}/health`);
	}

	return { startTime: new Date().toISOString() };
}

export function teardown(data) {
	console.log(`✅ Load test completed. Started at: ${data.startTime}`);
}

// ============================================================================
// Summary Handler
// ============================================================================
export function handleSummary(data) {
	return {
		'stdout': textSummary(data, { indent: ' ', enableColors: true }),
		'load-test-results.json': JSON.stringify(data, null, 2),
	};
}

// Simple text summary (k6 built-in would be used in practice)
function textSummary(data) {
	return `
========================================
  VOLTERYDE LOAD TEST RESULTS
========================================
  Total Requests: ${data.metrics.http_reqs?.values?.count || 0}
  Failed Requests: ${data.metrics.http_req_failed?.values?.passes || 0}
  
  Response Times:
    - Avg: ${(data.metrics.http_req_duration?.values?.avg || 0).toFixed(2)}ms
    - p95: ${(data.metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(2)}ms
    - p99: ${(data.metrics.http_req_duration?.values?.['p(99)'] || 0).toFixed(2)}ms
  
  Thresholds Passed: ${Object.values(data.thresholds || {}).every(t => t.ok) ? '✅ YES' : '❌ NO'}
========================================
  `;
}
