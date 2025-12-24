import { Module } from '@nestjs/common';
import { NotificationsController } from './controllers/notifications.controller';

@Module({
	controllers: [NotificationsController],
	providers: [],
})
export class NotificationsModule { }
