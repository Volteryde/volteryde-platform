// ============================================================================
// Volteryde Platform - k6 Stress Testing Script
// ============================================================================
// Tests system behavior under extreme load conditions.
//
// Usage: k6 run stress-test.js
//        k6 run --env BREAK_POINT=200 stress-test.js
//
// WARNING: This test is designed to push the system to its limits.
//          Only run in non-production environments.

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ============================================================================
// Custom Metrics
// ============================================================================
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const breakingPointVus = new Counter('breaking_point_vus');

// ============================================================================
// Stress Test Configuration
// ============================================================================
const BREAK_POINT = parseInt(__ENV.BREAK_POINT) || 200;

export const options = {
	// Stress test pattern - continuously increase load
	stages: [
		{ duration: '1m', target: 20 },       // Warm up
		{ duration: '2m', target: 50 },       // Normal load
		{ duration: '2m', target: 100 },      // High load
		{ duration: '2m', target: 150 },      // Very high load
		{ duration: '2m', target: BREAK_POINT }, // Breaking point
		{ duration: '3m', target: BREAK_POINT }, // Sustain breaking point
		{ duration: '2m', target: 0 },        // Recovery
	],

	// More lenient thresholds for stress testing
	thresholds: {
		http_req_duration: ['p(95)<2000'],     // 95% under 2s (stress)
		http_req_failed: ['rate<0.10'],        // Less than 10% errors (stress)
		errors: ['rate<0.10'],
	},

	// Abort if error rate exceeds 30%
	abortOnFail: false,
};

// ============================================================================
// Test Data
// ============================================================================
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3010';
const AUTH_URL = __ENV.AUTH_SERVICE_URL || 'http://localhost:8081';
const BOOKING_URL = __ENV.BOOKING_SERVICE_URL || 'http://localhost:3004';

// ============================================================================
// Main Stress Test
// ============================================================================
export default function () {
	// Parallel requests to simulate real user behavior
	const responses = http.batch([
		['GET', `${BASE_URL}/health`],
		['GET', `${BASE_URL}/api/gtfs/routes`],
		['GET', `${AUTH_URL}/api/auth/actuator/health`],
	]);

	// Check all responses
	responses.forEach((res, index) => {
		const success = check(res, {
			'status is 2xx': (r) => r.status >= 200 && r.status < 300,
			'response time < 2000ms': (r) => r.timings.duration < 2000,
		});

		if (!success) {
			errorRate.add(1);
			// Track when we hit breaking point
			if (res.status >= 500 || res.timings.duration > 2000) {
				breakingPointVus.add(__VU);
			}
		}

		responseTime.add(res.timings.duration);
	});

	// Simulate realistic user think time
	sleep(Math.random() * 2 + 0.5); // 0.5-2.5 seconds
}

// ============================================================================
// Spike Test Scenario
// ============================================================================
export function spike() {
	const res = http.get(`${BASE_URL}/api/gtfs/routes`);

	check(res, {
		'spike response ok': (r) => r.status === 200,
	});

	sleep(0.1);
}

// ============================================================================
// Setup
// ============================================================================
export function setup() {
	console.log(`⚠️  STRESS TEST: Ramping up to ${BREAK_POINT} VUs`);
	console.log(`📊 Target URL: ${BASE_URL}`);

	// Verify API is accessible
	const healthCheck = http.get(`${BASE_URL}/health`);
	if (healthCheck.status !== 200) {
		throw new Error(`Cannot reach API at ${BASE_URL}`);
	}

	return {
		startTime: new Date().toISOString(),
		breakPoint: BREAK_POINT,
	};
}

// ============================================================================
// Teardown
// ============================================================================
export function teardown(data) {
	console.log(`\n🏁 Stress test completed`);
	console.log(`   Started: ${data.startTime}`);
	console.log(`   Break Point Target: ${data.breakPoint} VUs`);
}

// ============================================================================
// Summary Handler
// ============================================================================
export function handleSummary(data) {
	const p95 = data.metrics.http_req_duration?.values?.['p(95)'] || 0;
	const p99 = data.metrics.http_req_duration?.values?.['p(99)'] || 0;
	const failRate = data.metrics.http_req_failed?.values?.rate || 0;

	const status = failRate > 0.1 ? '❌ BREAKING POINT REACHED' : '✅ SYSTEM STABLE';

	console.log(`\n${status}`);
	console.log(`  Error Rate: ${(failRate * 100).toFixed(2)}%`);
	console.log(`  p95 Latency: ${p95.toFixed(2)}ms`);
	console.log(`  p99 Latency: ${p99.toFixed(2)}ms`);

	return {
		'stress-test-results.json': JSON.stringify(data, null, 2),
	};
}
