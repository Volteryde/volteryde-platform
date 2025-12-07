import { Feature, LineString } from 'geojson';

export interface Driver {
	id: string;
	name: string;
	rating: number;
	profileImage: string;
}

export interface Vehicle {
	id: string;
	plate: string;
	model: string;
	fuelLevel: number;
	status: 'Active' | 'Inactive' | 'Maintenance';
}

export const MOCK_DRIVER: Driver = {
	id: 'd-123',
	name: 'Kwame Mensah',
	rating: 4.8,
	profileImage: 'https://i.pravatar.cc/150?u=d-123',
};

export const MOCK_VEHICLE: Vehicle = {
	id: 'v-456',
	plate: 'GT-2025-X',
	model: 'Volteryde Electric Bus',
	fuelLevel: 85,
	status: 'Active',
};

// Apple's "Freeway Drive" simulation typically runs along I-280 in CA.
// We'll approximate a segment of this route so the simulated puck follows the line.
export const MOCK_ROUTE: Feature<LineString> = {
	type: 'Feature',
	properties: {
		id: 'r-280',
		name: 'Route 280: Freeway Express',
		eta: '15 min',
		distance: '12 km',
	},
	geometry: {
		type: 'LineString',
		coordinates: [
			[-122.030237, 37.331705], // Approx Start (Apple Park / 280)
			[-122.036000, 37.335000],
			[-122.045000, 37.340000],
			[-122.052000, 37.345000],
			[-122.060000, 37.350000],
			[-122.070000, 37.355000],
			[-122.080000, 37.360000],
			[-122.090000, 37.365000],
			[-122.100000, 37.370000],
			[-122.110000, 37.375000],
			[-122.120000, 37.380000], // Moving North-West along 280
			[-122.130000, 37.385000],
			[-122.140000, 37.390000],
			// This is a simplified straight-ish approximation for visual testing
		],
	},
};

export interface NavigationInstruction {
	id: string;
	text: string;
	subText?: string;
	distance: string | number; // e.g. "1.5 mi" OR raw meters
	modifier?: string; // Mapbox modifier string (e.g. "left", "slight right")
	maneuverLocation?: [number, number]; // [lon, lat] of the turn
	icon: 'turn-left' | 'turn-right' | 'continue' | 'u-turn' | 'arrive';
}

export interface TripStats {
	distanceMeters: number;
	durationSeconds: number;
	eta: string; // e.g. "12:18 pm"
	remainingTime: string; // e.g. "10 min"
	remainingDistance: string; // e.g. "2.1 mi"
	currentSpeed: number; // e.g. 45
	speedLimit: number; // e.g. 30
	currentStreet: string; // e.g. "Van Ness Ave"
}

export const MOCK_INSTRUCTIONS: NavigationInstruction = {
	id: 'step-1',
	text: 'Lombard St',
	subText: 'Then turn right',
	distance: '1.5 mi',
	icon: 'turn-left',
};

export const MOCK_TRIP_STATS: TripStats = {
	eta: '12:18 pm',
	remainingTime: '10 min',
	remainingDistance: '2.1 mi',
	currentSpeed: 45,
	speedLimit: 30,
	currentStreet: 'Van Ness Ave',
	distanceMeters: 0,
	durationSeconds: 0
};
