import {
  Logger,
  RequestMethod,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('API-GATEWAY');
  const port = process.env.port ?? 3000;
  const app = await NestFactory.create(AppModule);

  app.enableVersioning({ type: VersioningType.URI });
  app.setGlobalPrefix('api', {
    exclude: [
      {
        path: '/',
        method: RequestMethod.GET,
      },
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: ['*'],
    allowedHeaders: [
      'Access-Control-Allow-Origin',
      'Origin',
      'X-Requested-With',
      'Accept',
      'Content-Type',
      'Authorization',
    ],
    exposedHeaders: 'Authorization',
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'OPTIONS', 'POST', 'PATCH', 'DELETE'],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Gateway')
    .setDescription(
      'Central API Gateway for the Orders Monorepo - routes REST to microservices via NATS.',
    )
    .setVersion('1.0')
    .addTag('Orders')
    .addTag('Inventory')
    .addTag('Payments')
    .addTag('Products')
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, documentFactory, {
    useGlobalPrefix: true,
    jsonDocumentUrl: 'docs/json',
  });

  logger.log(`✨ Aplicación NestJS ejecutándose en el puerto: ${port}`);
  logger.log(`🔗 API Gateway disponible en: http://localhost:${port}/api`);
  logger.log(`📄 Swagger UI disponible en: http://localhost:${port}/api/docs`);

  await app.listen(port);
}
bootstrap();
