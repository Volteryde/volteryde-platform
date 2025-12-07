export interface LocationUpdateDto {
	vehicleId: string;
	latitude: number;
	longitude: number;
	speed?: number;
	heading?: number;
	accuracy?: number;
	timestamp?: Date;
	isMocked?: boolean;
}

export interface DiagnosticsResponseDto {
	vehicleId: string;
	batteryLevel: number; // 0-100
	rangeKm: number;
	speed: number;
	isCharging: boolean;
	temperature: number;
	lastUpdated: Date;
}

export interface BookingDto {
	id: string; // Workflow ID
	passengerId: string;
	passengerName: string;
	pickupLocation: {
		latitude: number;
		longitude: number;
		address: string;
	};
	dropoffLocation: {
		latitude: number;
		longitude: number;
		address: string;
	};
	status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
	fare: number;
	distanceKm: number;
	createdAt: Date;
}

export enum VehicleStatus {
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE',
	IN_MAINTENANCE = 'IN_MAINTENANCE',
	OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export interface UpdateVehicleStatusDto {
	status: VehicleStatus;
}
