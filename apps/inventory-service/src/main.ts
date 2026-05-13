import { NestFactory } from '@nestjs/core';
import { InventoryServiceModule } from './inventory-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';
import { INVENTORY_QUEUE } from 'libs/constants';

async function bootstrap() {
  const logger = new Logger('INVENTORY-SERVICE');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    InventoryServiceModule,
    {
      transport: Transport.NATS,
      options: {
        servers: [process.env['NATS_URL'] || 'nats://localhost:4222'],
        queue: INVENTORY_QUEUE,
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

  logger.log(`🚀 Inventory Service Application is listening...`);
}
bootstrap();
