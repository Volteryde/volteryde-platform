// ============================================================================
// GTFS Service
// ============================================================================
// Business logic for GTFS transit data operations
// Handles stops, routes, trips, schedules, and segment-based availability

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import {
	Agency,
	Stop,
	Route,
	Trip,
	StopTime,
	Calendar,
	CalendarDate,
	TripSegment,
	SegmentReservation,
	ExceptionType,
	ReservationStatus,
} from '../entities';
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

@Injectable()
export class GtfsService {
	private readonly logger = new Logger(GtfsService.name);

	// Current data version for sync
	private dataVersion = 1;

	constructor(
		@InjectRepository(Agency)
		private agencyRepository: Repository<Agency>,
		@InjectRepository(Stop)
		private stopRepository: Repository<Stop>,
		@InjectRepository(Route)
		private routeRepository: Repository<Route>,
		@InjectRepository(Trip)
		private tripRepository: Repository<Trip>,
		@InjectRepository(StopTime)
		private stopTimeRepository: Repository<StopTime>,
		@InjectRepository(Calendar)
		private calendarRepository: Repository<Calendar>,
		@InjectRepository(CalendarDate)
		private calendarDateRepository: Repository<CalendarDate>,
		@InjectRepository(TripSegment)
		private tripSegmentRepository: Repository<TripSegment>,
		@InjectRepository(SegmentReservation)
		private segmentReservationRepository: Repository<SegmentReservation>,
		private dataSource: DataSource,
	) { }

	// ============================================================================
	// Agency Operations
	// ============================================================================

	async createAgency(data: Partial<Agency>): Promise<Agency> {
		const agency = this.agencyRepository.create(data);
		return this.agencyRepository.save(agency);
	}

	async getAgencies(): Promise<Agency[]> {
		return this.agencyRepository.find();
	}

	// ============================================================================
	// Stop Operations
	// ============================================================================

	async createStop(dto: CreateStopDto): Promise<Stop> {
		const stop = this.stopRepository.create(dto);
		const saved = await this.stopRepository.save(stop);

		// Update geometry column using PostGIS
		await this.updateStopGeometry(saved.stopId, dto.stopLat, dto.stopLon);

		this.incrementDataVersion();
		return saved;
	}

	async getStop(stopId: string): Promise<Stop> {
		const stop = await this.stopRepository.findOne({ where: { stopId } });
		if (!stop) {
			throw new NotFoundException(`Stop ${stopId} not found`);
		}
		return stop;
	}

	async getNearbyStops(query: NearbyStopsQueryDto): Promise<{ stops: Stop[]; count: number }> {
		const { lat, lng, radius = 500, limit = 10, chargingOnly, locationType } = query;

		// Use PostGIS for efficient spatial query
		const queryBuilder = this.stopRepository
			.createQueryBuilder('stop')
			.addSelect(
				`ST_Distance(stop.geom::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)`,
				'distance',
			)
			.where(
				`ST_DWithin(stop.geom::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)`,
			)
			.setParameters({ lat, lng, radius })
			.orderBy('distance', 'ASC')
			.limit(limit);

		if (chargingOnly) {
			queryBuilder.andWhere('stop.isChargingStation = true');
		}

		if (locationType !== undefined) {
			queryBuilder.andWhere('stop.locationType = :locationType', { locationType });
		}

		const stops = await queryBuilder.getRawAndEntities();

		// Add distance to each stop
		const stopsWithDistance = stops.entities.map((stop, index) => ({
			...stop,
			distance: parseFloat(stops.raw[index]?.distance || '0'),
		}));

		return {
			stops: stopsWithDistance,
			count: stopsWithDistance.length,
		};
	}

	async searchStops(searchTerm: string, limit: number = 20): Promise<Stop[]> {
		return this.stopRepository
			.createQueryBuilder('stop')
			.where('LOWER(stop.stopName) LIKE LOWER(:term)', { term: `%${searchTerm}%` })
			.orWhere('LOWER(stop.stopCode) LIKE LOWER(:term)', { term: `%${searchTerm}%` })
			.orderBy('stop.stopName', 'ASC')
			.limit(limit)
			.getMany();
	}

	private async updateStopGeometry(stopId: string, lat: number, lon: number): Promise<void> {
		await this.dataSource.query(
			`UPDATE gtfs_stops SET geom = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE "stopId" = $3`,
			[lon, lat, stopId],
		);
	}

	// ============================================================================
	// Route Operations
	// ============================================================================

