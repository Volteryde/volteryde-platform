// ============================================================================
// GTFS Controller
// ============================================================================
// REST API endpoints for GTFS transit data
// Provides stops, routes, trips, schedules, and availability endpoints

import {
	Controller,
	Get,
	Post,
	Query,
	Param,
	Body,
	HttpCode,
	HttpStatus,
} from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiParam,
	ApiQuery,
} from '@nestjs/swagger';
import { GtfsService } from '../services/gtfs.service';
import {
	NearbyStopsQueryDto,
	CreateStopDto,
	CreateRouteDto,
	RoutesQueryDto,
	TripsQueryDto,
	CreateTripDto,
	ScheduleQueryDto,
	SyncQueryDto,
	AvailabilityQueryDto,
} from '../dto';
import {
	StopResponseDto,
	NearbyStopsResponseDto,
	RouteResponseDto,
	RoutesListResponseDto,
	TripResponseDto,
	TripWithStopsResponseDto,
	TripsListResponseDto,
	ScheduleResponseDto,
	AvailabilityResponseDto,
	SyncResponseDto,
} from '../dto';

@ApiTags('GTFS - Transit Data')
@Controller('gtfs')
export class GtfsController {
	constructor(private readonly gtfsService: GtfsService) { }

	// ============================================================================
	// Stop Endpoints
	// ============================================================================

	@Get('stops/nearby')
	@ApiOperation({
		summary: 'Find nearby stops',
		description: 'Returns bus stops within a specified radius of coordinates using PostGIS spatial queries',
	})
	@ApiResponse({
		status: 200,
		description: 'List of nearby stops with distance',
		type: NearbyStopsResponseDto,
	})
	async getNearbyStops(@Query() query: NearbyStopsQueryDto): Promise<NearbyStopsResponseDto> {
		const latNum = parseFloat(query.lat.toString());
		const lngNum = parseFloat(query.lng.toString());
		const radNum = query.radius ? parseFloat(query.radius.toString()) : 500;
		// Update query object with parsed numbers
		const parsedQuery = { ...query, lat: latNum, lng: lngNum, radius: radNum };
		const result = await this.gtfsService.getNearbyStops(parsedQuery);
		return {
			stops: result.stops,
			count: result.count,
			query: { lat: latNum, lng: lngNum, radius: radNum },
		};
	}

	@Get('stops/search')
	@ApiOperation({
		summary: 'Search stops by name',
		description: 'Full-text search on stop names and codes',
	})
	@ApiQuery({ name: 'q', description: 'Search term', example: 'Central' })
	@ApiQuery({ name: 'limit', required: false, description: 'Max results', example: 20 })
	@ApiResponse({ status: 200, description: 'Matching stops', type: [StopResponseDto] })
	async searchStops(
		@Query('q') searchTerm: string,
		@Query('limit') limit?: number,
	): Promise<StopResponseDto[]> {
		const limitNum = limit ? parseInt(limit.toString(), 10) : 20;
		return this.gtfsService.searchStops(searchTerm, limitNum);
	}

	@Get('stops/:stopId')
	@ApiOperation({ summary: 'Get stop by ID' })
	@ApiParam({ name: 'stopId', description: 'Stop identifier', example: 'STOP-001' })
	@ApiResponse({ status: 200, description: 'Stop details', type: StopResponseDto })
	@ApiResponse({ status: 404, description: 'Stop not found' })
	async getStop(@Param('stopId') stopId: string): Promise<StopResponseDto> {
		return this.gtfsService.getStop(stopId);
	}

	@Post('stops')
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create a new stop' })
	@ApiResponse({ status: 201, description: 'Stop created', type: StopResponseDto })
	async createStop(@Body() dto: CreateStopDto): Promise<StopResponseDto> {
		return this.gtfsService.createStop(dto);
	}

	// ============================================================================
	// Route Endpoints
	// ============================================================================

	@Get('routes')
	@ApiOperation({
		summary: 'List all routes',
		description: 'Returns all transit routes with optional filtering',
	})
	@ApiResponse({ status: 200, description: 'List of routes', type: RoutesListResponseDto })
	async getRoutes(@Query() query: RoutesQueryDto): Promise<RoutesListResponseDto> {
		const result = await this.gtfsService.getRoutes(query);
		return {
			routes: result.routes,
			count: result.count,
		};
	}

