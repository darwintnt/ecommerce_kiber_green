import { CreateOrderHandler } from './create-order/create-order.handler';
import { CancelOrderHandler } from './cancel-order/cancel-order.handler';

export const OrdersCommandHandlers = [CreateOrderHandler, CancelOrderHandler];
