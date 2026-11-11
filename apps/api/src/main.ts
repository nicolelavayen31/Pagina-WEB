import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './config/app.setup';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const { port } = configureApp(app);
  await app.listen(port);
}

bootstrap();
