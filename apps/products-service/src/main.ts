import { NestFactory } from '@nestjs/core';
import { ProductsServiceModule } from './products-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';
import { PRODUCT_QUEUE } from 'libs/constants';

async function bootstrap() {
  const logger = new Logger('PRODUCTS-SERVICE');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ProductsServiceModule,
    {
      transport: Transport.NATS,
      options: {
        servers: [process.env['NATS_URL'] || 'nats://localhost:4222'],
        queue: PRODUCT_QUEUE,
      },
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen();

  logger.log(`📦 Products Service Application is listening...`);
}
bootstrap();
