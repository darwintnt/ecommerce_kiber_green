import { OrderItem } from './order-item';
import { OrderStatus, VALID_TRANSITIONS } from './order-status';

export interface OrderProps {
  id?: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  inventoryReservationId?: string | null;
  paymentTransactionId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Order {
  public readonly id: string;
  public customerId: string;
  public items: OrderItem[];
  public total: number;
  public status: OrderStatus;
  public inventoryReservationId: string | null;
  public paymentTransactionId: string | null;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: OrderProps) {
    this.id = props.id ?? crypto.randomUUID();
    this.customerId = props.customerId;
    this.items = props.items;
    this.total = props.total;
    this.status = props.status;
    this.inventoryReservationId = props.inventoryReservationId ?? null;
    this.paymentTransactionId = props.paymentTransactionId ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  addItem(item: OrderItem): void {
    this.items.push(item);
  }

  calculateTotal(): number {
    this.total = this.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );
    return this.total;
  }

  canTransitionTo(newStatus: OrderStatus): boolean {
    const allowedTransitions = VALID_TRANSITIONS[this.status];
    return allowedTransitions.includes(newStatus);
  }

  validate(): boolean {
    if (!this.customerId || this.customerId.trim() === '') {
      return false;
    }
    if (!this.items || this.items.length === 0) {
      return false;
    }
    if (this.total < 0) {
      return false;
    }
    return true;
  }

  setReservation(reservationId: string): void {
    this.inventoryReservationId = reservationId;
    this.updatedAt = new Date();
  }

  setPaymentTransaction(transactionId: string): void {
    this.paymentTransactionId = transactionId;
    this.updatedAt = new Date();
  }

  transitionTo(newStatus: OrderStatus): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(
        `Invalid state transition from ${this.status} to ${newStatus}`,
      );
    }
    this.status = newStatus;
    this.updatedAt = new Date();
  }
}
