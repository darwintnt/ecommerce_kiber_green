import { Inject, Injectable } from '@nestjs/common';
import {
  CreatePaymentDto,
  PaymentRepositoryI,
} from './interfaces/payments-repository.interface';
import { PrismaService } from './prisma.service';
import { Payment } from '../generated/prisma/client';
import { PaymentStatus } from './interfaces/payments-service.interface';

@Injectable()
export class PaymentsRepository implements PaymentRepositoryI {
  constructor(
    @Inject('DATABASE_SERVICE') private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreatePaymentDto): Promise<Payment> {
    return this.prisma.payment.create({
      data: {
        orderId: dto.orderId,
        amount: dto.amount,
        currency: dto.currency,
        status: PaymentStatus.PENDING,
      },
    });
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({
      where: { orderId },
    });
  }

  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({
      where: { transactionId },
    });
  }

  async updateStatus(id: string, status: PaymentStatus): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id },
      data: { status },
    });
  }

  async setTransactionId(id: string, transactionId: string): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id },
      data: {
        transactionId,
        status: PaymentStatus.APPROVED,
      },
    });
  }
}
