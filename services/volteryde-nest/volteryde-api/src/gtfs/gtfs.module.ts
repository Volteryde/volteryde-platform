// ============================================================================
// GTFS Module
// ============================================================================
// NestJS module for GTFS transit data management
// Provides stops, routes, trips, schedules, and segment-based inventory

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
	],
	controllers: [GtfsController],
	providers: [GtfsService],
	exports: [GtfsService],
})
export class GtfsModule { }
