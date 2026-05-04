import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  Inject,
  Logger,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { ClientProxy } from '@nestjs/microservices';
import { ProcessPaymentRequestDto } from './dto/process-payment-request.dto';
import { PAYMENT_CLIENT_PROXY, TOPICS } from 'libs/constants';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    @Inject(PAYMENT_CLIENT_PROXY) private readonly client: ClientProxy,
  ) {}

  @Get(':transactionId')
  @ApiOperation({ summary: 'Get payment status by transaction ID' })
  @ApiParam({ name: 'transactionId', description: 'Payment transaction ID' })
  @ApiHeader({ name: 'x-correlation-id', required: false })
  @ApiResponse({ status: 200, description: 'Payment status retrieved' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getPayment(
    @Param('transactionId') transactionId: string,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<any> {
    const corrId = correlationId || this.generateCorrelationId();
    this.logger.log(`Getting payment status for transaction: ${transactionId}`);

    // Payment service doesn't have a direct get endpoint - this would need to be added
    // For now, return a placeholder response indicating this is a gateway operation
    return Promise.resolve({
      transactionId,
      status: 'forwarded_to_service',
      correlationId: corrId,
      message: 'Direct transaction lookup not implemented at gateway level',
    });
  }

  @Post('process')
  @ApiOperation({ summary: 'Process payment directly (for testing)' })
  @ApiHeader({ name: 'x-correlation-id', required: false })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Payment processing failed' })
  async processPayment(
    @Body() body: ProcessPaymentRequestDto,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<any> {
    const corrId = correlationId || this.generateCorrelationId();
    this.logger.log(`Processing payment for order: ${body.orderId}`);

    const data = {
      detail: {
        orderId: body.orderId,
        amount: body.amount,
        currency: body.currency || 'USD',
        paymentMethod: body.paymentMethod || 'credit_card',
        correlationId: corrId,
      },
      headers: { 'x-correlation-id': corrId },
    };

    try {
      return this.client.send(TOPICS.PAYMENT_PROCESS, data);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to process payment: ${err.message}`);
      throw error;
    }
  }

  private generateCorrelationId(): string {
    return randomUUID();
  }
}
