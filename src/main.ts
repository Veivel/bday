import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove non-decorated props
      forbidNonWhitelisted: true, // throw if non-decorated props are present
      transform: true, // auto-convert payloads to DTO instances
    }),
  );

  await app.listen(3000);
}
bootstrap();
