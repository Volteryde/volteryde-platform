import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files from the public directory
  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/',
  });

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      /^(http:\/\/localhost:[0-9]+)$/,
      /^(https:\/\/.*\.volteryde\.org)$/,
      'https://volteryde.org'
    ],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global response formatting
  app.useGlobalInterceptors(new TransformInterceptor());

  // Global error handling
  app.useGlobalFilters(new HttpExceptionFilter());

  // API prefix - exclude root controller
  app.setGlobalPrefix('api/v1', {
    exclude: ['/'],
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Volteryde NestJS API')
    .setDescription('Telematics, Booking, Fleet Operations, Charging APIs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Volteryde NestJS service running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
