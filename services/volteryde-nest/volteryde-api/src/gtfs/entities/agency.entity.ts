// ============================================================================
// Agency Entity
// ============================================================================
// GTFS-compliant entity for transit agencies/operators
// Reference: https://gtfs.org/schedule/reference/#agencytxt

import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn,
	OneToMany,
} from 'typeorm';
import { Route } from './route.entity';

@Entity('gtfs_agencies')
export class Agency {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ name: 'agencyId', unique: true })
	agencyId: string; // GTFS agency_id

	@Column()
	name: string; // agency_name

	@Column()
	url: string; // agency_url

	@Column()
	timezone: string; // agency_timezone (e.g., "Africa/Accra")

	@Column({ nullable: true })
	lang: string; // agency_lang (e.g., "en")

	@Column({ nullable: true })
	phone: string; // agency_phone

	@Column({ name: 'fareUrl', nullable: true })
	fareUrl: string; // agency_fare_url

	@Column({ nullable: true })
	email: string; // agency_email

	@OneToMany(() => Route, (route) => route.agency)
	routes: Route[];

	@CreateDateColumn({ name: 'createdAt' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updatedAt' })
	updatedAt: Date;
}
