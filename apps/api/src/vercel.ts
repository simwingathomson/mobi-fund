import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import serverless from 'serverless-http';
import { AppModule } from './modules/app.module';

let cachedHandler: ReturnType<typeof serverless> | undefined;

async function bootstrap() {
  if (!cachedHandler) {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    cachedHandler = serverless(app.getHttpAdapter().getInstance());
  }

  return cachedHandler;
}

export default async function handler(req: any, res: any) {
  const next = await bootstrap();
  return next(req, res);
}
