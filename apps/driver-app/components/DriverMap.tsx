import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Mapbox, {
	Camera,
	UserLocation,
	MapView,
	ShapeSource,
	LineLayer,
	UserTrackingMode,
	SkyLayer,
	VectorSource,
	FillExtrusionLayer,
	LocationPuck,
} from '@rnmapbox/maps';
import * as Location from 'expo-location';

// Initialize Mapbox with the public token from environment variables
const token = process.env.EXPO_PUBLIC_MAPBOX_KEY || '';
Mapbox.setAccessToken(token);

interface DriverMapProps {
	routeGeoJSON?: GeoJSON.FeatureCollection | GeoJSON.Feature;
	simulatedLocation?: {
		latitude: number;
		longitude: number;
		heading: number;
	} | null;
}

const DriverMap: React.FC<DriverMapProps> = ({ routeGeoJSON, simulatedLocation }) => {
	const [isMapReady, setIsMapReady] = useState(false);
	const [hasPermissions, setHasPermissions] = useState(false);

	// Tracks the user's real location for fallback/initialization
	const [currentLocation, setCurrentLocation] = useState<{
		latitude: number;
		longitude: number;
		heading: number;
	} | null>(null);

	const cameraRef = useRef<Camera>(null);
	const mapRef = useRef<MapView>(null);

	// Request permissions (legacy logic preserved for safety)
	useEffect(() => {
		(async () => {
			const { status } = await Location.requestForegroundPermissionsAsync();
			setHasPermissions(status === 'granted');
			if (status === 'granted') {
				const loc = await Location.getCurrentPositionAsync({});
				setCurrentLocation({
					latitude: loc.coords.latitude,
					longitude: loc.coords.longitude,
					heading: loc.coords.heading || 0
				});
			}
		})();
	}, []);

	// Determine if using simulation or real GPS
	const isSimulating = !!simulatedLocation;
	const activeLocation = isSimulating ? simulatedLocation : currentLocation;

	const onRecenter = () => {
		// Simple way to reset tracking if broken
	};

	return (
		<View style={styles.container}>
			<MapView
				ref={mapRef}
				style={styles.map}
				styleURL="mapbox://styles/kaeytee/cmi7zuj70001201s947af9oze"
				scaleBarEnabled={false}
				logoEnabled={false}
				attributionEnabled={false}
				pitchEnabled={true}
				rotateEnabled={true}
				compassEnabled={false}
				onDidFinishLoadingStyle={() => setIsMapReady(true)}
			>
				{/* 
                  Camera Configuration: "GPS Unit" View 
                  - Pitch 60 for 3D depth
                  - Zoom 17 for street level
                  - Mode: 'course' (Heading Up)
                  - Padding shifts center down to leave room for Top HUD and Bottom Panel
                */}
				<Camera
					ref={cameraRef}
					defaultSettings={{
						pitch: 60,
						zoomLevel: 17,
					}}
					// If simulating, we drive the camera manually via props
					// If real, we rely on followUserLocation + followUserMode
					centerCoordinate={
						isSimulating && simulatedLocation
							? [simulatedLocation.longitude, simulatedLocation.latitude]
							: undefined
					}
					heading={isSimulating && simulatedLocation ? simulatedLocation.heading : undefined}

					followUserLocation={!isSimulating}
					followUserMode={!isSimulating ? UserTrackingMode.FollowWithCourse : undefined}

					zoomLevel={18.5}
					pitch={70}
					animationDuration={500}
					// CRITICAL: Shift map center down (bottom padding) and slightly down from top
					padding={{
						paddingBottom: 120, // Slightly less padding to keep it centered but low
						paddingTop: 200,
						paddingLeft: 0,
						paddingRight: 0,
					}}
				/>

				{isMapReady && (
					<>
						{/* 3D Buildings Overlay */}
						<VectorSource id="mapbox-streets" url="mapbox://mapbox.mapbox-streets-v8">
							<FillExtrusionLayer
								id="building-3d"
								sourceLayerID="building"
								minZoomLevel={15}
								maxZoomLevel={22}
								style={{
									fillExtrusionColor: [
										'interpolate',
										['linear'],
										['get', 'height'],
										0, '#d4dce5',
										50, '#b8c4d0',
										100, '#9cacbb',
									],
									fillExtrusionHeight: ['get', 'height'],
									fillExtrusionBase: ['get', 'min_height'],
									fillExtrusionOpacity: 0.6,
								}}
							/>
						</VectorSource>

						{/* Dynamic Sky Layer */}
						<SkyLayer
							id="sky-layer"
							style={{
								skyType: 'atmosphere',
								skyAtmosphereSun: [0.0, 75.0],
								skyAtmosphereSunIntensity: 8.0,
							}}
						/>

						{/* Route Line: Double Layer for 3D Road Effect */}
						{routeGeoJSON && (
							<ShapeSource id="routeSource" shape={routeGeoJSON}>
								{/* Casing (White Border) */}
								<LineLayer
									id="routeCasing"
									style={{
										lineColor: '#ffffff',
										lineWidth: 10,
										lineCap: 'round',
										lineJoin: 'round',
										lineSortKey: 1, // Draw below fill
									}}
								/>
								{/* Fill (Blue Path) */}
								<LineLayer
									id="routeFill"
									style={{
										lineColor: '#3887be',
										lineWidth: 6,
										lineCap: 'round',
										lineJoin: 'round',
										lineSortKey: 2, // Draw on top
									}}
								/>
							</ShapeSource>
						)}
					</>
				)}

				{/* 
                   User Location Puck
                   - If simulating, we use our custom MarkerView (Green Arrow)
                   - If real, we use Native UserLocation with Heading Indicator
                */}
				{/* Simulation Marker */}
				{isMapReady && isSimulating && simulatedLocation && (
					<Mapbox.MarkerView
						id="vehicleMarker"
						coordinate={[simulatedLocation.longitude, simulatedLocation.latitude]}
						anchor={{ x: 0.5, y: 0.5 }}
						allowOverlap={true}
					>
						{/* 
                           Fixed Rotation: 
                           In 'Course Up' mode, the map rotates so the heading is always 'Up'.
                           Therefore, the marker should NOT rotate relative to the screen, 
                           it should stay pointing 'Up' (0deg) visually. 
                           The map rotation handles the heading visualization.
                        */}
						<View style={{ transform: [{ rotate: '0deg' }] }}>
							{/* Google Maps Style Green Arrow */}
							<View style={styles.arrowContainer}>
								<View style={styles.arrowGlow} />
								<View style={styles.arrowWrapper}>
									<View style={styles.arrowPointer} />
									<View style={styles.arrowBody}>
										<View style={styles.frontDot} />
										<View style={styles.headlightsContainer}>
											<View style={styles.headlightDot} />
											<View style={styles.headlightDot} />
										</View>
									</View>
								</View>
							</View>
						</View>
					</Mapbox.MarkerView>
				)}

				{/* Real User Location (Native Puck) */}
				{!isSimulating && (
					<UserLocation
						visible={true}
						showsUserHeadingIndicator={true}
						minDisplacement={0}
						androidRenderMode='gps'
					/>
				)}
			</MapView>

			{/* Recenter Button logic if needed (hidden for now as HUD handles controls) */}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
		height: '100%',
		
	},
	map: {
		flex: 1,
		width: '100%',
		height: '100%',
	},
	// Re-using existing arrow styles for simulation fallback
	arrowContainer: {
		width: 80,
		height: 80,
		alignItems: 'center',
		justifyContent: 'center',
	},
	arrowGlow: {
		position: 'absolute',
		width: 70,
		height: 70,
		backgroundColor: 'rgba(76, 175, 80, 0.2)',
		borderRadius: 35,
	},
	arrowWrapper: {
		width: 60,
		height: 60,
		alignItems: 'center',
		justifyContent: 'flex-start',
	},
	arrowPointer: {
		width: 0,
		height: 0,
		backgroundColor: 'transparent',
		borderStyle: 'solid',
		borderLeftWidth: 18,
		borderRightWidth: 18,
		borderBottomWidth: 30,
		borderLeftColor: 'transparent',
		borderRightColor: 'transparent',
		borderBottomColor: '#4CAF50',
	},
	arrowBody: {
		width: 20,
		height: 30,
		backgroundColor: '#4CAF50',
		marginTop: -2,
		borderBottomLeftRadius: 4,
		borderBottomRightRadius: 4,
		alignItems: 'center',
	},
	frontDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#FFFFFF',
		marginTop: 4,
	},
	headlightsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
		paddingHorizontal: 3,
		marginTop: 3,
	},
	headlightDot: {
		width: 5,
		height: 5,
		borderRadius: 2.5,
		backgroundColor: '#FFEB3B',
	},
});

export default DriverMap;