	async createRoute(dto: CreateRouteDto): Promise<Route> {
		const route = this.routeRepository.create(dto);
		const saved = await this.routeRepository.save(route);
		this.incrementDataVersion();
		return saved;
	}

	async getRoute(routeId: string): Promise<Route> {
		const route = await this.routeRepository.findOne({
			where: { routeId },
			relations: ['agency'],
		});
		if (!route) {
			throw new NotFoundException(`Route ${routeId} not found`);
		}
		return route;
	}

	async getRoutes(query: RoutesQueryDto): Promise<{ routes: Route[]; count: number }> {
		const { agencyId, routeType, activeOnly = true } = query;

		const queryBuilder = this.routeRepository.createQueryBuilder('route');

		if (agencyId) {
			queryBuilder.andWhere('route.agencyId = :agencyId', { agencyId });
		}

		if (routeType !== undefined) {
			queryBuilder.andWhere('route.routeType = :routeType', { routeType });
		}

		if (activeOnly) {
			queryBuilder.andWhere('route.isActive = true');
		}

		queryBuilder.orderBy('route.routeSortOrder', 'ASC');

		const [routes, count] = await queryBuilder.getManyAndCount();
		return { routes, count };
	}

	// ============================================================================
	// Trip Operations
	// ============================================================================

	async createTrip(dto: CreateTripDto): Promise<Trip> {
		const trip = this.tripRepository.create({
			...dto,
			availableSeats: dto.capacity || 0,
		});
		const saved = await this.tripRepository.save(trip);
		this.incrementDataVersion();
		return saved;
	}

	async getTrip(tripId: string): Promise<Trip> {
		const trip = await this.tripRepository.findOne({
			where: { tripId },
			relations: ['route', 'stopTimes', 'stopTimes.stop'],
		});
		if (!trip) {
			throw new NotFoundException(`Trip ${tripId} not found`);
		}
		return trip;
	}

	async getTrips(query: TripsQueryDto): Promise<{ trips: Trip[]; count: number }> {
		const { routeId, date, stopId, availableOnly, afterTime } = query;

		const queryBuilder = this.tripRepository
			.createQueryBuilder('trip')
			.leftJoinAndSelect('trip.route', 'route')
			.where('trip.isActive = true');

		if (routeId) {
			queryBuilder.andWhere('trip.routeId = :routeId', { routeId });
		}

		if (date) {
			// Check if trip runs on this date via calendar/calendar_dates
			const serviceIds = await this.getActiveServicesForDate(new Date(date));
			if (serviceIds.length > 0) {
				queryBuilder.andWhere('trip.serviceId IN (:...serviceIds)', { serviceIds });
			}
		}

		if (stopId) {
			queryBuilder
				.innerJoin('trip.stopTimes', 'st')
				.andWhere('st.stopId = :stopId', { stopId });
		}

		if (availableOnly) {
			queryBuilder.andWhere('trip.availableSeats > 0');
		}

		const [trips, count] = await queryBuilder.getManyAndCount();
		return { trips, count };
	}

	// ============================================================================
	// Schedule Operations
	// ============================================================================

	async getSchedule(query: ScheduleQueryDto): Promise<{
		stopId: string;
		stopName: string;
		date: string;
		departures: any[];
		count: number;
	}> {
		const { stopId, routeId, date, startTime, endTime, limit = 10 } = query;

		const stop = await this.getStop(stopId);
		const queryDate = date ? new Date(date) : new Date();

		// Get active services for the date
		const activeServices = await this.getActiveServicesForDate(queryDate);

		const queryBuilder = this.stopTimeRepository
			.createQueryBuilder('st')
			.leftJoinAndSelect('st.trip', 'trip')
			.leftJoinAndSelect('trip.route', 'route')
			.where('st.stopId = :stopId', { stopId })
			.andWhere('trip.isActive = true');

		if (activeServices.length > 0) {
			queryBuilder.andWhere('trip.serviceId IN (:...serviceIds)', { serviceIds: activeServices });
		}

		if (routeId) {
			queryBuilder.andWhere('trip.routeId = :routeId', { routeId });
		}

		if (startTime) {
			queryBuilder.andWhere('st.departureTime >= :startTime', { startTime });
		}

		if (endTime) {
			queryBuilder.andWhere('st.departureTime <= :endTime', { endTime });
		}

		queryBuilder.orderBy('st.departureTime', 'ASC').limit(limit);

		const stopTimes = await queryBuilder.getMany();

		const departures = stopTimes.map((st) => ({
			tripId: st.tripId,
			routeId: st.trip?.routeId,
			routeShortName: st.trip?.route?.routeShortName,
			headsign: st.trip?.tripHeadsign || st.stopHeadsign,
			arrivalTime: st.arrivalTime,
			departureTime: st.departureTime,
			availableSeats: st.trip?.availableSeats || 0,
			delaySeconds: st.trip?.delaySeconds || 0,
			routeColor: st.trip?.route?.routeColor || '00FF00',
		}));

		return {
			stopId,
			stopName: stop.stopName,
			date: queryDate.toISOString().split('T')[0],
			departures,
			count: departures.length,
		};
	}

