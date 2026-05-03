import { Module } from '@nestjs/common';
import { InventoryServiceController } from './inventory-service.controller';
import { InventoryServiceService } from './inventory-service.service';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/envs';
import { PrismaService } from './prisma.service';
import { INVENTORY_REPOSITORY } from './interfaces/inventory.repository.interface';
import { InventoryRepository } from './inventory-service.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      envFilePath: ['apps/inventory-service/.env'],
    }),
  ],
  controllers: [InventoryServiceController],
  providers: [
    InventoryServiceService,
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
