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

export interface ProcessPaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface RefundDto {
  transactionId: string;
  amount?: number;
}

export interface RefundResult {
  success: boolean;
  transactionId?: string;
  refundedAmount?: number;
  error?: string;
}

export interface PaymentServiceI {
  processPayment(dto: ProcessPaymentDto): Promise<ProcessPaymentResult>;
  refund(dto: RefundDto): Promise<RefundResult>;
}

export const PAYMENT_SERVICE = Symbol('PAYMENT_SERVICE');
