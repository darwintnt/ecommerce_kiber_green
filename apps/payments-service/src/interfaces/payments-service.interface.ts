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

// New data interfaces for ApiResponse-wrapped responses
export interface ProcessPaymentData {
  transactionId: string;
}

export interface RefundData {
  transactionId: string;
  refundedAmount: number;
}

// DEPRECATED: Flat types replaced by ApiResponse-wrapped types
// Keeping as comments for reference during transition
// export interface ProcessPaymentResult {
//   success: boolean;
//   transactionId?: string;
//   error?: string;
// }

export interface RefundDto {
  transactionId: string;
  amount?: number;
}

// DEPRECATED: Flat types replaced by ApiResponse-wrapped types
// Keeping as comments for reference during transition
// export interface RefundResult {
//   success: boolean;
//   transactionId?: string;
//   refundedAmount?: number;
//   error?: string;
// }

export interface PaymentServiceI {
  processPayment(
    dto: ProcessPaymentDto,
  ): Promise<ApiResponse<ProcessPaymentData>>;
  refund(dto: RefundDto): Promise<ApiResponse<RefundData>>;
}

export const PAYMENT_SERVICE = Symbol('PAYMENT_SERVICE');
