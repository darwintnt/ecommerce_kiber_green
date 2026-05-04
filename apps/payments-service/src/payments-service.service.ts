import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  PaymentServiceI,
  PaymentStatus,
  ProcessPaymentDto,
  RefundDto,
  ProcessPaymentData,
  RefundData,
} from './interfaces/payments-service.interface';
import {
  PAYMENT_REPOSITORY,
  type PaymentRepositoryI,
} from './interfaces/payments-repository.interface';
import {
  IDEMPOTENCY_REPOSITORY,
  type IdempotencyRepositoryI,
} from './interfaces/idempotency-repository.interface';
import { ApiResponse } from 'libs/interfaces/api-response.interface';

@Injectable()
export class PaymentsService implements PaymentServiceI {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepositoryI,
    @Inject(IDEMPOTENCY_REPOSITORY)
    private readonly idempotencyRepository: IdempotencyRepositoryI,
  ) {}

  async processPayment(
    dto: ProcessPaymentDto,
  ): Promise<ApiResponse<ProcessPaymentData>> {
    // Check idempotency key first
    const existingKey = await this.idempotencyRepository.findByKey(
      dto.idempotencyKey,
    );
    if (existingKey && !this.idempotencyRepository.isExpired(existingKey)) {
      this.logger.log(
        `Returning cached response for idempotency key: ${dto.idempotencyKey}`,
      );
      return existingKey.response as ApiResponse<ProcessPaymentData>;
    }

    // Create payment in PENDING status
    const payment = await this.paymentRepository.create({
      orderId: dto.orderId,
      amount: dto.amount,
      currency: dto.currency,
    });

    // Simulate payment processing
    // In production, this would call an actual payment gateway
    const success = dto.amount > 0;

    if (success) {
      // Generate transaction ID
      const transactionId = crypto.randomUUID();
      const txnId = `txn-${transactionId}`;

      // Update payment with transaction ID and APPROVED status
      await this.paymentRepository.setTransactionId(payment.id, txnId);

      const response: ApiResponse<ProcessPaymentData> = {
        success: true,
        data: { transactionId: txnId },
      };

      // Store response in idempotency key (expires in 24 hours)
      await this.idempotencyRepository.create({
        key: dto.idempotencyKey,
        response,
        expiresInHours: 24,
      });

      return response;
    } else {
      // Update payment status to DECLINED
      await this.paymentRepository.updateStatus(
        payment.id,
        PaymentStatus.DECLINED,
      );

      const response: ApiResponse<ProcessPaymentData> = {
        success: false,
        error: 'Payment declined - invalid amount',
      };

      // Store response in idempotency key
      await this.idempotencyRepository.create({
        key: dto.idempotencyKey,
        response,
        expiresInHours: 24,
      });

      return response;
    }
  }

  async refund(dto: RefundDto): Promise<ApiResponse<RefundData>> {
    // Find payment by transaction ID
    const payment = await this.paymentRepository.findByTransactionId(
      dto.transactionId,
    );
    if (!payment) {
      return {
        success: false,
        error: 'Payment not found',
      };
    }

    // Update status to REFUNDED
    await this.paymentRepository.updateStatus(
      payment.id,
      PaymentStatus.REFUNDED,
    );

    return {
      success: true,
      data: {
        transactionId: dto.transactionId,
        refundedAmount: Number(payment.amount),
      },
    };
  }
}
