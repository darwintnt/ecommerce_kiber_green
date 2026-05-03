import { Inject, Injectable } from '@nestjs/common';
import {
  INVENTORY_REPOSITORY,
  InventoryItem,
  InventoryServiceI,
  ReserveResult,
  ValidateStockResult,
  type InventoryRepositoryI,
} from './interfaces';

@Injectable()
export class InventoryService implements InventoryServiceI {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepositoryI,
  ) {}

  async validateStock(items: InventoryItem[]): Promise<ValidateStockResult> {
    const unavailableItems: ValidateStockResult['unavailableItems'] = [];

    for (const item of items) {
      // Find product by sku (productId is used as sku in this context)
      const product = await this.inventoryRepository.findProductBySku(
        item.productId,
      );

      if (!product) {
        unavailableItems.push({
          productId: item.productId,
          requestedQuantity: item.quantity,
          availableQuantity: 0,
        });
        continue;
      }

      // Business rule: available = stock - reserved
      const availableQuantity = product.stock - product.reserved;

      if (availableQuantity < item.quantity) {
        unavailableItems.push({
          productId: item.productId,
          requestedQuantity: item.quantity,
          availableQuantity,
        });
      }
    }

    return {
      valid: unavailableItems.length === 0,
      unavailableItems,
    };
  }

  async reserve(
    orderId: string,
    items: InventoryItem[],
  ): Promise<ReserveResult> {
    // Validate stock first
    const validation = await this.validateStock(items);
    if (!validation.valid) {
      return {
        reserved: false,
        reason: `Insufficient stock for items: ${validation.unavailableItems.map((i) => i.productId).join(', ')}`,
      };
    }

    // Create reservation
    const reservation = await this.inventoryRepository.createReservation(
      orderId,
      items,
    );

    // Update stock: increase reserved for each item
    for (const item of items) {
      const product = await this.inventoryRepository.findProductBySku(
        item.productId,
      );
      if (product) {
        await this.inventoryRepository.updateStock(
          product.id,
          0,
          item.quantity,
        );
      }
    }

    return {
      reserved: true,
      reservationId: reservation.id,
    };
  }

  async confirm(reservationId: string): Promise<void> {
    const reservation =
      await this.inventoryRepository.findReservationById(reservationId);

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    // Update reservation status to CONFIRMED
    await this.inventoryRepository.updateReservationStatus(
      reservationId,
      'CONFIRMED',
    );

    // Move stock from reserved to sold (decrease both stock and reserved)
    const items = reservation.items;
    for (const item of items) {
      const product = await this.inventoryRepository.findProductBySku(
        item.productId,
      );
      if (product) {
        // On confirm: stock decreases (sold), reserved decreases
        await this.inventoryRepository.updateStock(
          product.id,
          -item.quantity,
          -item.quantity,
        );
      }
    }
  }

  async release(reservationId: string): Promise<void> {
    const reservation =
      await this.inventoryRepository.findReservationById(reservationId);

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    // Release reserved stock (restore reserved to normal stock)
    const items = reservation.items;
    for (const item of items) {
      const product = await this.inventoryRepository.findProductBySku(
        item.productId,
      );
      if (product) {
        // On release: reserved decreases (stock goes back to available)
        await this.inventoryRepository.updateStock(
          product.id,
          0,
          -item.quantity,
        );
      }
    }

    // Update reservation status to RELEASED
    await this.inventoryRepository.releaseReservation(reservationId);
  }

  async releaseByOrderId(orderId: string): Promise<void> {
    const reservation =
      await this.inventoryRepository.findReservationByOrderId(orderId);

    if (!reservation) {
      throw new Error('Reservation not found for order');
    }

    await this.release(reservation.id);
  }
}
