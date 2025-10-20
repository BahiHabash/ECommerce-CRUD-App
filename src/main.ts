import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  console.log(
    `\x1b[36mNODE_ENV:\x1b[0m \x1b[33m${process.env.NODE_ENV}\x1b[0m`,
  );

  app.enableCors();

  await app.listen(app.get(ConfigService).get('PORT', 5050));
}

bootstrap();
