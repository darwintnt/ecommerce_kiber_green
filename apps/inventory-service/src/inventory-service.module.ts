import { Module } from '@nestjs/common';
import { InventoryServiceController } from './inventory-service.controller';
import { InventoryService } from './inventory-service.service';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/envs';
import { PrismaService } from './prisma.service';
import { InventoryRepository } from './inventory-service.repository';
import {
  INVENTORY_REPOSITORY,
  INVENTORY_SERVICE,
  PRODUCT_SERVICE_CLIENT,
} from './interfaces';
import { ProductServiceClient } from './product-service.client';
import { InventoryEventPublisher } from './inventory-event-publisher';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  PRODUCT_CLIENT_PROXY,
  PRODUCT_QUEUE,
  INVENTORY_QUEUE,
} from 'libs/constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      envFilePath: ['apps/inventory-service/.env'],
    }),
    ClientsModule.register([
      {
        name: PRODUCT_CLIENT_PROXY,
        transport: Transport.NATS,
        options: {
          servers: [process.env['NATS_URL'] || 'nats://localhost:4222'],
          queue: PRODUCT_QUEUE,
        },
      },
      {
        name: 'INVENTORY_EVENT_PUBLISHER',
        transport: Transport.NATS,
        options: {
          servers: [process.env['NATS_URL'] || 'nats://localhost:4222'],
          queue: INVENTORY_QUEUE,
        },
      },
    ]),
  ],
  controllers: [InventoryServiceController],
  providers: [
    {
      provide: INVENTORY_SERVICE,
      useClass: InventoryService,
    },
    {
      provide: INVENTORY_REPOSITORY,
      useClass: InventoryRepository,
    },
    {
      provide: 'DATABASE_SERVICE',
      useClass: PrismaService,
    },
    {
      provide: PRODUCT_SERVICE_CLIENT,
      useClass: ProductServiceClient,
    },
    InventoryEventPublisher,
  ],
})
export class InventoryServiceModule {}
