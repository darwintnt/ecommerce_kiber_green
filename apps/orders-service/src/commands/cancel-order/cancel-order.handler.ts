import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CancelOrderCommand } from './cancel-order.command';
import { Inject } from '@nestjs/common';
import {
  ORDER_REPOSITORY,
  type OrderRepositoryI,
} from '../../interfaces/orders-repository.interface';
import { Logger } from '@nestjs/common';
import { OrderStatus } from '../../domain/order-status';
import { ClientProxy } from '@nestjs/microservices';
import {
  INVENTORY_CLIENT_PROXY,
  PAYMENT_CLIENT_PROXY,
  TOPICS,
} from 'libs/constants';
import { firstValueFrom } from 'rxjs';

@CommandHandler(CancelOrderCommand)
export class CancelOrderHandler implements ICommandHandler<CancelOrderCommand> {
  private readonly logger = new Logger(CancelOrderHandler.name);

  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepositoryI,
    @Inject(INVENTORY_CLIENT_PROXY)
    private readonly inventoryClient: ClientProxy,
    @Inject(PAYMENT_CLIENT_PROXY)
    private readonly paymentClient: ClientProxy,
  ) {}

  async execute(
    command: CancelOrderCommand,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const order = await this.orderRepository.findById(command.orderId);

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      if (order.status === OrderStatus.COMPLETED) {
        return {
          success: false,
          error: 'Order cannot be cancelled in COMPLETED state',
        };
      }

      if (order.status === OrderStatus.CANCELLED) {
        return { success: false, error: 'Order is already cancelled' };
      }

      // Compensate: release inventory reservation
      if (order.inventoryReservationId) {
        const releaseResponse = await firstValueFrom(
          this.inventoryClient.send(TOPICS.INVENTORY_RELEASE, {
            reservationId: order.inventoryReservationId,
          }),
        );
        if (!releaseResponse.success) {
          this.logger.warn(
            `Failed to release inventory reservation ${order.inventoryReservationId}: ${releaseResponse.error}`,
          );
        }
      }

      // Compensate: refund payment if transaction exists
      if (order.paymentTransactionId) {
        const refundResponse = await firstValueFrom(
          this.paymentClient.send(TOPICS.PAYMENT_REFUND, {
            transactionId: order.paymentTransactionId,
          }),
        );
        if (!refundResponse.success) {
          this.logger.warn(
            `Failed to refund payment ${order.paymentTransactionId}: ${refundResponse.error}`,
          );
        }
      }

      await this.orderRepository.updateStatus(
        command.orderId,
        OrderStatus.CANCELLED,
      );

      return { success: true };
    } catch (error) {
      this.logger.error('Cancel order failed', error);
      return { success: false, error: (error as Error).message };
    }
  }
}
