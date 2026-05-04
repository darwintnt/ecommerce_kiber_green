import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CancelOrderCommand } from './cancel-order.command';
import { type OrderRepositoryI } from '../../interfaces/orders-repository.interface';
import { Logger } from '@nestjs/common';

@CommandHandler(CancelOrderCommand)
export class CancelOrderHandler implements ICommandHandler<CancelOrderCommand> {
  private readonly logger = new Logger(CancelOrderHandler.name);
  constructor(private readonly orderRepository: OrderRepositoryI) {}

  async execute(command: CancelOrderCommand) {
    // const order = await this.orderRepository.findById(command.orderId);

    // if (!order) {
    //   throw new Error('Order not found');
    // }

    // // Check if order can be cancelled (must not be COMPLETED or already CANCELLED)
    // if (order.status === OrderStatus.COMPLETED) {
    //   throw new Error('Cannot cancel order in COMPLETED state');
    // }

    // if (order.status === OrderStatus.CANCELLED) {
    //   throw new Error('Order is already cancelled');
    // }

    // // Execute saga compensation (release inventory, refund payment if needed)
    // await this.sagaOrchestrator.compensate(order);

    // // Update order status to CANCELLED
    // await this.orderRepository.updateStatus(command.orderId, OrderStatus.CANCELLED);

    // return { success: true, cancelled: true };

    return Promise.resolve(true);
  }
}
