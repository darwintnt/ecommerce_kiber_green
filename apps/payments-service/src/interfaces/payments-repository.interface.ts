import { Payment } from '../../generated/prisma/client';

export interface CreatePaymentDto {
  orderId: string;
  amount: number;
  currency: string;
}

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'APPROVED'
  | 'DECLINED'
  | 'REFUNDED';

export interface PaymentRepositoryI {
  create(dto: CreatePaymentDto): Promise<Payment>;
  findByOrderId(orderId: string): Promise<Payment | null>;
  findByTransactionId(transactionId: string): Promise<Payment | null>;
  updateStatus(id: string, status: PaymentStatus): Promise<Payment>;
  setTransactionId(id: string, transactionId: string): Promise<Payment>;
}

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');
