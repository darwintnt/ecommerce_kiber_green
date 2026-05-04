import { Inject, Injectable, Logger } from '@nestjs/common';
import { SagaStep } from '../saga-step.interface';
import { ClientProxy } from '@nestjs/microservices';
import { TOPICS } from 'libs/constants';
import { firstValueFrom } from 'rxjs';
import {
  ORDER_REPOSITORY,
  type OrderRepositoryI,
} from '../../interfaces/orders-repository.interface';
import { INVENTORY_CLIENT_PROXY } from 'libs/constants';
import { CreateOrder } from '../../domain/order-item';
import { OrderStatus } from '../../domain/order-status';

@Injectable()
export class OrderConfirmStep implements SagaStep {
  private readonly logger = new Logger(OrderConfirmStep.name);

  constructor(
    @Inject(INVENTORY_CLIENT_PROXY)
    private readonly inventoryClient: ClientProxy,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepositoryI,
  ) {}

  getName(): string {
    return 'Create Order Step';
  }

  async execute(context: any): Promise<boolean> {
    const { order } = context;

    // Confirm inventory reservation
    const response = await firstValueFrom(
      this.inventoryClient.send(TOPICS.INVENTORY_CONFIRM, {
        reservationId: order.reservationId,
      }),
    );

    if (!response) {
      return Promise.resolve(false);
    }

    // Update order status to COMPLETED
    await this.orderRepository.updateStatus(order.id, OrderStatus.COMPLETED);

    return Promise.resolve(true);
  }

  async compensate(context: any): Promise<void> {
    const { order } = context;
    this.logger.log(`[Compensation] Order`);
    await this.orderRepository.updateStatus(order.id, OrderStatus.CANCELLED);
  }
}
