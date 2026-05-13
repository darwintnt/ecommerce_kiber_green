import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ORDER_CLIENT_PROXY, ORDER_QUEUE } from 'libs/constants';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: ORDER_CLIENT_PROXY,
        transport: Transport.NATS,
        options: {
          servers: [process.env['NATS_URL'] || 'nats://localhost:4222'],
          queue: ORDER_QUEUE,
        },
      },
    ]),
  ],
  controllers: [OrdersController],
  providers: [],
})
export class OrdersModule {}
