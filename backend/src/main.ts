import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'https://shop.lolly.sn',
      'https://admin.lolly.sn',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,        // Supprime les champs non déclarés dans le DTO
    forbidNonWhitelisted: false, // Ne bloque pas (compatibilité avec champs extras existants)
    transform: true,        // Convertit automatiquement les types (string -> number, etc.)
  }));

  await app.listen(process.env.PORT ?? 3005);
}
bootstrap();
