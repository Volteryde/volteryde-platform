import { ApiProperty } from '@nestjs/swagger';

export class NotificationPreferencesDto {
	@ApiProperty()
	email_enabled: boolean;

	@ApiProperty()
	sms_enabled: boolean;

	@ApiProperty()
	push_enabled: boolean;
}

export class NotificationDto {
	@ApiProperty()
	id: string;

	@ApiProperty()
	title: string;

	@ApiProperty()
	message: string;

	@ApiProperty()
	read: boolean;

	@ApiProperty()
	createdAt: string;
}

export class NotificationsResponseDto {
	@ApiProperty({ type: [NotificationDto] })
	data: NotificationDto[];

	@ApiProperty()
	unread_count: number;

	@ApiProperty()
	total: number;
}
