import { Inject, Injectable } from '@nestjs/common';
import {
  INVENTORY_REPOSITORY,
  InventoryItem,
  InventoryServiceI,
  ReserveData,
  ValidateStockData,
  type InventoryRepositoryI,
} from './interfaces';
import { ApiResponse } from 'libs/interfaces/api-response.interface';

@Injectable()
export class InventoryService implements InventoryServiceI {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepositoryI,
  ) {}

  async validateStock(
    items: InventoryItem[],
  ): Promise<ApiResponse<ValidateStockData>> {
    const unavailableItems: ValidateStockData['unavailableItems'] = [];

    try {
      for (const item of items) {
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
        success: unavailableItems.length === 0,
        data: { valid: unavailableItems.length === 0, unavailableItems },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async reserve(
    orderId: string,
    items: InventoryItem[],
  ): Promise<ApiResponse<ReserveData>> {
    try {
      const validation = await this.validateStock(items);
      if (!validation.data?.valid) {
        const unavailableProductIds =
          validation.data?.unavailableItems
            .map((i) => i.productId)
            .join(', ') ?? '';
        return {
          success: false,
          error: `Insufficient stock for items: ${unavailableProductIds}`,
        };
      }

      const reservation = await this.inventoryRepository.createReservation(
        orderId,
        items,
      );

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

      return { success: true, data: { reservationId: reservation.id } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async confirm(reservationId: string): Promise<ApiResponse<void>> {
    try {
      const reservation =
        await this.inventoryRepository.findReservationById(reservationId);

      if (!reservation) {
        return { success: false, error: 'Reservation not found' };
      }

      await this.inventoryRepository.updateReservationStatus(
        reservationId,
        'CONFIRMED',
      );

      const items = reservation.items;
      for (const item of items) {
        const product = await this.inventoryRepository.findProductBySku(
          item.productId,
        );
        if (product) {
          await this.inventoryRepository.updateStock(
            product.id,
            -item.quantity,
            -item.quantity,
          );
        }
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async release(reservationId: string): Promise<ApiResponse<void>> {
    try {
      const reservation =
        await this.inventoryRepository.findReservationById(reservationId);

      if (!reservation) {
        return { success: false, error: 'Reservation not found' };
      }

      const items = reservation.items;

      console.log(items);

      for (const item of items) {
        const product = await this.inventoryRepository.findProductBySku(
          item.productId,
        );
        if (product) {
          await this.inventoryRepository.updateStock(
            product.id,
            0,
            -item.quantity,
          );
        }
      }

      await this.inventoryRepository.releaseReservation(reservationId);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async releaseByOrderId(orderId: string): Promise<ApiResponse<void>> {
    try {
      const reservation =
        await this.inventoryRepository.findReservationByOrderId(orderId);

      if (!reservation) {
        return { success: false, error: 'Reservation not found for order' };
      }

      return await this.release(reservation.id);
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}
