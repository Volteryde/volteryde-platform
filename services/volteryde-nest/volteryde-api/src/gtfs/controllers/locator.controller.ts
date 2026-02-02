// ============================================================================
// Locator Controller
// ============================================================================
// REST API endpoints for bus stop snapping and location services
// Implements the Locator Service interface for Client-App

import {
	Controller,
	Get,
	Post,
	Query,
	Body,
	HttpCode,
	HttpStatus,
	Logger,
	BadRequestException,
	NotFoundException,
} from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiBody,
} from '@nestjs/swagger';
import {
	MapboxLocatorService,
	MapboxMatchmakerService,
	ServiceVoidError,
	SnapResult,
	StopPairResult,
} from '../../../../libs/shared/src/mapbox';

/**
 * DTO for snap request
 */
class SnapRequestDto {
	lat: number;
	lng: number;
	radius?: number;
}

/**
 * DTO for service area check
 */
class ServiceAreaCheckDto {
	lat: number;
	lng: number;
	radius?: number;
}

/**
 * DTO for optimal stop pair request
 */
class OptimalStopPairRequestDto {
	originLat: number;
	originLng: number;
	destinationLat: number;
	destinationLng: number;
	pickupCandidateCount?: number;
	dropoffCandidateCount?: number;
}

/**
 * Response wrapper for API responses
 */
interface ApiResponseWrapper<T> {
	success: boolean;
	data?: T;
	error?: string;
	timestamp: string;
}

@ApiTags('Locator')
@Controller('locator')
export class LocatorController {
	private readonly logger = new Logger(LocatorController.name);

	constructor(
		private readonly locatorService: MapboxLocatorService,
		private readonly matchmakerService: MapboxMatchmakerService,
	) { }

	/**
	 * Snap user GPS to nearest bus stop
	 * 
	 * This is the primary endpoint for the bus-stop-to-bus-stop model.
	 * Every passenger action should call this before any ride request.
	 */
	@Get('snap')
	@ApiOperation({
		summary: 'Snap GPS coordinates to nearest bus stop',
		description:
			'Snaps user GPS to the nearest active bus stop within the specified radius. ' +
			'Returns a ServiceVoidError if no stops are found nearby.',
	})
	@ApiQuery({ name: 'lat', type: Number, description: 'Latitude' })
	@ApiQuery({ name: 'lng', type: Number, description: 'Longitude' })
	@ApiQuery({
		name: 'radius',
		type: Number,
		required: false,
		description: 'Search radius in meters (default: 500, max: 1500)',
	})
	@ApiResponse({
		status: 200,
		description: 'Successfully snapped to nearest stop',
	})
	@ApiResponse({
		status: 404,
		description: 'No stops found within radius (Service Void)',
	})
	async snapToNearestStop(
		@Query('lat') lat: string,
		@Query('lng') lng: string,
		@Query('radius') radius?: string,
	): Promise<ApiResponseWrapper<SnapResult>> {
		const latitude = parseFloat(lat);
		const longitude = parseFloat(lng);
		const radiusMeters = radius ? parseInt(radius, 10) : undefined;

		if (isNaN(latitude) || isNaN(longitude)) {
			throw new BadRequestException('Invalid coordinates');
		}

		if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
			throw new BadRequestException('Coordinates out of range');
		}

		try {
			const result = await this.locatorService.snapToNearestStop(
				{ latitude, longitude },
				radiusMeters,
			);

			return {
				success: true,
				data: result,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			if (error instanceof ServiceVoidError) {
				throw new NotFoundException({
					success: false,
					error: 'SERVICE_VOID',
					message: error.message,
					searchLocation: { lat: latitude, lng: longitude },
					searchRadius: radiusMeters || 500,
					timestamp: new Date().toISOString(),
				});
			}
			throw error;
		}
	}

	/**
	 * Get multiple candidate stops near a location
	 */
	@Get('candidates')
	@ApiOperation({
		summary: 'Get candidate stops near a location',
		description: 'Returns multiple candidate stops sorted by walking distance.',
	})
	@ApiQuery({ name: 'lat', type: Number, description: 'Latitude' })
	@ApiQuery({ name: 'lng', type: Number, description: 'Longitude' })
	@ApiQuery({
		name: 'radius',
		type: Number,
		required: false,
		description: 'Search radius in meters',
	})
	@ApiQuery({
		name: 'limit',
		type: Number,
		required: false,
		description: 'Maximum number of candidates (default: 5)',
	})
	@ApiResponse({ status: 200, description: 'List of candidate stops' })
	async getCandidateStops(
		@Query('lat') lat: string,
		@Query('lng') lng: string,
		@Query('radius') radius?: string,
		@Query('limit') limit?: string,
	): Promise<ApiResponseWrapper<SnapResult[]>> {
		const latitude = parseFloat(lat);
		const longitude = parseFloat(lng);
		const radiusMeters = radius ? parseInt(radius, 10) : undefined;
		const candidateLimit = limit ? parseInt(limit, 10) : 5;

		if (isNaN(latitude) || isNaN(longitude)) {
			throw new BadRequestException('Invalid coordinates');
		}

		const candidates = await this.locatorService.getCandidateStops(
			{ latitude, longitude },
			radiusMeters,
			candidateLimit,
		);

		return {
			success: true,
			data: candidates,
			timestamp: new Date().toISOString(),
		};
	}

