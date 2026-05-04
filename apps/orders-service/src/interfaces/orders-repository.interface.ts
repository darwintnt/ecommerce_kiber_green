import { PaginatedResult } from 'libs/commons/pagination.dto';
import { Order } from '../../generated/prisma/client';
import { OrderStatus } from '../domain/order-status';

export interface OrderRepositoryI {
  save(order: Order): Promise<Order>;
  findAll(
    page: number,
    limit: number,
    search: string,
    conditions?: Record<string, any>,
  ): Promise<PaginatedResult<Order>>;
  findById(id: string): Promise<Order | null>;
  findByCustomerId(customerId: string): Promise<Order[]>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
  setReservation(id: string, reservationId: string): Promise<Order>;
  setPaymentTransaction(id: string, transactionId: string): Promise<Order>;
}

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');
