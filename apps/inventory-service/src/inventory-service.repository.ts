import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  InventoryItem,
  InventoryRepositoryI,
} from './interfaces/inventory.repository.interface';
import { Prisma } from '../generated/prisma/client';
import { ReservationStatus } from './enums/reservation-status';

@Injectable()
export class InventoryRepository implements InventoryRepositoryI {
  constructor(
    @Inject('DATABASE_SERVICE') private readonly prisma: PrismaService,
  ) {}

  async findProductBySku(sku: string): Promise<{
    id: string;
    sku: string;
    stock: number;
    reserved: number;
  } | null> {
    const product = await this.prisma.product.findUnique({ where: { sku } });
    if (!product) return null;
    return {
      id: product.id,
      sku: product.sku,
      stock: product.stock,
      reserved: product.reserved,
    };
  }

  async updateStock(
    productId: string,
    stockDelta: number,
    reservedDelta: number,
  ): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new Error(`Product ${productId} not found`);

    const newStock = product.stock + stockDelta;
    const newReserved = product.reserved + reservedDelta;

    if (newStock < 0 || newReserved < 0) {
      throw new Error('Stock or reserved cannot be negative');
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        stock: newStock,
        reserved: newReserved,
      },
    });
  }

  async createReservation(
    orderId: string,
    items: InventoryItem[],
  ): Promise<{ id: string }> {
    const reservation = await this.prisma.inventoryReservation.create({
      data: {
        orderId,
        status: ReservationStatus.PENDING,
        items: items as unknown as Prisma.InputJsonValue,
      },
    });
    return { id: reservation.id };
  }

  async findReservationById(id: string): Promise<any> {
    return this.prisma.inventoryReservation.findUnique({ where: { id } });
  }

  async findReservationByOrderId(orderId: string): Promise<any> {
    return this.prisma.inventoryReservation.findUnique({ where: { orderId } });
  }

  async updateReservationStatus(
    id: string,
    status: 'PENDING' | 'CONFIRMED' | 'RELEASED',
  ): Promise<void> {
    await this.prisma.inventoryReservation.update({
      where: { id },
      data: { status },
    });
  }

  async releaseReservation(id: string): Promise<void> {
    await this.prisma.inventoryReservation.update({
      where: { id },
      data: { status: ReservationStatus.RELEASED },
    });
  }
}
