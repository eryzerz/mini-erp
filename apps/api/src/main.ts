import { BadRequestException, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => {
        const details = errors.map((error) => ({
          field: error.property,
          messages: Object.values(error.constraints ?? {}),
        }));
        return new BadRequestException({
          error: "VALIDATION_FAILED",
          message: "Request validation failed",
          details,
        });
      },
    }),
  );

  const origins = (config.get<string>("CORS_ORIGIN") ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Mini ERP Invoicing System API")
    .setDescription("REST API for the Mini ERP Invoicing System take-home technical test")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  const port = Number(config.get<string>("PORT") ?? 4000);
  await app.listen(port);
}

void bootstrap();
