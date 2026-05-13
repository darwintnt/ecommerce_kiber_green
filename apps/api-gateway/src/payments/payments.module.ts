import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PAYMENT_CLIENT_PROXY, PAYMENT_QUEUE } from 'libs/constants';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: PAYMENT_CLIENT_PROXY,
        transport: Transport.NATS,
        options: {
          servers: [process.env['NATS_URL'] || 'nats://localhost:4222'],
          queue: PAYMENT_QUEUE,
        },
      },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [],
})
export class PaymentsModule {}
