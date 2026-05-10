export interface InventoryItem {
  productId: string; // SKU in this context
  quantity: number;
}

export interface InventoryReservation {
  id: string;
  orderId: string;
  status: 'PENDING' | 'CONFIRMED' | 'RELEASED';
  items: InventoryItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryRepositoryI {
  createReservation(
    orderId: string,
    items: InventoryItem[],
  ): Promise<{ id: string }>;

  findReservationById(id: string): Promise<InventoryReservation | null>;

  findReservationByOrderId(
    orderId: string,
  ): Promise<InventoryReservation | null>;

  updateReservationStatus(
    id: string,
    status: 'PENDING' | 'CONFIRMED' | 'RELEASED',
  ): Promise<void>;
  releaseReservation(id: string): Promise<void>;
}

export const INVENTORY_REPOSITORY = Symbol('INVENTORY_REPOSITORY');
