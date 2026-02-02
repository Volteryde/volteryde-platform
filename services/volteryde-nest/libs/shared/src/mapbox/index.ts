// ============================================================================
// Mapbox Services - Public API
// ============================================================================
// Re-exports all Mapbox services and types for easy importing

// Module
export { MapboxModule } from './mapbox.module';

// Services
export { MapboxLocatorService } from './mapbox-locator.service';
export { MapboxMatchmakerService } from './mapbox-matchmaker.service';
export { MapboxNavigatorService } from './mapbox-navigator.service';
export { MapboxTilesetSyncService, StopData } from './mapbox-tileset-sync.service';

// Types
export {
	// Core types
	GeoCoordinate,
	SnapResult,
	StopMetadata,
	ServiceVoidError,

	// Tilequery types
	TilequeryResponse,
	TilequeryFeature,

	// Matrix types
	MatrixRequest,
	MatrixResponse,
	StopPairResult,

	// Navigation types
	RouteLeg,
	RouteStep,
	NavigationRoute,

	// Fare types
	FareBreakdown,
	FareEstimateRequest,
	FareEstimateResult,

	// Config types
	MapboxConfig,

	// Constants
	WALKING_ASSUMPTIONS,
	DEFAULT_MAPBOX_CONFIG,
} from './mapbox.types';