	// ============================================================================
	// Availability & Segment Operations
	// ============================================================================

	async checkAvailability(query: AvailabilityQueryDto): Promise<{
		tripId: string;
		fromStopId: string;
		toStopId: string;
		isAvailable: boolean;
		minAvailableSeats: number;
		totalFare: number;
		totalDistanceKm: number;
		segments: any[];
	}> {
		const { tripId, fromStopId, toStopId, seatCount = 1 } = query;

		// Get stop sequences for the from and to stops
		const fromStopTime = await this.stopTimeRepository.findOne({
			where: { tripId, stopId: fromStopId },
		});
		const toStopTime = await this.stopTimeRepository.findOne({
			where: { tripId, stopId: toStopId },
		});

		if (!fromStopTime || !toStopTime) {
			throw new NotFoundException('One or both stops not found on this trip');
		}

		if (fromStopTime.stopSequence >= toStopTime.stopSequence) {
			throw new NotFoundException('From stop must come before to stop on this trip');
		}

		// Get all segments between from and to
		const segments = await this.tripSegmentRepository
			.createQueryBuilder('seg')
			.leftJoinAndSelect('seg.fromStop', 'fromStop')
			.leftJoinAndSelect('seg.toStop', 'toStop')
			.where('seg.tripId = :tripId', { tripId })
			.andWhere('seg.sequence >= :fromSeq', { fromSeq: fromStopTime.stopSequence })
			.andWhere('seg.sequence < :toSeq', { toSeq: toStopTime.stopSequence })
			.orderBy('seg.sequence', 'ASC')
			.getMany();

		// Calculate minimum available seats across all segments
		const minAvailableSeats = Math.min(...segments.map((s) => s.capacity - s.reservedSeats));
		const isAvailable = minAvailableSeats >= seatCount;
		const totalDistanceKm = segments.reduce((sum, s) => sum + (parseFloat(String(s.distanceKm)) || 0), 0);
		const totalFare = segments.reduce((sum, s) => sum + (parseFloat(String(s.segmentFare)) || 0), 0);

		return {
			tripId,
			fromStopId,
			toStopId,
			isAvailable,
			minAvailableSeats,
			totalFare,
			totalDistanceKm,
			segments: segments.map((s) => ({
				fromStopId: s.fromStopId,
				fromStopName: s.fromStop?.stopName,
				toStopId: s.toStopId,
				toStopName: s.toStop?.stopName,
				availableSeats: s.capacity - s.reservedSeats,
				distanceKm: s.distanceKm,
				segmentFare: s.segmentFare,
			})),
		};
	}

	async reserveSegments(
		tripId: string,
		fromStopId: string,
		toStopId: string,
		bookingId: string,
		userId: string,
		seatCount: number = 1,
	): Promise<SegmentReservation[]> {
		return this.dataSource.transaction(async (manager) => {
			// Get segments with pessimistic lock
			const fromSeq = await manager.findOne(StopTime, {
				where: { tripId, stopId: fromStopId },
			});
			const toSeq = await manager.findOne(StopTime, {
				where: { tripId, stopId: toStopId },
			});

			if (!fromSeq || !toSeq) {
				throw new NotFoundException('Stops not found on trip');
			}

			const segments = await manager
				.createQueryBuilder(TripSegment, 'seg')
				.setLock('pessimistic_write')
				.where('seg.tripId = :tripId', { tripId })
				.andWhere('seg.sequence >= :fromSeq', { fromSeq: fromSeq.stopSequence })
				.andWhere('seg.sequence < :toSeq', { toSeq: toSeq.stopSequence })
				.getMany();

			// Verify availability
			for (const seg of segments) {
				if (seg.capacity - seg.reservedSeats < seatCount) {
					throw new Error(`Insufficient seats on segment ${seg.fromStopId} -> ${seg.toStopId}`);
				}
			}

			// Create reservations and update segment counts
			const reservations: SegmentReservation[] = [];
			const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minute expiry

			for (const seg of segments) {
				// Update reserved count
				seg.reservedSeats += seatCount;
				await manager.save(seg);

				// Create reservation
				const reservation = manager.create(SegmentReservation, {
					segmentId: seg.id,
					bookingId,
					userId,
					seatCount,
					status: ReservationStatus.PENDING,
					expiresAt,
				});
				reservations.push(await manager.save(reservation));
			}

			return reservations;
		});
	}

