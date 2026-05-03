export interface InventoryItem {
  productId: string;
  quantity: number;
}

interface InventoryReservation {
  id: string;
  orderId: string;
  status: 'PENDING' | 'CONFIRMED' | 'RELEASED';
  items: InventoryItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryRepositoryI {
  findProductBySku(sku: string): Promise<{
    id: string;
    sku: string;
    stock: number;
    reserved: number;
  } | null>;

  updateStock(
    productId: string,
    stockDelta: number,
    reservedDelta: number,
  ): Promise<void>;

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
