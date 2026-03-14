import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

const isProd = process.env.NODE_ENV === 'production';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawMessage =
      exception instanceof HttpException
        ? exception.getResponse()
        : null;

    // In production, never expose internal error details for 5xx responses
    const message = status >= 500 && isProd
      ? 'An unexpected error occurred'
      : typeof rawMessage === 'string'
        ? rawMessage
        : (rawMessage as any)?.message ?? 'An error occurred';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      // Never expose the request path in production — prevents route enumeration via error probing
      ...(isProd ? {} : { path: request.url }),
      message,
    });
  }
}
