// ============================================================================
// GTFS Module
// ============================================================================
// NestJS module for GTFS transit data management
// Provides stops, routes, trips, schedules, and segment-based inventory
// Now includes Mapbox services for bus-stop-to-bus-stop routing

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
} from './entities';
import { GtfsService } from './services/gtfs.service';
import { GtfsController } from './controllers/gtfs.controller';
import { LocatorController } from './controllers/locator.controller';
import { MapboxModule } from '../../../libs/shared/src/mapbox';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Agency,
			Stop,
			Route,
			Trip,
			StopTime,
			Calendar,
			CalendarDate,
			TripSegment,
			SegmentReservation,
		]),
		// Mapbox services for bus-stop-to-bus-stop routing
		MapboxModule,
	],
	controllers: [GtfsController, LocatorController],
	providers: [GtfsService],
	exports: [GtfsService],
})
export class GtfsModule { }

