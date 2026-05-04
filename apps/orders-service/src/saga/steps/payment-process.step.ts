import { Inject, Injectable, Logger } from '@nestjs/common';
import { SagaStep } from '../saga-step.interface';
import { ClientProxy } from '@nestjs/microservices';
import { PAYMENT_CLIENT_PROXY, TOPICS } from 'libs/constants';
import { firstValueFrom } from 'rxjs';
import { CreateOrder } from '../../domain/order-item';

@Injectable()
export class PaymentProcessStep implements SagaStep {
  private readonly logger = new Logger(PaymentProcessStep.name);

  constructor(
    @Inject(PAYMENT_CLIENT_PROXY) private readonly paymentClient: ClientProxy,
  ) {}

  getName(): string {
    return 'Payment Process Step';
  }

  async execute(context: any): Promise<boolean> {
    const { order } = context;

    // const response = await firstValueFrom(
    //   this.paymentClient.send(TOPICS.PAYMENT_PROCESS, {
    //     orderId: order.id,
    //     amount: Math.round(order.total * 100), // Convert to cents
    //     currency: 'USD',
    //     idempotencyKey: `payment-${order.id}-${Date.now()}`,
    //   }),
    // );

    // if (response.success && response.transactionId) {
    //   this.context.transactionId = response.transactionId;
    //   return true;
    // }

    return false;
  }

  async compensate(context: any): Promise<void> {
    this.logger.log(`[Compensation] Payment`);
    await Promise.resolve(false);
    // if (!this.context.transactionId) {
    //   return { success: true }; // Nothing to compensate
    // }

    // const response = firstValueFrom(this.paymentClient.send(TOPICS.PAYMENT_REFUND, {
    //   transactionId: context.transactionId,
    // }));

    // if (response.success) {
    //   return { success: true, compensated: true };
    // }

    // return {
    //   success: false,
    //   error: response.error || 'Payment refund failed',
    //   compensated: false,
    // };
  }
}
