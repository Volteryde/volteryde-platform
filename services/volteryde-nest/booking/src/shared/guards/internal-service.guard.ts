// ============================================================================
// Internal Service Guard
// ============================================================================
// Validates X-Internal-Service-Key header for internal endpoints
// Used by Temporal workers to call internal APIs

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InternalServiceGuard implements CanActivate {
  private readonly logger = new Logger(InternalServiceGuard.name);

  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const serviceKey = request.headers['x-internal-service-key'];
    const expectedKey = this.configService.get<string>('INTERNAL_SERVICE_KEY');

    if (!expectedKey) {
      this.logger.error('INTERNAL_SERVICE_KEY is not configured in environment');
      throw new UnauthorizedException('Internal service key not configured');
    }

    if (!serviceKey) {
      this.logger.warn(`Missing X-Internal-Service-Key header from ${request.ip}`);
      throw new UnauthorizedException('Missing internal service key');
    }

    if (serviceKey !== expectedKey) {
      this.logger.warn(`Invalid X-Internal-Service-Key from ${request.ip}`);
      throw new UnauthorizedException('Invalid internal service key');
    }

    this.logger.debug(`Internal service request authorized from ${request.ip}`);
    return true;
  }
}
