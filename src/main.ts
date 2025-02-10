/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import { VersioningType } from '@nestjs/common';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // const app = await NestFactory.create(AppModule);
  app.enableVersioning({ type: VersioningType.URI });
  app.setGlobalPrefix('api');
  app.setViewEngine('hbs');
  app.setBaseViewsDir(path.join(__dirname, '..', 'views'));
  app.useStaticAssets(path.join(__dirname, '..', 'public'));
  await app.listen(3000);
}
bootstrap();
