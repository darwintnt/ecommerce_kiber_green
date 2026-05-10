import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { InventoryItem, InventoryRepositoryI } from './interfaces';
import { Prisma } from '../generated/prisma/client';
import { ReservationStatus } from './enums/reservation-status';

@Injectable()
export class InventoryRepository implements InventoryRepositoryI {
  constructor(
    @Inject('DATABASE_SERVICE') private readonly prisma: PrismaService,
  ) {}

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
