// ============================================================================
// Route Entity
// ============================================================================
// GTFS-compliant entity for transit routes
// Reference: https://gtfs.org/schedule/reference/#routestxt

import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	OneToMany,
	JoinColumn,
} from 'typeorm';
import { Agency } from './agency.entity';
import { Trip } from './trip.entity';

export enum RouteType {
	TRAM = 0,           // Tram, Streetcar, Light rail
	SUBWAY = 1,         // Subway, Metro
	RAIL = 2,           // Rail
	BUS = 3,            // Bus
	FERRY = 4,          // Ferry
	CABLE_TRAM = 5,     // Cable tram
	AERIAL_LIFT = 6,    // Aerial lift, Gondola
	FUNICULAR = 7,      // Funicular
	TROLLEYBUS = 11,    // Trolleybus
	MONORAIL = 12,      // Monorail
}

export enum ContinuousPickup {
	CONTINUOUS = 0,     // Continuous stopping pickup
	NO_CONTINUOUS = 1,  // No continuous stopping pickup
	PHONE_AGENCY = 2,   // Must phone agency
	COORDINATE = 3,     // Must coordinate with driver
}

export enum ContinuousDropOff {
	CONTINUOUS = 0,     // Continuous stopping drop-off
	NO_CONTINUOUS = 1,  // No continuous stopping drop-off
	PHONE_AGENCY = 2,   // Must phone agency
	COORDINATE = 3,     // Must coordinate with driver
}

@Entity('gtfs_routes')
export class Route {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ name: 'routeId', unique: true })
	routeId: string; // GTFS route_id

	@Column({ name: 'agencyId', nullable: true })
	agencyId: string; // agency_id (FK)

	@ManyToOne(() => Agency, (agency) => agency.routes, { nullable: true })
	@JoinColumn({ name: 'agencyId', referencedColumnName: 'agencyId' })
	agency: Agency;

	@Column({ name: 'routeShortName', nullable: true })
	routeShortName: string; // route_short_name (e.g., "32", "100X")

	@Column({ name: 'routeLongName' })
	routeLongName: string; // route_long_name (e.g., "Green Line")

	@Column({ name: 'routeDesc', nullable: true, type: 'text' })
	routeDesc: string; // route_desc

	@Column({
		name: 'routeType',
		type: 'int',
		default: 3, // RouteType.BUS
	})
	routeType: number; // route_type

	@Column({ name: 'routeUrl', nullable: true })
	routeUrl: string; // route_url

	@Column({ name: 'routeColor', length: 6, default: '00FF00' })
	routeColor: string; // route_color (hex without #)

	@Column({ name: 'routeTextColor', length: 6, default: 'FFFFFF' })
	routeTextColor: string; // route_text_color

	@Column({ name: 'routeSortOrder', type: 'int', nullable: true })
	routeSortOrder: number; // route_sort_order

	@Column({
		name: 'continuousPickup',
		type: 'int',
		default: 1, // ContinuousPickup.NO_CONTINUOUS
	})
	continuousPickup: number;

	@Column({
		name: 'continuousDropOff',
		type: 'int',
		default: 1, // ContinuousDropOff.NO_CONTINUOUS
	})
	continuousDropOff: number;

	@Column({ name: 'networkId', nullable: true })
	networkId: string; // network_id (for fare products)

	// ============================================================================
	// VolteRyde Extensions
	// ============================================================================

	@Column({ name: 'isActive', default: true })
	isActive: boolean; // Whether route is currently operational

	@Column({ name: 'routeDistanceKm', type: 'decimal', precision: 10, scale: 2, nullable: true })
	routeDistanceKm: number; // Total route distance in kilometers

	@Column({ name: 'estimatedDurationMinutes', type: 'int', nullable: true })
	estimatedDurationMinutes: number; // Estimated end-to-end duration

	@Column({ name: 'baseFare', type: 'decimal', precision: 10, scale: 2, nullable: true })
	baseFare: number; // Base fare for this route

	@Column({ name: 'farePerKm', type: 'decimal', precision: 10, scale: 4, nullable: true })
	farePerKm: number; // Per-kilometer fare component

	@Column({ name: 'routeGeometry', type: 'jsonb', nullable: true })
	routeGeometry: object; // GeoJSON LineString of the route shape

	@OneToMany(() => Trip, (trip) => trip.route)
	trips: Trip[];

	@CreateDateColumn({ name: 'createdAt' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updatedAt' })
	updatedAt: Date;
}
