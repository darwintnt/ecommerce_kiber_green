import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { OrderRepositoryI } from './interfaces/orders-repository.interface';
import { OrderStatus } from './domain/order-status';
import { PaginatedResult } from 'libs/commons/pagination.dto';
import { Order } from '../generated/prisma/client';

@Injectable()
export class OrderRepository implements OrderRepositoryI {
  constructor(
    @Inject('DATABASE_SERVICE') private readonly prisma: PrismaService,
  ) {}

  async findAll(
    page: number,
    limit: number,
    search: string,
    conditions?: Record<string, any>,
  ): Promise<PaginatedResult<Order>> {
    const MAX_LIMIT = 100;
    const safeLimit = Math.min(Math.max(1, limit), MAX_LIMIT);
    const skip = (page - 1) * safeLimit;

    const where = {
      ...conditions,
    };

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.order.count(),
    ]);

    return {
      data: data,
      meta: {
        page,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async save(order: any): Promise<any> {
    return this.prisma.order.create({
      data: {
        id: order.id,
        customerId: order.customerId,
        items: order.items,
        total: order.total,
        status: order.status,
        inventoryReservationId: order.inventoryReservationId,
        paymentTransactionId: order.paymentTransactionId,
      },
    });
  }

  async findById(id: string): Promise<any> {
    const order = await this.prisma.order.findUnique({ where: { id } });
    return order ?? null;
  }

  async findByCustomerId(customerId: string): Promise<any[]> {
    return this.prisma.order.findMany({ where: { customerId } });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<any> {
    const updated = await this.prisma.order.update({
      where: { id },
      data: { status },
    });
    return updated;
  }

  async setReservation(id: string, reservationId: string): Promise<any> {
    return this.prisma.order.update({
      where: { id },
      data: { inventoryReservationId: reservationId },
    });
  }

  async setPaymentTransaction(id: string, transactionId: string): Promise<any> {
    return await this.prisma.order.update({
      where: { id },
      data: { paymentTransactionId: transactionId },
    });
  }
}