	/**
	 * Check if location is within service area
	 */
	@Get('service-area')
	@ApiOperation({
		summary: 'Check if location is within service area',
		description: 'Quick check to determine if there are any bus stops nearby.',
	})
	@ApiQuery({ name: 'lat', type: Number, description: 'Latitude' })
	@ApiQuery({ name: 'lng', type: Number, description: 'Longitude' })
	@ApiQuery({
		name: 'radius',
		type: Number,
		required: false,
		description: 'Search radius in meters',
	})
	@ApiResponse({
		status: 200,
		description: 'Service area status',
	})
	async checkServiceArea(
		@Query('lat') lat: string,
		@Query('lng') lng: string,
		@Query('radius') radius?: string,
	): Promise<ApiResponseWrapper<{ inServiceArea: boolean }>> {
		const latitude = parseFloat(lat);
		const longitude = parseFloat(lng);
		const radiusMeters = radius ? parseInt(radius, 10) : undefined;

		if (isNaN(latitude) || isNaN(longitude)) {
			throw new BadRequestException('Invalid coordinates');
		}

		const inServiceArea = await this.locatorService.isInServiceArea(
			{ latitude, longitude },
			radiusMeters,
		);

		return {
			success: true,
			data: { inServiceArea },
			timestamp: new Date().toISOString(),
		};
	}

	/**
	 * Find optimal pickup and dropoff stop pair
	 */
	@Post('optimal-stops')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: 'Find optimal pickup and dropoff stop pair',
		description:
			'Given user origin and destination, finds the stop pair that minimizes total trip time.',
	})
	@ApiBody({ type: OptimalStopPairRequestDto })
	@ApiResponse({
		status: 200,
		description: 'Optimal stop pair with fare estimate',
	})
	async findOptimalStopPair(
		@Body() request: OptimalStopPairRequestDto,
	): Promise<ApiResponseWrapper<StopPairResult & { fareEstimate: ReturnType<typeof this.matchmakerService.getFareEstimateForStopPair> }>> {
		const {
			originLat,
			originLng,
			destinationLat,
			destinationLng,
			pickupCandidateCount = 3,
			dropoffCandidateCount = 3,
		} = request;

		// Validate coordinates
		if (
			isNaN(originLat) || isNaN(originLng) ||
			isNaN(destinationLat) || isNaN(destinationLng)
		) {
			throw new BadRequestException('Invalid coordinates');
		}

		try {
			const stopPair = await this.matchmakerService.findOptimalStopPair(
				{ latitude: originLat, longitude: originLng },
				{ latitude: destinationLat, longitude: destinationLng },
				pickupCandidateCount,
				dropoffCandidateCount,
			);

			const fareEstimate = this.matchmakerService.getFareEstimateForStopPair(stopPair);

			return {
				success: true,
				data: {
					...stopPair,
					fareEstimate,
				},
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			if (error.message.includes('No pickup stops') || error.message.includes('No dropoff stops')) {
				throw new NotFoundException({
					success: false,
					error: 'SERVICE_VOID',
					message: error.message,
					timestamp: new Date().toISOString(),
				});
			}
			throw error;
		}
	}

	/**
	 * Get fare estimate between two stops (by stop IDs)
	 */
	@Get('fare-estimate')
	@ApiOperation({
		summary: 'Get fare estimate between two stops',
		description: 'Calculate fare for a trip between specified pickup and dropoff stops.',
	})
	@ApiQuery({ name: 'pickupStopId', type: String, description: 'Pickup stop ID' })
	@ApiQuery({ name: 'dropoffStopId', type: String, description: 'Dropoff stop ID' })
	@ApiResponse({
		status: 200,
		description: 'Fare estimate with breakdown',
	})
	async getFareEstimate(
		@Query('pickupStopId') pickupStopId: string,
		@Query('dropoffStopId') dropoffStopId: string,
	): Promise<ApiResponseWrapper<{ message: string }>> {
		// This endpoint requires database lookup for stop details
		// For now, return a message directing to use optimal-stops endpoint
		return {
			success: false,
			data: {
				message:
					'Use POST /locator/optimal-stops with coordinates to get fare estimates. ' +
					'Direct stop ID lookup requires database integration.',
			},
			timestamp: new Date().toISOString(),
		};
	}
}
