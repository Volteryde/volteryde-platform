// ============================================================================
// JWT Auth Guard
// ============================================================================
// Validates JWT signature (HS256) and expiry on every protected request.

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header not found');
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    const payload = this.verifyJwt(token);
    request.user = payload;
    return true;
  }

  private verifyJwt(token: string): Record<string, unknown> {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new UnauthorizedException('JWT secret not configured');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid token format');
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Verify HMAC-SHA256 signature using constant-time comparison
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    const expectedBuf = Buffer.from(expected);
    const providedBuf = Buffer.from(signatureB64);
    if (
      expectedBuf.length !== providedBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, providedBuf)
    ) {
      throw new UnauthorizedException('Invalid token signature');
    }

    // Decode payload
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(
        Buffer.from(payloadB64, 'base64url').toString('utf8'),
      );
    } catch {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Verify token has not expired
    const exp = payload['exp'] as number | undefined;
    if (exp !== undefined && Math.floor(Date.now() / 1000) > exp) {
      throw new UnauthorizedException('Token has expired');
    }

    return payload;
  }
}
