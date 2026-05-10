import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PRODUCT_CLIENT_PROXY, PRODUCT_QUEUE } from 'libs/constants';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: PRODUCT_CLIENT_PROXY,
        transport: Transport.NATS,
        options: {
          servers: ['nats://localhost:4222'],
          queue: PRODUCT_QUEUE,
        },
      },
    ]),
  ],
  controllers: [ProductsController],
  providers: [],
})
export class ProductsModule {}
