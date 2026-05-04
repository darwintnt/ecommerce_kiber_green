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
    const skip = (page - 1) * limit;

    const where = {
      ...conditions,
    };

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count(),
    ]);

    return {
      data: data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private mapToEntity(prismaOrder: any): any {
    return {
      id: prismaOrder.id,
      customerId: prismaOrder.customerId,
      items: prismaOrder.items,
      total: Number(prismaOrder.total),
      status: prismaOrder.status as OrderStatus,
      inventoryReservationId: prismaOrder.inventoryReservationId,
      paymentTransactionId: prismaOrder.paymentTransactionId,
      createdAt: prismaOrder.createdAt,
      updatedAt: prismaOrder.updatedAt,
    };
  }

  async save(order: any): Promise<any> {
    const saved = await this.prisma.order.create({
      data: {
        id: order.id,
        customerId: order.customerId,
        items: order.items as any,
        total: order.total,
        status: order.status,
        inventoryReservationId: order.inventoryReservationId,
        paymentTransactionId: order.paymentTransactionId,
      },
    });
    return this.mapToEntity(saved);
  }

  async findById(id: string): Promise<any | null> {
    const order = await this.prisma.order.findUnique({ where: { id } });
    return order ? this.mapToEntity(order) : null;
  }

  async findByCustomerId(customerId: string): Promise<any[]> {
    const orders = await this.prisma.order.findMany({ where: { customerId } });
    return orders.map((o) => this.mapToEntity(o));
  }

  async updateStatus(id: string, status: OrderStatus): Promise<any> {
    const updated = await this.prisma.order.update({
      where: { id },
      data: { status },
    });
    return updated;
  }

  async setReservation(id: string, reservationId: string): Promise<any> {
    const updated = await this.prisma.order.update({
      where: { id },
      data: { inventoryReservationId: reservationId },
    });
    return this.mapToEntity(updated);
  }

  async setPaymentTransaction(id: string, transactionId: string): Promise<any> {
    const updated = await this.prisma.order.update({
      where: { id },
      data: { paymentTransactionId: transactionId },
    });
    return this.mapToEntity(updated);
  }
}
