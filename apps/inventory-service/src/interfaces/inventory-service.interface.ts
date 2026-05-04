import { ApiResponse } from 'libs/interfaces/api-response.interface';
import { InventoryItem, ReserveResult, ValidateStockResult } from '.';

export interface InventoryServiceI {
  validateStock(
    items: InventoryItem[],
  ): Promise<ApiResponse<ValidateStockResult>>;
  reserve(
    orderId: string,
    items: InventoryItem[],
  ): Promise<ApiResponse<ReserveResult>>;
  confirm(reservationId: string): Promise<ApiResponse<void>>;
  release(reservationId: string): Promise<ApiResponse<void>>;
  releaseByOrderId(orderId: string): Promise<ApiResponse<void>>;
}

export const INVENTORY_SERVICE = Symbol('INVENTORY_SERVICE');
