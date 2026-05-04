import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateOrderCommand } from './create-order.command';
import { OrderRepository } from '../../orders-service.repository';
import { InventoryReserveStep } from '../../saga/steps/inventory-reserve.step';
import { PaymentProcessStep } from '../../saga/steps/payment-process.step';
import { OrderConfirmStep } from '../../saga/steps/order-confirm.step';
import { CreateOrder, OrderItem } from '../../domain/order-item';
import { SagaOrchestrator } from '../../saga/saga-orchestrator';
import { Inject, Logger } from '@nestjs/common';
import { ORDER_REPOSITORY } from '../../interfaces/orders-repository.interface';
import { Order } from '../../domain/order.entity';
import { OrderStatus } from '../../domain/order-status';
import { RpcException } from '@nestjs/microservices';

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  private readonly logger = new Logger(CreateOrderHandler.name);

  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    private readonly inventoryReserveStep: InventoryReserveStep,
    private readonly paymentProcessStep: PaymentProcessStep,
    private readonly orderConfirmStep: OrderConfirmStep,
  ) {}

  async execute(command: CreateOrderCommand) {
    const order = new Order({
      customerId: command.query.detail.customerId as string,
      items: [],
      total: 0,
      status: OrderStatus.PENDING,
    });

    const items: OrderItem[] = command.query.detail.items as OrderItem[];

    items.forEach((item) => order.addItem(item));
    order.calculateTotal();

    if (!order.validate()) {
      throw new RpcException('Invalid order: validation failed');
    }

    const savedOrder = await this.orderRepository.save(order);

    const context = {
      order: savedOrder,
    };

    const steps = [
      this.inventoryReserveStep,
      this.paymentProcessStep,
      this.orderConfirmStep,
    ];

    const orchestrator = new SagaOrchestrator(steps);

    try {
      await orchestrator.execute(context);
      return {
        success: true,
        orderId: savedOrder.id,
      };
    } catch (error) {
      this.logger.error(
        'Order creation failed, initiating compensation',
        error,
      );
    }
  }
}
