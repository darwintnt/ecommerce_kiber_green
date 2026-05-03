export interface InventoryItemDto {
  productId: string;
  quantity: number;
}

export interface ValidateInventoryRequestDto {
  orderId: string;
  items: InventoryItemDto[];
}

export interface ValidateInventoryResponseDto {
  valid: boolean;
  orderId: string;
  unavailableItems?: {
    productId: string;
    requestedQuantity: number;
    availableQuantity: number;
  }[];
}

export interface ReserveInventoryRequestDto {
  orderId: string;
  items: InventoryItemDto[];
}

export interface ReserveInventoryResponseDto {
  reserved: boolean;
  orderId: string;
  reservationId?: string;
  reason?: string;
}

export interface ReleaseInventoryRequestDto {
  reservationId?: string;
  orderId?: string;
}

export interface ConfirmInventoryRequestDto {
  reservationId: string;
}
