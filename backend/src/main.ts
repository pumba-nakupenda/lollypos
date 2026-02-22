import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (origin, callback) => {
      // Allow if no origin (like mobile apps or curl) or if it's from our domains
      const allowedOrigins = [
        'https://shop.lolly.sn',
        'https://admin.lolly.sn',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
      ];

      const isVercel = origin && (origin.endsWith('.vercel.app') || origin.includes('vercel.app'));
      const isLolly = origin && (origin.includes('lolly.sn'));

      if (!origin || allowedOrigins.includes(origin) || isVercel || isLolly) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,        // Supprime les champs non déclarés dans le DTO
    forbidNonWhitelisted: true,
    transform: true,        // Convertit automatiquement les types (string -> number, etc.)
  }));

  await app.listen(process.env.PORT ?? 3005, '0.0.0.0');
}
bootstrap();
