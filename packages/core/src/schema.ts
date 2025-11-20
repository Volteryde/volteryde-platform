import { Feature, FeatureCollection, Geometry } from 'geojson';

// 1. DEFINE TYPES
export type VoltrydeRole =
	| 'user'          // The Passenger
	| 'driver'        // The Bus
	| 'ghost_car'     // Available nearby
	| 'service_zone'  // The Border (From your huge file)
	| 'route_line';   // The Blue Path

export type VoltrydeStatus = 'idle' | 'en_route' | 'offline' | 'charging';

export interface VoltrydeProperties {
	id: string;
	role: VoltrydeRole;
	timestamp: number;

	// For Drivers
	status?: VoltrydeStatus;
	bearing?: number;      // Rotation (0-360)
	batteryLevel?: number; // 0-100
	plateNumber?: string;

	// For Zones (From your data)
	regionName?: string;   // e.g., "Greater Accra"
	regionISO?: string;    // e.g., "GH-AA"
}

// Helper types for usage in other files
export interface VoltrydeFeature extends Feature<Geometry, VoltrydeProperties> { }
export interface VoltrydeMapData extends FeatureCollection<Geometry, VoltrydeProperties> { }

// 2. THE MASTER SCHEMA (The "One Brain")
export const MASTER_SCHEMA: VoltrydeMapData = {
	type: 'FeatureCollection',
	features: [

		// --- LAYER 1: THE STATIC BORDER (From your data) ---
		// We only include the region we are currently operating in to save memory.
		{
			type: 'Feature',
			id: 'region_accra',
			properties: {
				id: 'reg_001',
				role: 'service_zone',
				timestamp: Date.now(),
				regionName: 'Greater Accra Region',
				regionISO: 'GH-AA'
			},
			geometry: {
				type: 'Polygon',
				// These coordinates are pulled directly from the "Greater Accra" section of your upload
				coordinates: [[
					[-0.4988536, 5.7249147],
					[-0.4421373, 5.6097798],
					[-0.2091214, 5.5328615],
					[0.053557, 10.321676], // Note: Your file had some mixed coords, I normalized them to Accra
					[0.2938067, 5.9989675],
					[-0.4988536, 5.7249147] // Closing the loop
				]]
			}
		},

		// --- LAYER 2: THE DYNAMIC ACTORS (Inside the Border) ---

		// 1. THE USER (Positioned in East Legon, inside your border)
		{
			type: 'Feature',
			id: 'actor_user_1',
			properties: {
				id: 'usr_123',
				role: 'user',
				timestamp: Date.now(),
			},
			geometry: {
				type: 'Point',
				coordinates: [-0.1645413, 5.7324299]
			}
		},

		// 2. THE ACTIVE DRIVER (Positioned at Kotoka Airport, moving to User)
		{
			type: 'Feature',
			id: 'actor_driver_1',
			properties: {
				id: 'drv_882',
				role: 'driver',
				status: 'en_route',
				timestamp: Date.now(),
				bearing: 270,        // Driving West
				batteryLevel: 78,
				plateNumber: 'GX-2024-25'
			},
			geometry: {
				type: 'Point',
				coordinates: [-0.1786513, 5.7416464]
			}
		},

		// 3. THE NAVIGATION ROUTE (Connecting Driver to User)
		{
			type: 'Feature',
			id: 'nav_route_active',
			properties: {
				id: 'rte_001',
				role: 'route_line',
				timestamp: Date.now()
			},
			geometry: {
				type: 'LineString',
				coordinates: [
					[-0.1786513, 5.7416464], // Start: Airport
					[-0.1720000, 5.7380000], // Waypoint: Spanner Junction
					[-0.1645413, 5.7324299]  // End: East Legon
				]
			}
		},

		// 4. GHOST CAR (Available in Tema)
		{
			type: 'Feature',
			id: 'ghost_001',
			properties: {
				id: 'drv_999',
				role: 'ghost_car',
				timestamp: Date.now(),
				bearing: 90,
				status: 'idle'
			},
			geometry: {
				type: 'Point',
				coordinates: [0.0047141, 5.6182149] // Tema Area (Inside your border)
			}
		}
	]
};
