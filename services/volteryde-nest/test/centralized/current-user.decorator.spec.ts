import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { CurrentUser } from '../../src/common/decorators/current-user.decorator';
import { APP_GUARD } from '@nestjs/core';

// Mock Guard to simulate authentication
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
class MockAuthGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const req = context.switchToHttp().getRequest();
		req.user = { id: 'user-123', email: 'test@example.com' };
		return true;
	}
}

@Controller('test')
class TestController {
	@Get('user')
	getUser(@CurrentUser() user: any) {
		return user;
	}
}

describe('CurrentUser Decorator', () => {
	let app: INestApplication;

	beforeEach(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			controllers: [TestController],
			providers: [
				{
					provide: APP_GUARD,
					useClass: MockAuthGuard,
				},
			],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	afterEach(async () => {
		await app.close();
	});

	it('should extract user from request', () => {
		return request(app.getHttpServer())
			.get('/test/user')
			.expect(200)
			.expect((res) => {
				expect(res.body).toEqual({
					id: 'user-123',
					email: 'test@example.com',
				});
			});
	});
});
