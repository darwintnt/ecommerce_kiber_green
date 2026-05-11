import { ApiResponse } from 'libs/interfaces/api-response.interface';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  REFUNDED = 'REFUNDED',
}

export interface ProcessPaymentDto {
  orderId: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
}

export interface ProcessPaymentData {
  transactionId: string;
}

export interface RefundData {
  transactionId: string;
  refundedAmount: number;
}

export interface RefundDto {
  transactionId: string;
  amount?: number;
}

export interface PaymentServiceI {
  processPayment(
    dto: ProcessPaymentDto,
  ): Promise<ApiResponse<ProcessPaymentData>>;
  refund(dto: RefundDto): Promise<ApiResponse<RefundData>>;
}

export const PAYMENT_SERVICE = Symbol('PAYMENT_SERVICE');