	// ============================================================================
	// Sync Operations
	// ============================================================================

	async getSyncData(query: SyncQueryDto): Promise<{
		version: number;
		type: 'snapshot' | 'delta';
		changes?: any;
		data?: any;
		generatedAt: string;
	}> {
		const { version } = query;
		const currentVersion = this.dataVersion;

		// If client is too far behind or first sync, send full snapshot
		if (version === 0 || currentVersion - version > 10) {
			const [stops, routes, calendar] = await Promise.all([
				this.stopRepository.find(),
				this.routeRepository.find({ where: { isActive: true } }),
				this.calendarRepository.find({ where: { isActive: true } }),
			]);

			return {
				version: currentVersion,
				type: 'snapshot',
				data: {
					stops: stops.map((s) => this.serializeStop(s)),
					routes: routes.map((r) => this.serializeRoute(r)),
					calendar: calendar.map((c) => this.serializeCalendar(c)),
				},
				generatedAt: new Date().toISOString(),
			};
		}

		// For delta sync, we would track changes in a changelog table
		// For now, return empty delta
		return {
			version: currentVersion,
			type: 'delta',
			changes: {
				stops: { update: [], delete: [] },
				routes: { update: [], delete: [] },
				calendar: { update: [], delete: [] },
			},
			generatedAt: new Date().toISOString(),
		};
	}

	// ============================================================================
	// Helper Methods
	// ============================================================================

	private async getActiveServicesForDate(date: Date): Promise<string[]> {
		const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
			date.getDay()
		];

		// Get base services from calendar
		const calendars = await this.calendarRepository
			.createQueryBuilder('cal')
			.where(`cal.${dayOfWeek} = true`)
			.andWhere('cal.startDate <= :date', { date })
			.andWhere('cal.endDate >= :date', { date })
			.andWhere('cal.isActive = true')
			.getMany();

		const serviceIds = calendars.map((c) => c.serviceId);

		// Apply exceptions from calendar_dates
		const exceptions = await this.calendarDateRepository.find({
			where: { date },
		});

		for (const ex of exceptions) {
			if (ex.exceptionType === ExceptionType.SERVICE_ADDED) {
				if (!serviceIds.includes(ex.serviceId)) {
					serviceIds.push(ex.serviceId);
				}
			} else if (ex.exceptionType === ExceptionType.SERVICE_REMOVED) {
				const index = serviceIds.indexOf(ex.serviceId);
				if (index > -1) {
					serviceIds.splice(index, 1);
				}
			}
		}

		return serviceIds;
	}

	private incrementDataVersion(): void {
		this.dataVersion++;
		this.logger.log(`Data version incremented to ${this.dataVersion}`);
	}

	private serializeStop(stop: Stop): object {
		return {
			stopId: stop.stopId,
			stopCode: stop.stopCode,
			stopName: stop.stopName,
			stopLat: stop.stopLat,
			stopLon: stop.stopLon,
			zoneId: stop.zoneId,
			locationType: stop.locationType,
			isChargingStation: stop.isChargingStation,
		};
	}

	private serializeRoute(route: Route): object {
		return {
			routeId: route.routeId,
			routeShortName: route.routeShortName,
			routeLongName: route.routeLongName,
			routeType: route.routeType,
			routeColor: route.routeColor,
			baseFare: route.baseFare,
			farePerKm: route.farePerKm,
		};
	}

	private serializeCalendar(cal: Calendar): object {
		return {
			serviceId: cal.serviceId,
			serviceName: cal.serviceName,
			monday: cal.monday,
			tuesday: cal.tuesday,
			wednesday: cal.wednesday,
			thursday: cal.thursday,
			friday: cal.friday,
			saturday: cal.saturday,
			sunday: cal.sunday,
			startDate: cal.startDate,
			endDate: cal.endDate,
		};
	}
}
