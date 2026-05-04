/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { OrdersServiceI } from './interfaces/orders-service.interface';
import { Order } from '../generated/prisma/client';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetOrderQuery } from './queries/get-order/get-order.query';
import { ProxyContextI } from 'libs/interfaces/proxy-context.interface';
import { GetOrdersQuery } from './queries/get-orders/get-orders.query';
import { CreateOrderCommand } from './commands/create-order/create-order.command';
import { CancelOrderCommand } from './commands/cancel-order/cancel-order.command';
import { ApiResponse } from 'libs/interfaces/api-response.interface';
import { CreateOrderData } from './interfaces/orders-service.interface';
import { PaginatedResult } from 'libs/commons/pagination.dto';

@Injectable()
export class OrdersService implements OrdersServiceI {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async findAllOrders(
    query: ProxyContextI,
  ): Promise<ApiResponse<PaginatedResult<Order>>> {
    return this.queryBus.execute(new GetOrdersQuery(query));
  }

  async findOneOrder(query: ProxyContextI): Promise<ApiResponse<Order | null>> {
    const order = await this.queryBus.execute(new GetOrderQuery(query));
    return { success: true, data: order.data };
  }

  async createOrder(
    query: ProxyContextI,
  ): Promise<ApiResponse<CreateOrderData>> {
    const order = await this.commandBus.execute(new CreateOrderCommand(query));
    return { success: true, data: { orderId: order.data.orderId } };
  }

  async cancelOrder(query: ProxyContextI): Promise<ApiResponse<void>> {
    return this.commandBus.execute(
      new CancelOrderCommand(query.detail.orderId as string),
    );
  }
}
