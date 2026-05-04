export * from './inventory-repository.interface';
export * from './inventory-service.interface';
export type { ApiResponse } from 'libs/interfaces/api-response.interface';

export interface InventoryItem {
  productId: string;
  quantity: number;
}

export interface ValidateStockData {
  valid: boolean;
  unavailableItems: {
    productId: string;
    requestedQuantity: number;
    availableQuantity: number;
  }[];
}

export interface ReserveData {
  reservationId: string;
}
