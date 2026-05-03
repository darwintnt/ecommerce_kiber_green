import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { ORDER_QUEUE, ORDER_SERVICE } from '../constants';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: ORDER_SERVICE,
        transport: Transport.NATS,
        options: {
          servers: ['nats://localhost:4222'],
          queue: ORDER_QUEUE,
        },
      },
    ]),
  ],
  controllers: [OrdersController],
  providers: [],
})
export class OrdersModule {}
