// Load .env TRƯỚC tất cả imports - jwt.constants cần process.env.JWT_SECRET
require('dotenv').config({ path: require('path').join(process.cwd(), '.env') });

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });
  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`Crista Home API running on http://localhost:${port}`);
}
bootstrap();
