import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DriverMap from '../components/DriverMap';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { getDirections, RouteResponse } from '../services/directions';
import { ManeuverBanner } from '../components/Navigation/ManeuverBanner';
import { TripSummary, RecenterButton } from '../components/Navigation/TripSummary';
import { PassengerSidebar } from '../components/Dashboard/PassengerSidebar';
import { BusMetricsBar } from '../components/Dashboard/BusMetrics';

export default function Dashboard() {
	const [routeData, setRouteData] = useState<RouteResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [isNavigating, setIsNavigating] = useState(false); // Toggle to show Nav HUD vs Dashboard

	useEffect(() => {
		let isMounted = true;
		let locationSubscription: Location.LocationSubscription | null = null;

		(async () => {
			try {
				setLoading(true);

				// 1. Request Permissions
				const { status } = await Location.requestForegroundPermissionsAsync();
				if (status !== 'granted') {
					throw new Error('Permission denied');
				}

				// 2. Get Initial Location for Route Calculation
				let location = await Location.getLastKnownPositionAsync({});
				if (!location) {
					location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
				}

				// 3. Calculate Initial Route: Madina to Accra (Ghana)
				// Madina: -0.1660, 5.6690
				// Accra: -0.1870, 5.6037
				const start: [number, number] = [-0.1660, 5.6690];
				const end: [number, number] = [-0.1870, 5.6037];

				const data = await getDirections(start, end, 180); // Default heading South-ish

				if (isMounted) {
					if (data) {
						setRouteData(data);
					} else {
						console.warn('Failed to fetch initial route');
					}
				}

				// 4. Start Live Tracking (Keep Alive)
				locationSubscription = await Location.watchPositionAsync(
					{
						accuracy: Location.Accuracy.High,
						timeInterval: 2000,
						distanceInterval: 10,
					},
					async (newLocation) => {
						// In real app, update route progress here
					}
				);

			} catch (error) {
				console.warn('Navigation setup failed:', error);
			} finally {
				if (isMounted) setLoading(false);
			}
		})();

		return () => {
			isMounted = false;
			if (locationSubscription) {
				locationSubscription.remove();
			}
		};
	}, []);

	// Simulation Loop & Stats Update
	const [simulatedLocation, setSimulatedLocation] = useState<{ latitude: number, longitude: number, heading: number } | null>(null);
	const [liveStats, setLiveStats] = useState<RouteResponse['stats'] | null>(null);
	const [instructionIndex, setInstructionIndex] = useState(0);
	const [distanceToTurn, setDistanceToTurn] = useState<number | null>(null);

	useEffect(() => {
		if (!routeData || !routeData.routeGeoJSON) return;
		setLiveStats(routeData.stats);

		console.log('Starting Simulation Loop...');
		const coords = (routeData.routeGeoJSON.geometry as any).coordinates;
		let index = 0;
		let tick = 0;
		let direction = 1; // 1 = forward, -1 = backward

		// Helper to calc distance (Haversine)
		const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
			const R = 6371e3; // metres
			const φ1 = lat1 * Math.PI / 180;
			const φ2 = lat2 * Math.PI / 180;
			const Δφ = (lat2 - lat1) * Math.PI / 180;
			const Δλ = (lon2 - lon1) * Math.PI / 180;
			const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
			const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
			return R * c;
		};

		const interval = setInterval(() => {
			if (index >= coords.length - 1 && direction === 1) {
				direction = -1;
			} else if (index <= 0 && direction === -1) {
				direction = 1;
				// Reset instruction index if looping back to start
				setInstructionIndex(0);
			}

			// 1. Move Simulation
			const current = coords[index];
			const next = coords[index + direction];

			if (current && next) {
				const toRad = (deg: number) => deg * Math.PI / 180;
				const toDeg = (rad: number) => rad * 180 / Math.PI;
				const lat1 = toRad(current[1]);
				const lat2 = toRad(next[1]);
				const dLon = toRad(next[0] - current[0]);
				const y2 = Math.sin(dLon) * Math.cos(lat2);
				const x2 = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
				let bearing = toDeg(Math.atan2(y2, x2));
				if (bearing < 0) bearing += 360;

				setSimulatedLocation({
					longitude: current[0],
					latitude: current[1],
					heading: bearing
				});

				// 1.5 Dynamic Navigation Logic: Calculate distance to next maneuver
				// Note: setInterval closure captures initial state, so we use functional updates or Refs in real apps.
				// For simplicity here, we'll access instructions from routeData (const) but tracking index needs care.
				// We'll trust the component re-renders to pick up state, but inside setInterval we rely on a ref or simple logic.
				// Actually, since `useEffect` deps includes `routeData`, we are safe-ish.
				// BUT `instructionIndex` state won't update inside this closure! 
				// We need a local tracker variable or Ref.

				setInstructionIndex(currentIdx => {
					const activeInstr = routeData.instructions[currentIdx];
					if (activeInstr && activeInstr.maneuverLocation) {
						const dist = getDistance(current[1], current[0], activeInstr.maneuverLocation[1], activeInstr.maneuverLocation[0]);
						setDistanceToTurn(dist);

						// If within 30m of turn, advance instruction
						if (dist < 30 && currentIdx < routeData.instructions.length - 1) {
							return currentIdx + 1;
						}
					}
					return currentIdx;
				});
			}

			// 2. Update Stats
			tick++;
			if (tick % 3 === 0) {
				const fractionTraveled = (direction === 1) ? (index / coords.length) : ((coords.length - index) / coords.length);
				const fractionRemaining = 1 - fractionTraveled;

				const remainingDist = Math.floor(routeData.stats.distanceMeters * fractionRemaining);
				const remainingTime = Math.floor(routeData.stats.durationSeconds * fractionRemaining);

				const now = new Date();
				const arrivalTime = new Date(now.getTime() + remainingTime * 1000);
				const etaString = arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

				setLiveStats(prev => prev ? ({
					...prev,
					distanceMeters: remainingDist,
					durationSeconds: remainingTime,
					eta: etaString,
					currentSpeed: Math.floor(Math.random() * (45 - 25) + 25)
				}) : null);
			}

			index += direction;
		}, 1000);

		return () => clearInterval(interval);
	}, [routeData]);

	if (loading || !routeData) {
		return (
			<View className="flex-1 justify-center items-center bg-white gap-4" pointerEvents="box-none">
				<ActivityIndicator size="large" color="#0066CC" />
				<Text className="text-gray-500 font-medium">Initializing Navigation...</Text>
				<Text className="text-xs text-gray-400">Please wait while we fetch your route.</Text>
			</View>
		);
	}

	// Use liveStats if available, else initial stats
	const displayStats = liveStats || routeData.stats;
	const currentInstruction = routeData.instructions[instructionIndex];

	return (
		<View style={{ flex: 1 }}>
			<DriverMap
				routeGeoJSON={routeData.routeGeoJSON}
				simulatedLocation={simulatedLocation}
			/>

			{/* HUD Overlay Layer */}
			<SafeAreaView className="absolute inset-0 flex-1 pointer-events-box-none" style={{ pointerEvents: 'box-none' }}>

				{/* 1. Top Left: Navigation Banner */}
				<ManeuverBanner
					distance={
						distanceToTurn !== null
							? `${Math.round(distanceToTurn)}m`
							: (
								typeof currentInstruction?.distance === 'number'
									? `${Math.round(currentInstruction.distance)}m`
									: (currentInstruction?.distance as string || "0m")
							)
					}
					// Pass the raw number for logic inside the component (e.g. show ArrowUp if > 300m)
					rawDistance={
						distanceToTurn !== null
							? distanceToTurn
							: (typeof currentInstruction?.distance === 'number' ? currentInstruction.distance : 0)
					}
					instruction={currentInstruction?.text}
					modifier={currentInstruction?.modifier}
				/>

				{/* 2. Right Side: Passenger Activity (Dashboard) */}
				<PassengerSidebar />

				{/* 3. Bottom Panel: Trip Stats OR Bus Metrics */}
				{/* Visual spec B says Trip Stats. Image says Bus Metrics. I'll stack them or toggle. */}
				{/* Let's put Bus Metrics as the default 'Dashboard' view, and Trip View as 'Nav' view. */}
				{/* But user wants both features. I'll put Bus Metrics (Battery etc) floating ABOVE the bottom sheet if room, or swap. */}
				{/* Current Decision: Render Bus Metrics (from image) AND Trip Stats (from text) */}

				{/* Bus Metrics (Seats, Battery) - Fits nicely with Sidebar */}
				<BusMetricsBar />

				{/* Navigation Trip Panel (Docked bottom) - Optional toggle */}
				{/* <TripSummary 
                    eta={displayStats.eta}
                    remainingTime={`${Math.round(displayStats.durationSeconds / 60)} min`}
                    remainingDistance={`${(displayStats.distanceMeters / 1000).toFixed(1)} km`}
                    onEndTrip={() => {}}
                /> */}

				{/* Floating Controls */}
				<RecenterButton onPress={() => { /* Recenter Map Logic via Ref */ }} />

			</SafeAreaView>
		</View>
	);
}
