import { ApiResponse } from 'libs/interfaces/api-response.interface';
import { InventoryItem, ReserveData, ValidateStockData } from '.';

export interface InventoryServiceI {
  validateStock(
    items: InventoryItem[],
  ): Promise<ApiResponse<ValidateStockData>>;
  reserve(
    orderId: string,
    items: InventoryItem[],
  ): Promise<ApiResponse<ReserveData>>;
  confirm(reservationId: string): Promise<ApiResponse<void>>;
  release(reservationId: string): Promise<ApiResponse<void>>;
  releaseByOrderId(orderId: string): Promise<ApiResponse<void>>;
}

export const INVENTORY_SERVICE = Symbol('INVENTORY_SERVICE');