	@Get('routes/:routeId')
	@ApiOperation({ summary: 'Get route by ID' })
	@ApiParam({ name: 'routeId', description: 'Route identifier', example: 'RT-101' })
	@ApiResponse({ status: 200, description: 'Route details', type: RouteResponseDto })
	@ApiResponse({ status: 404, description: 'Route not found' })
	async getRoute(@Param('routeId') routeId: string): Promise<RouteResponseDto> {
		return this.gtfsService.getRoute(routeId);
	}

	@Post('routes')
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create a new route' })
	@ApiResponse({ status: 201, description: 'Route created', type: RouteResponseDto })
	async createRoute(@Body() dto: CreateRouteDto): Promise<RouteResponseDto> {
		return this.gtfsService.createRoute(dto);
	}

	// ============================================================================
	// Trip Endpoints
	// ============================================================================

	@Get('trips')
	@ApiOperation({
		summary: 'List trips',
		description: 'Returns trips with optional filtering by route, date, and availability',
	})
	@ApiResponse({ status: 200, description: 'List of trips', type: TripsListResponseDto })
	async getTrips(@Query() query: TripsQueryDto): Promise<TripsListResponseDto> {
		const result = await this.gtfsService.getTrips(query);
		return {
			trips: result.trips,
			count: result.count,
			filters: query,
		};
	}

	@Get('trips/:tripId')
	@ApiOperation({ summary: 'Get trip by ID with stop times' })
	@ApiParam({ name: 'tripId', description: 'Trip identifier', example: 'TRIP-101-0900' })
	@ApiResponse({ status: 200, description: 'Trip with stop times', type: TripWithStopsResponseDto })
	@ApiResponse({ status: 404, description: 'Trip not found' })
	async getTrip(@Param('tripId') tripId: string): Promise<TripWithStopsResponseDto> {
		const trip = await this.gtfsService.getTrip(tripId);
		return {
			...trip,
			stopTimes: trip.stopTimes?.map((st) => ({
				stopId: st.stopId,
				stopName: st.stop?.stopName,
				arrivalTime: st.arrivalTime,
				departureTime: st.departureTime,
				stopSequence: st.stopSequence,
			})),
		};
	}

	@Post('trips')
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create a new trip' })
	@ApiResponse({ status: 201, description: 'Trip created', type: TripResponseDto })
	async createTrip(@Body() dto: CreateTripDto): Promise<TripResponseDto> {
		return this.gtfsService.createTrip(dto);
	}

	// ============================================================================
	// Schedule Endpoints
	// ============================================================================

	@Get('schedules')
	@ApiOperation({
		summary: 'Get schedule for a stop',
		description: 'Returns upcoming departures from a stop with real-time delay information',
	})
	@ApiResponse({ status: 200, description: 'Stop schedule', type: ScheduleResponseDto })
	async getSchedule(@Query() query: ScheduleQueryDto): Promise<ScheduleResponseDto> {
		return this.gtfsService.getSchedule(query);
	}

	// ============================================================================
	// Availability Endpoints
	// ============================================================================

	@Get('availability')
	@ApiOperation({
		summary: 'Check seat availability',
		description: 'Checks segment-based availability for a journey from origin to destination',
	})
	@ApiResponse({ status: 200, description: 'Availability details', type: AvailabilityResponseDto })
	@ApiResponse({ status: 404, description: 'Trip or stops not found' })
	async checkAvailability(@Query() query: AvailabilityQueryDto): Promise<AvailabilityResponseDto> {
		return this.gtfsService.checkAvailability(query);
	}

	// ============================================================================
	// Sync Endpoints
	// ============================================================================

	@Get('sync')
	@ApiOperation({
		summary: 'Sync GTFS data',
		description: 'Returns delta or snapshot of transit data for offline sync. Client sends current version to receive updates.',
	})
	@ApiResponse({ status: 200, description: 'Sync data', type: SyncResponseDto })
	async syncData(@Query() query: SyncQueryDto): Promise<SyncResponseDto> {
		return this.gtfsService.getSyncData(query);
	}
}
