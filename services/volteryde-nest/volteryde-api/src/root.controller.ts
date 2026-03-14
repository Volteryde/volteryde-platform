import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@ApiExcludeController()
@Controller()
export class RootController {
  @SkipThrottle()
  @Get()
  getRoot() {
    return {
      name: 'Volteryde API',
      status: 'operational',
      timestamp: new Date().toISOString(),
      // Docs only linked in non-production; in prod this field is omitted
      ...(process.env.NODE_ENV !== 'production' && {
        docs: '/api/docs',
      }),
    };
  }
}
