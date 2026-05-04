import { Controller, Inject, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TOPICS } from 'libs/constants';
import {
  type ProcessPaymentDto,
  type PaymentServiceI,
  type RefundDto,
  PAYMENT_SERVICE,
} from './interfaces/payments-service.interface';

@Controller()
export class PaymentsServiceController {
  private readonly logger = new Logger(PaymentsServiceController.name);
  constructor(
    @Inject(PAYMENT_SERVICE) private readonly paymentsService: PaymentServiceI,
  ) {}

  @MessagePattern(TOPICS.PAYMENT_PROCESS)
  async handleProcessPayment(@Payload() data: ProcessPaymentDto) {
    this.logger.log(
      `Received payment process request for order: ${data.orderId}`,
    );
    return this.paymentsService.processPayment(data);
  }

  @MessagePattern(TOPICS.PAYMENT_REFUND)
  async handleRefund(@Payload() data: RefundDto) {
    this.logger.log(
      `Received refund request for transaction: ${data.transactionId}`,
    );
    return this.paymentsService.refund(data);
  }
}
