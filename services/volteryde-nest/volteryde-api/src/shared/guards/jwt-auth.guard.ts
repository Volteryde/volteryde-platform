// ============================================================================
// JWT Auth Guard
// ============================================================================
// Protects endpoints by validating JWT tokens

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header not found');
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    // In a real application, you would validate the JWT token here.
    // For this example, we'll just check if a token exists.
    if (token) {
      return true;
    }

    throw new UnauthorizedException('Invalid token');
  }
}
