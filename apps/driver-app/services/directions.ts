import { Feature, LineString } from 'geojson';
import { NavigationInstruction, TripStats } from '../data/mocks';

const MAPBOX_API_URL = 'https://api.mapbox.com/directions/v5/mapbox/driving';

export interface RouteResponse {
	routeGeoJSON: Feature<LineString>;
	instructions: NavigationInstruction[];
	stats: TripStats;
}

export async function getDirections(
	start: [number, number],
	end: [number, number],
	currentHeading?: number
): Promise<RouteResponse | null> {
	// Initialize Mapbox with the token from environment variables
	const token = process.env.EXPO_PUBLIC_MAPBOX_KEY;
	if (!token) {
		console.error('Mapbox token missing');
		return null;
	}

	// Check if heading is valid (0-360). Native geolocator may return -1 if invalid.
	const isValidHeading = currentHeading !== undefined && currentHeading >= 0 && currentHeading <= 360;

	// If heading is available, force the route to start in that direction (within +/- 45 degrees)
	// We strictly need as many bearing items as coordinates (2: start, end).
	// We restrict start, leave end empty. e.g. "90,45;"
	const bearingsParam = isValidHeading ? `&bearings=${Math.round(currentHeading!)},45;` : '';

	const url = `${MAPBOX_API_URL}/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&banner_instructions=true&voice_instructions=true${bearingsParam}&access_token=${token}&overview=full`;

	try {
		console.log('[Directions] URL:', url.replace(token, 'HIDDEN'));
		let response = await fetch(url);
		let json = await response.json();

		// Challenge: Strict bearing might cause 'NoRoute'. Retry without bearings if so.
		if (json.code === 'NoRoute' && bearingsParam) {
			console.warn('[Directions] NoRoute with bearings. Retrying without bearings...');
			const retryUrl = `${MAPBOX_API_URL}/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&banner_instructions=true&voice_instructions=true&access_token=${token}&overview=full`;
			response = await fetch(retryUrl);
			json = await response.json();
		}

		if (json.code !== 'Ok' && json.code !== undefined) {
			console.error('[Directions] API Error:', json.code, json.message);
			return null;
		}

		if (!json.routes || json.routes.length === 0) {
			console.warn('[Directions] No routes found. Full response:', JSON.stringify(json).substring(0, 200));
			return null;
		}

		const route = json.routes[0];
		const geometry: LineString = route.geometry;
		const distanceMeters = route.distance;
		const durationSeconds = route.duration;

		// Parse Instructions from Steps
		const leg = route.legs[0];
		const steps = leg.steps;

		const instructions: NavigationInstruction[] = steps.map((step: any, index: number) => {
			// Logic to resolve the best text to display:
			// 1. Banner instruction primary text (richest)
			// 2. Step name (road name)
			// 3. Maneuver instruction (fallback)
			let primaryText = step.maneuver.instruction;
			let subText = index < steps.length - 1 ? steps[index + 1].maneuver.instruction : 'Arrive';
			let icon = mapManeuverToIcon(step.maneuver.type, step.maneuver.modifier);

			if (step.bannerInstructions && step.bannerInstructions.length > 0) {
				const primaryBanner = step.bannerInstructions[0].primary;
				if (primaryBanner) {
					primaryText = primaryBanner.text;
					// Optionally check for secondary text (e.g. exit number)
					if (step.bannerInstructions[0].secondary) {
						subText = step.bannerInstructions[0].secondary.text;
					} else if (step.name) {
						subText = step.name; // Use road name as subtext if banner doesn't specify
					}

					// Refine Icon based on banner modifier if available
					if (primaryBanner.modifier) {
						icon = mapManeuverToIcon(primaryBanner.type || step.maneuver.type, primaryBanner.modifier);
						// CRITICAL: Update the modifier variable to match the banner!
						step.maneuver.modifier = primaryBanner.modifier;
					}
				}
			}

			return {
				id: `step-${index}`,
				text: primaryText,
				subText: subText,
				distance: step.distance, // Pass raw meters (number)
				modifier: step.maneuver.modifier, // Pass raw mapbox modifier string
				maneuverLocation: step.maneuver.location, // [lon, lat]
				icon: icon,
			};
		});

		// Calculate Trip Stats
		const etaDate = new Date(Date.now() + durationSeconds * 1000);
		const stats: TripStats = {
			eta: etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
			remainingTime: Math.round(durationSeconds / 60) + ' min',
			remainingDistance: (distanceMeters / 1000).toFixed(1) + ' km', // KM
			currentSpeed: 0,
			speedLimit: 55,
			currentStreet: steps[0]?.name || 'Current Road',
			distanceMeters: distanceMeters,
			durationSeconds: durationSeconds
		};

		return {
			routeGeoJSON: {
				type: 'Feature',
				properties: { name: 'Optimized Route' },
				geometry,
			},
			instructions,
			stats,
		};
	} catch (error) {
		console.error('Error fetching directions:', error);
		return null;
	}
}

// Helper to map Mapbox maneuver types to our simple icon set
function mapManeuverToIcon(type: string, modifier?: string): NavigationInstruction['icon'] {
	if (type === 'turn') {
		if (modifier?.includes('left')) return 'turn-left';
		if (modifier?.includes('right')) return 'turn-right';
	}
	if (type === 'u_turn') return 'u-turn';
	if (type === 'arrive') return 'arrive';
	return 'continue';
}
