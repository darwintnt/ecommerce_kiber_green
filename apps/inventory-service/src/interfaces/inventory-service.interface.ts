import { InventoryItem, ReserveResult, ValidateStockResult } from '.';

export interface InventoryServiceI {
  validateStock(items: InventoryItem[]): Promise<ValidateStockResult>;
  reserve(orderId: string, items: InventoryItem[]): Promise<ReserveResult>;
  confirm(reservationId: string): Promise<void>;
  release(reservationId: string): Promise<void>;
  releaseByOrderId(orderId: string): Promise<void>;
}

export const INVENTORY_SERVICE = Symbol('INVENTORY_SERVICE');
