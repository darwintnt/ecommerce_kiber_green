import { ProxyContextI } from 'libs/interfaces/proxy-context.interface';
import { Order } from '../../generated/prisma/client';

export interface OrdersServiceI {
  findAllOrders(query: ProxyContextI): Promise<any>;
  findOneOrder(query: ProxyContextI): Promise<Order | null>;
  createOrder(query: ProxyContextI): Promise<Order>;
  cancelOrder(query: ProxyContextI): Promise<any>;
}

export const ORDER_SERVICE = Symbol('ORDER_SERVICE');
