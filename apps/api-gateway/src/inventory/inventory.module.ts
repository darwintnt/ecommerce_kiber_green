import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { INVENTORY_QUEUE, INVENTORY_SERVICE } from '../constants';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: INVENTORY_SERVICE,
        transport: Transport.NATS,
        options: {
          servers: ['nats://localhost:4222'],
          queue: INVENTORY_QUEUE,
        },
      },
    ]),
  ],
  controllers: [InventoryController],
  providers: [],
})
export class InventoryModule {}
