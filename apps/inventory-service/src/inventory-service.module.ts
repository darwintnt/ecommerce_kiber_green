import { Module } from '@nestjs/common';
import { InventoryServiceController } from './inventory-service.controller';
import { InventoryService } from './inventory-service.service';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/envs';
import { PrismaService } from './prisma.service';
import { InventoryRepository } from './inventory-service.repository';
import { INVENTORY_REPOSITORY, INVENTORY_SERVICE } from './interfaces';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      envFilePath: ['apps/inventory-service/.env'],
    }),
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
  ],
})
export class InventoryServiceModule {}
