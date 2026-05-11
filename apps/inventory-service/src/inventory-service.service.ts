import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  INVENTORY_REPOSITORY,
  InventoryItem,
  InventoryServiceI,
  ReserveData,
  ValidateStockData,
  type InventoryRepositoryI,
  PRODUCT_SERVICE_CLIENT,
  type ProductServiceClientI,
} from './interfaces';
import { ApiResponse } from 'libs/interfaces/api-response.interface';
import { InventoryEventPublisher } from './inventory-event-publisher';

@Injectable()
export class InventoryService implements InventoryServiceI {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepositoryI,
    @Inject(PRODUCT_SERVICE_CLIENT)
    private readonly productClient: ProductServiceClientI,
    private readonly eventPublisher: InventoryEventPublisher,
  ) {}

  async validateStock(
    items: InventoryItem[],
  ): Promise<ApiResponse<ValidateStockData>> {
    const unavailableItems: ValidateStockData['unavailableItems'] = [];

    try {
      for (const item of items) {
        const productResponse = await this.productClient.getProductBySku(
          item.productId,
        );

        if (!productResponse.success || !productResponse.data) {
          unavailableItems.push({
            productId: item.productId,
            requestedQuantity: item.quantity,
            availableQuantity: 0,
          });
          continue;
        }

        const product = productResponse.data;
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

      // Emit event for products-service to update reserved stock
      await this.eventPublisher.publishStockReserved({
        orderId,
        reservationId: reservation.id,
        items: items.map((item) => ({
          productId: item.productId,
          sku: item.productId,
          quantity: item.quantity,
        })),
      });

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

      if (reservation.status !== 'PENDING') {
        return { success: false, error: 'Reservation is not in PENDING state' };
      }

      await this.inventoryRepository.updateReservationStatus(
        reservationId,
        'CONFIRMED',
      );

      // Emit event for products-service to confirm stock reservation
      await this.eventPublisher.publishStockConfirmed({
        reservationId,
        orderId: reservation.orderId,
        items: reservation.items,
      });

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

      if (reservation.status === 'RELEASED') {
        return { success: false, error: 'Reservation already released' };
      }

      await this.inventoryRepository.releaseReservation(reservationId);

      // Emit event for products-service to release reserved stock
      await this.eventPublisher.publishStockReleased({
        reservationId,
        orderId: reservation.orderId,
        items: reservation.items,
      });

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
