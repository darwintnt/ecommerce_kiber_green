import { ProxyContextI } from 'libs/interfaces/proxy-context.interface';
import { Order } from '../../generated/prisma/client';
import { ApiResponse } from 'libs/interfaces/api-response.interface';
import { PaginatedResult } from 'libs/commons/pagination.dto';

export interface CreateOrderData {
  orderId: string;
}

export interface OrdersServiceI {
  findAllOrders(
    query: ProxyContextI,
  ): Promise<ApiResponse<PaginatedResult<Order>>>;
  findOneOrder(query: ProxyContextI): Promise<ApiResponse<Order | null>>;
  createOrder(query: ProxyContextI): Promise<ApiResponse<CreateOrderData>>;
  cancelOrder(query: ProxyContextI): Promise<ApiResponse<void>>;
}

export const ORDER_SERVICE = Symbol('ORDER_SERVICE');
