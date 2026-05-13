import { NestFactory } from '@nestjs/core';
import { OrdersServiceModule } from './orders-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ORDER_QUEUE } from 'libs/constants';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('ORDERS-SERVICE');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    OrdersServiceModule,
    {
      transport: Transport.NATS,
      options: {
        servers: [process.env['NATS_URL'] || 'nats://localhost:4222'],
        queue: ORDER_QUEUE,
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

  logger.log(`🛒 Orders Service Application is listening...`);
}
bootstrap();
