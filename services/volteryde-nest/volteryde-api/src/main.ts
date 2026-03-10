import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Never leak stack traces in logs to stdout in production
    logger: process.env.NODE_ENV === 'production'
      ? ['error', 'warn']
      : ['log', 'debug', 'error', 'warn', 'verbose'],
  });

  // ── Security headers (helmet) ─────────────────────────────────────────────
  // Removes X-Powered-By, sets CSP, HSTS, X-Frame-Options, X-XSS-Protection, etc.
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        // Allow Swagger UI inline styles/scripts only in non-production
        ...(process.env.NODE_ENV !== 'production' && {
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
        }),
      },
    },
    // Strict HSTS in production (2 years)
    strictTransportSecurity: process.env.NODE_ENV === 'production'
      ? { maxAge: 63072000, includeSubDomains: true, preload: true }
      : false,
  }));

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      /^(http:\/\/localhost:[0-9]+)$/,
      /^(http:\/\/127\.0\.0\.1:[0-9]+)$/,
      /^(http:\/\/10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}:[0-9]+)$/,
      /^(http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]{1,3}\.[0-9]{1,3}:[0-9]+)$/,
      /^(http:\/\/192\.168\.[0-9]{1,3}\.[0-9]{1,3}:[0-9]+)$/,
      /^(https:\/\/.*\.volteryde\.org)$/,
      'https://volteryde.org',
    ],
    credentials: true,
  });

  // ── Validation ────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // strip unknown fields
      forbidNonWhitelisted: true, // reject requests with unknown fields
      transform: true,
    }),
  );

  // ── Global interceptors / filters ─────────────────────────────────────────
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── Global prefix — '/' excluded so RootController stays at GET / ─────────
  app.setGlobalPrefix('api/v1', { exclude: ['/'] });

  // ── Swagger — only available outside production ───────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Volteryde API')
      .setDescription('Telematics · Booking · Fleet · Charging · Payments')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Volteryde API running on port ${port}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Swagger docs → http://localhost:${port}/api/docs`);
  }
}

bootstrap();
