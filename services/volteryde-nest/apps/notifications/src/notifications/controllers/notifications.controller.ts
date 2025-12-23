import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationDto, NotificationPreferencesDto, NotificationsResponseDto } from '../dto/notification.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {

	@Get()
	@ApiOperation({ summary: 'Get user notifications' })
	@ApiQuery({ name: 'page', required: false })
	@ApiQuery({ name: 'limit', required: false })
	@ApiQuery({ name: 'unread_only', required: false })
	@ApiResponse({ status: 200, type: NotificationsResponseDto })
	async getNotifications(
		@Query('page') page: number = 1,
		@Query('limit') limit: number = 10,
		@Query('unread_only') unreadOnly: boolean = false
	): Promise<NotificationsResponseDto> {
		return {
			data: [
				{ id: '1', title: 'Welcome', message: 'Welcome to Volteryde!', read: false, createdAt: new Date().toISOString() }
			],
			unread_count: 1,
			total: 1
		};
	}

	@Put(':id/read')
	@ApiOperation({ summary: 'Mark notification as read' })
	@ApiResponse({ status: 200, schema: { example: { read: true } } })
	async markAsRead(@Param('id') id: string): Promise<{ read: boolean }> {
		return { read: true };
	}

	@Post('preferences')
	@ApiOperation({ summary: 'Update notification preferences' })
	@ApiResponse({ status: 200, schema: { example: { updated: true } } })
	async updatePreferences(@Body() dto: NotificationPreferencesDto): Promise<{ updated: boolean }> {
		return { updated: true };
	}
}
