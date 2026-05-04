import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetOrderQuery } from './get-order.query';
import { Inject } from '@nestjs/common';
import {
  ORDER_REPOSITORY,
  type OrderRepositoryI,
} from '../../interfaces/orders-repository.interface';
import { RpcException } from '@nestjs/microservices';

@QueryHandler(GetOrderQuery)
export class GetOrderHandler implements IQueryHandler<GetOrderQuery> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly repository: OrderRepositoryI,
  ) {}

  async execute(query: GetOrderQuery) {
    const readModel = await this.repository.findById(
      query.query.detail.orderId,
    );

    if (!readModel) {
      throw new RpcException('Order not found');
    }

    return readModel;
  }
}
