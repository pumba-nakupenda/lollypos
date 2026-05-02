import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());

  const defaultOrigins = [
    'https://shop.lolly.sn',
    'https://admin.lolly.sn',
    ...(process.env.NODE_ENV !== 'production'
      ? [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
        ]
      : []),
  ];

  const envOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];

  const allowedOrigins = [...defaultOrigins, ...envOrigins];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Supprime les champs non déclarés dans le DTO
      forbidNonWhitelisted: true,
      transform: true, // Convertit automatiquement les types (string -> number, etc.)
    }),
  );

  await app.listen(process.env.PORT ?? 3005, '0.0.0.0');
}
void bootstrap();
