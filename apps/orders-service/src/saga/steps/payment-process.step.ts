import { Inject, Injectable, Logger } from '@nestjs/common';
import { SagaStep } from '../saga-step.interface';
import { ClientProxy } from '@nestjs/microservices';
import { PAYMENT_CLIENT_PROXY, TOPICS } from 'libs/constants';
import { firstValueFrom } from 'rxjs';

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

    const response = await firstValueFrom(
      this.paymentClient.send(TOPICS.PAYMENT_PROCESS, {
        orderId: order.id,
        amount: Math.round(order.total * 100), // Convert to cents
        currency: 'USD',
        idempotencyKey: `payment-${order.id}-${Date.now()}`,
      }),
    );

    if (response.success && response.data?.transactionId) {
      context.order.transactionId = response.data.transactionId;
      return Promise.resolve(true);
    }

    return Promise.resolve(false);
  }

  async compensate(context: any): Promise<void> {
    this.logger.log(`[Compensation] Payment`);
    const { order } = context;

    if (!order.transactionId) {
      this.logger.log(
        `[Compensate]: Payment Nothing to compensate ${order.transactionId}`,
      );
    }

    const response = await firstValueFrom(
      this.paymentClient.send(TOPICS.PAYMENT_REFUND, {
        transactionId: context.order.transactionId,
      }),
    );

    if (response.success && response.data?.transactionId) {
      this.logger.log(
        `[Compensate]: Payment compensate complete: ${response.data.transactionId}`,
      );
      return;
    }

    this.logger.log(
      `[Compensate]: Payment refund failed': ${order.transactionId}`,
    );
  }
}
