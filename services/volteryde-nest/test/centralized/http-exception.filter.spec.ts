import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

describe('HttpExceptionFilter', () => {
	let filter: HttpExceptionFilter;

	beforeEach(() => {
		filter = new HttpExceptionFilter();
	});

	it('should be defined', () => {
		expect(filter).toBeDefined();
	});

	it('should catch HttpException and format response', () => {
		const mockJson = jest.fn();
		const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
		const mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
		const mockGetRequest = jest.fn().mockReturnValue({ url: '/test-url' });

		const mockArgumentsHost = {
			switchToHttp: () => ({
				getResponse: mockGetResponse,
				getRequest: mockGetRequest,
			}),
		} as unknown as ArgumentsHost;

		const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

		filter.catch(exception, mockArgumentsHost);

		expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
		expect(mockJson).toHaveBeenCalledWith({
			statusCode: HttpStatus.FORBIDDEN,
			timestamp: expect.any(String),
			path: '/test-url',
			message: 'Forbidden',
		});
	});

	it('should catch unknown errors and return Internal Server Error', () => {
		const mockJson = jest.fn();
		const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
		const mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
		const mockGetRequest = jest.fn().mockReturnValue({ url: '/error-url' });

		const mockArgumentsHost = {
			switchToHttp: () => ({
				getResponse: mockGetResponse,
				getRequest: mockGetRequest,
			}),
		} as unknown as ArgumentsHost;

		const exception = new Error('Something went wrong');

		filter.catch(exception, mockArgumentsHost);

		expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
		expect(mockJson).toHaveBeenCalledWith({
			statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
			timestamp: expect.any(String),
			path: '/error-url',
			message: 'Internal server error',
		});
	});
});
