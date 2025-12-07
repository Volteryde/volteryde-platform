import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
	...config,
	name: "Volteryde Driver",
	slug: "driver-app",
	version: "1.0.0",
	orientation: "default",
	icon: "./assets/images/icon.png",
	scheme: "driverapp",
	userInterfaceStyle: "automatic",
	newArchEnabled: true,
	ios: {
		supportsTablet: true,
		bundleIdentifier: "com.volteryde.driver",
		infoPlist: {
			UIBackgroundModes: ["location", "fetch"],
		}
	},
	android: {
		adaptiveIcon: {
			foregroundImage: "./assets/images/android-icon-foreground.png",
			backgroundColor: "#E6F4FE"
		},
		permissions: [
			"ACCESS_COARSE_LOCATION",
			"ACCESS_FINE_LOCATION"
		],
		package: "com.volteryde.driver"
	},
	web: {
		bundler: "metro",
		output: "static",
		favicon: "./assets/images/favicon.png"
	},
	plugins: [
		"expo-router",
		[
			"@rnmapbox/maps",
			{
				RNMapboxMapsImpl: "mapbox",
				RNMapboxMapsUseV11: true
			}
		]
	],
	experiments: {
		typedRoutes: true
	}
});
