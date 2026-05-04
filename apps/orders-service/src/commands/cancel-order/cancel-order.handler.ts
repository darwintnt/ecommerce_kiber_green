import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CancelOrderCommand } from './cancel-order.command';
import { Inject } from '@nestjs/common';
import {
  ORDER_REPOSITORY,
  type OrderRepositoryI,
} from '../../interfaces/orders-repository.interface';
import { Logger } from '@nestjs/common';
import { OrderStatus } from '../../domain/order-status';

@CommandHandler(CancelOrderCommand)
export class CancelOrderHandler implements ICommandHandler<CancelOrderCommand> {
  private readonly logger = new Logger(CancelOrderHandler.name);

  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepositoryI,
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
