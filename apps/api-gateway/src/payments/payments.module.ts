import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PAYMENT_QUEUE, PAYMENT_SERVICE } from '../constants';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: PAYMENT_SERVICE,
        transport: Transport.NATS,
        options: {
          servers: ['nats://localhost:4222'],
          queue: PAYMENT_QUEUE,
        },
      },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [],
})
export class PaymentsModule {}
