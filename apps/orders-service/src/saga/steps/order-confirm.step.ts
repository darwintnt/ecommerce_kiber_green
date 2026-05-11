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

    // Step 1: Mark inventory as CONFIRMED
    // Only do this AFTER we know we'll update the order to COMPLETED
    // If this succeeds but order update fails, compensate will release the confirmed reservation
    const confirmResponse = await firstValueFrom(
      this.inventoryClient.send(TOPICS.INVENTORY_CONFIRM, {
        reservationId: order.reservationId,
      }),
    );

    if (!confirmResponse.success) {
      this.logger.error(
        `Inventory confirmation failed: ${confirmResponse?.error ?? ''}`,
      );
      return Promise.resolve(false);
    }

    // Step 2: Mark order as COMPLETED
    // If this fails, compensate will roll back the inventory confirm
    await this.orderRepository.updateStatus(order.id, OrderStatus.COMPLETED);

    return Promise.resolve(true);
  }

  async compensate(context: any): Promise<void> {
    this.logger.log(`[Compensation] Order confirm - rolling back`);
    const { order } = context;

    // Rollback: mark order as CANCELLED
    await this.orderRepository.updateStatus(order.id, OrderStatus.CANCELLED);

    // Rollback: release the confirmed inventory (idempotent - release handles already-released)
    if (order.reservationId) {
      await firstValueFrom(
        this.inventoryClient.send(TOPICS.INVENTORY_RELEASE, {
          reservationId: order.reservationId,
        }),
      );
      this.logger.log(`[Compensate]: Order release failed': ${order.id}`);
    }
  }
}
