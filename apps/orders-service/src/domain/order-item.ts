export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface CreateOrderDetail {
  id?: string;
  customerId: string;
  items: OrderItem[];
  reservationId?: string | null;
}

export interface CreateOrder {
  order: CreateOrderDetail;
}
