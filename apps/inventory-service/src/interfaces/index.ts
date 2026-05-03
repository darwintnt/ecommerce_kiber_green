export * from './inventory-repository.interface';
export * from './inventory-service.interface';

export interface InventoryItem {
  productId: string;
  quantity: number;
}

export interface ValidateStockResult {
  valid: boolean;
  unavailableItems: {
    productId: string;
    requestedQuantity: number;
    availableQuantity: number;
  }[];
}

export interface ReserveResult {
  reserved: boolean;
  reservationId?: string;
  reason?: string;
}
