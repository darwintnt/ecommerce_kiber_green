import { Module } from '@nestjs/common';
import { OrdersServiceController } from './orders-service.controller';
import { OrdersService } from './orders-service.service';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/envs';
import { PrismaService } from './prisma.service';
import { OrderRepository } from './orders-service.repository';
import { ORDER_REPOSITORY } from './interfaces/orders-repository.interface';
import { ORDER_SERVICE } from './interfaces/orders-service.interface';
import { CqrsModule } from '@nestjs/cqrs';
import { OrdersQueryHandlers } from './queries';
import { OrdersCommandHandlers } from './commands';
import { InventoryReserveStep } from './saga/steps/inventory-reserve.step';
import { PaymentProcessStep } from './saga/steps/payment-process.step';
import { OrderConfirmStep } from './saga/steps/order-confirm.step';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  INVENTORY_CLIENT_PROXY,
  INVENTORY_QUEUE,
  PAYMENT_CLIENT_PROXY,
  PAYMENT_QUEUE,
} from 'libs/constants';

// Commands
export const CommandHandlers = [...OrdersCommandHandlers];

// Queries
export const QueryHandlers = [...OrdersQueryHandlers];

// Saga Steps
export const SagaSteps = [
  InventoryReserveStep,
  PaymentProcessStep,
  OrderConfirmStep,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      envFilePath: ['apps/orders-service/.env'],
    }),
    CqrsModule.forRoot(),
    ClientsModule.register([
      {
        name: INVENTORY_CLIENT_PROXY,
        transport: Transport.NATS,
        options: {
          servers: ['nats://localhost:4222'],
          queue: INVENTORY_QUEUE,
        },
      },
      {
        name: PAYMENT_CLIENT_PROXY,
        transport: Transport.NATS,
        options: {
          servers: ['nats://localhost:4222'],
          queue: PAYMENT_QUEUE,
        },
      },
    ]),
  ],
  controllers: [OrdersServiceController],
  providers: [
    {
      provide: ORDER_SERVICE,
      useClass: OrdersService,
    },
    {
      provide: ORDER_REPOSITORY,
      useClass: OrderRepository,
    },
    {
      provide: 'DATABASE_SERVICE',
      useClass: PrismaService,
    },
    ...CommandHandlers,
    ...QueryHandlers,
    ...SagaSteps,
  ],
})
export class OrdersServiceModule {}
