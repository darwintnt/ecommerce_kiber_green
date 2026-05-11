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

    const response = await firstValueFrom(
      this.inventoryClient.send(TOPICS.INVENTORY_CONFIRM, {
        reservationId: order.reservationId,
      }),
    );

    if (!response.success) {
      this.logger.error(
        `Inventory confirmation failed: ${response?.error ?? ''}`,
      );
      return Promise.resolve(false);
    }

    await this.orderRepository.updateStatus(order.id, OrderStatus.COMPLETED);

    return Promise.resolve(true);
  }

  async compensate(context: any): Promise<void> {
    this.logger.log(`[Compensation] Order`);
    const { order } = context;
    const response = await this.orderRepository.updateStatus(
      order.id,
      OrderStatus.CANCELLED,
    );

    if (response) {
      this.logger.log(`[Compensate]: Order compensate complete: ${order.id}`);
      return;
    }

    this.logger.log(`[Compensate]: Order release failed': ${order.id}`);
  }
}
