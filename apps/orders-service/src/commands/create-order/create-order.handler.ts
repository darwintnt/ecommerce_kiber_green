import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateOrderCommand } from './create-order.command';
import { OrderRepository } from '../../orders-service.repository';
import { InventoryValidateStep } from '../../saga/steps/inventory-validate.step';
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
    private readonly inventoryValidateStep: InventoryValidateStep,
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

    const idempotencyKey = command.query.headers?.['Idempotency-Key'];

    if (!idempotencyKey) {
      this.logger.warn('No Idempotency-Key provided in headers');
    }

    const context: {
      order: any;
      errorMessage?: string;
      idempotencyKey?: string;
    } = {
      order: savedOrder,
      idempotencyKey,
    };

    const steps = [
      this.inventoryValidateStep,
      this.inventoryReserveStep,
      this.paymentProcessStep,
      this.orderConfirmStep,
    ];

    const orchestrator = new SagaOrchestrator(steps);

    try {
      await orchestrator.execute(context);

      if (!savedOrder?.id) {
        return { success: false, error: 'Failed to create order' };
      }

      if (context.order.reservationId) {
        await this.orderRepository.setReservation(
          savedOrder.id,
          context.order.reservationId,
        );
      }

      if (context.order.transactionId) {
        await this.orderRepository.setPaymentTransaction(
          savedOrder.id,
          context.order.transactionId,
        );
      }

      return { success: true, data: { orderId: savedOrder.id } };
    } catch (error) {
      this.logger.error(
        'Order creation failed, initiating compensation',
        error instanceof Error ? error.message : String(error),
      );

      try {
        await this.orderRepository.updateStatus(
          savedOrder.id,
          OrderStatus.CANCELLED,
        );
        this.logger.log(`Order ${savedOrder.id} marked as CANCELLED`);
      } catch (updateError) {
        this.logger.error(
          `Failed to update order status to CANCELLED: ${updateError}`,
        );
      }

      let errorMessage = 'Order creation failed';
      if (error instanceof RpcException) {
        const rpcError = error.getError();
        errorMessage =
          typeof rpcError === 'string'
            ? rpcError
            : (rpcError as any)?.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      if (context.errorMessage) {
        errorMessage = context.errorMessage;
      }

      return { success: false, error: errorMessage };
    }
  }
}
