import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetOrderQuery } from './get-order.query';
import { Inject } from '@nestjs/common';
import {
  ORDER_REPOSITORY,
  type OrderRepositoryI,
} from '../../interfaces/orders-repository.interface';

@QueryHandler(GetOrderQuery)
export class GetOrderHandler implements IQueryHandler<GetOrderQuery> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly repository: OrderRepositoryI,
  ) {}

  async execute(query: GetOrderQuery) {
    try {
      const order = await this.repository.findById(query.query.detail.orderId);

      if (!order) {
        return { success: true, data: null };
      }

      return { success: true, data: order };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}
