import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetOrdersQuery } from './get-orders.query';
import { Inject } from '@nestjs/common';
import {
  ORDER_REPOSITORY,
  type OrderRepositoryI,
} from '../../interfaces/orders-repository.interface';
import { PaginatedResult } from 'libs/commons/pagination.dto';
import { Order } from '../../../generated/prisma/client';

@QueryHandler(GetOrdersQuery)
export class GetOrdersHandler implements IQueryHandler<GetOrdersQuery> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly repository: OrderRepositoryI,
  ) {}

  async execute(query: GetOrdersQuery): Promise<PaginatedResult<Order>> {
    const { page, limit, search, conditions } = query.query.detail;
    return this.repository.findAll(page, limit, search, conditions);
  }
}
