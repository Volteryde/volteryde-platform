import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '../../shared/enums/booking-status.enum';

export class BookingResponseDto {
	@ApiProperty({ description: 'Booking/Workflow ID' })
	workflowId: string;

	@ApiProperty({ enum: BookingStatus, description: 'Current status of the booking' })
	status: BookingStatus;

	@ApiPropertyOptional({ description: 'Booking message' })
	message?: string;

	@ApiPropertyOptional({ description: 'Estimated fare' })
	estimatedFare?: number;

	@ApiPropertyOptional({ description: 'Assigned Vehicle ID' })
	vehicleId?: string;

	@ApiPropertyOptional({ description: 'Estimated time of arrival (minutes)' })
	etaMinutes?: number;
}
