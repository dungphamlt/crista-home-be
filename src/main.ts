// Load .env TRƯỚC tất cả imports - jwt.constants cần process.env.JWT_SECRET
require("dotenv").config({ path: require("path").join(process.cwd(), ".env") });

import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
    : [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://crista-home.vercel.app",
        "https://crista-home-cms.vercel.app",
        "http://localhost:4200",
        "https://tongkhocristahome.com.vn",
      ];
  app.enableCors({
    origin: corsOrigins,
    allowedHeaders: ["Content-Type", "Authorization"],
  });
  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`Crista Home API running on http://localhost:${port}`);
}
bootstrap();
