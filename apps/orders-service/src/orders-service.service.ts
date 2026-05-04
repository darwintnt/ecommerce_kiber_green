import { Injectable, Logger } from '@nestjs/common';
import { OrdersServiceI } from './interfaces/orders-service.interface';
import { Order } from '../generated/prisma/client';
import { RpcException } from '@nestjs/microservices';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetOrderQuery } from './queries/get-order/get-order.query';
import { ProxyContextI } from 'libs/interfaces/proxy-context.interface';
import { GetOrdersQuery } from './queries/get-orders/get-orders.query';
import { CreateOrderCommand } from './commands/create-order/create-order.command';

@Injectable()
export class OrdersService implements OrdersServiceI {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async findAllOrders(query: ProxyContextI): Promise<any> {
    return this.queryBus.execute(new GetOrdersQuery(query));
  }

  async findOneOrder(query: ProxyContextI): Promise<any> {
    return this.queryBus.execute(new GetOrderQuery(query));
  }

  async createOrder(query: ProxyContextI): Promise<Order> {
    return this.commandBus.execute(new CreateOrderCommand(query));
  }

  cancelOrder(query: ProxyContextI): Promise<any> {
    throw new RpcException('Method not implemented.');
  }
}
