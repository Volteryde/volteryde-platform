import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('TransformInterceptor', () => {
	let interceptor: TransformInterceptor<any>;

	beforeEach(() => {
		interceptor = new TransformInterceptor();
	});

	it('should be defined', () => {
		expect(interceptor).toBeDefined();
	});

	it('should wrap response data', (done) => {
		// Mock ExecutionContext
		const mockExecutionContext = {
			switchToHttp: () => ({
				getResponse: () => ({
					statusCode: 200,
				}),
			}),
		} as unknown as ExecutionContext;

		// Mock CallHandler
		const mockCallHandler: CallHandler = {
			handle: () => of('test-data'),
		};

		// Run interceptor
		interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
			next: (response) => {
				expect(response).toHaveProperty('data', 'test-data');
				expect(response).toHaveProperty('timestamp');
				expect(response).toHaveProperty('status', 200);

				// Verify timestamp is valid ISO string
				const timestamp = new Date(response.timestamp);
				expect(timestamp.toISOString()).toBe(response.timestamp);

				done();
			},
			error: (error) => done(error),
		});
	});

	it('should handle objects correctly', (done) => {
		const mockExecutionContext = {
			switchToHttp: () => ({
				getResponse: () => ({
					statusCode: 201,
				}),
			}),
		} as unknown as ExecutionContext;

		const testObj = { id: 1, name: 'Test' };
		const mockCallHandler: CallHandler = {
			handle: () => of(testObj),
		};

		interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
			next: (response) => {
				expect(response.data).toEqual(testObj);
				expect(response.status).toBe(201);
				done();
			},
		});
	});
});
