import { Controller, Inject } from '@nestjs/common';
import { TOPICS } from 'libs/constants/topics';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  ORDER_SERVICE,
  type OrdersServiceI,
} from './interfaces/orders-service.interface';
import { type ProxyContextI } from 'libs/interfaces/proxy-context.interface';
import { ApiResponse } from 'libs/interfaces/api-response.interface';
import { CreateOrderData } from './interfaces/orders-service.interface';
import { PaginatedResult } from 'libs/commons/pagination.dto';
import { Order } from '../generated/prisma/client';

@Controller()
export class OrdersServiceController {
  constructor(
    @Inject(ORDER_SERVICE) private readonly ordersService: OrdersServiceI,
  ) {}

  @MessagePattern(TOPICS.ORDERS_GET_ALL)
  async findAllOrders(
    @Payload() query: ProxyContextI,
  ): Promise<ApiResponse<PaginatedResult<Order>>> {
    return this.ordersService.findAllOrders(query);
  }

  @MessagePattern(TOPICS.ORDERS_GET)
  async findOneOrder(
    @Payload() query: ProxyContextI,
  ): Promise<ApiResponse<Order | null>> {
    return this.ordersService.findOneOrder(query);
  }

  @MessagePattern(TOPICS.ORDERS_CREATE)
  async createOrder(
    @Payload() query: ProxyContextI,
  ): Promise<ApiResponse<CreateOrderData>> {
    return this.ordersService.createOrder(query);
  }

  @MessagePattern(TOPICS.ORDERS_CANCEL)
  async cancelOrder(
    @Payload() query: ProxyContextI,
  ): Promise<ApiResponse<void>> {
    return this.ordersService.cancelOrder(query);
  }
}
