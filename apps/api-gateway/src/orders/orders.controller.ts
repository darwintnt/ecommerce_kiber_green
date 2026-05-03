import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Headers,
  Logger,
  Inject,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  Query,
} from '@nestjs/common';

import {
  ORDER_SERVICE,
  ORDERS_CANCEL,
  ORDERS_CREATE,
  ORDERS_GET,
} from '../constants';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateOrderRequestDto,
  ListOrdersRequestDto,
  OrderResponseDto,
} from './dto/order-request.dto';
import { randomUUID } from 'crypto';
import { firstValueFrom } from 'rxjs';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(@Inject(ORDER_SERVICE) private readonly client: ClientProxy) {}

  @Get()
  @ApiOperation({ summary: 'List orders with optional customer filter' })
  @ApiHeader({ name: 'x-correlation-id', required: false })
  @ApiResponse({
    status: 200,
    description: 'List of orders',
    type: [OrderResponseDto],
  })
  async findAllOrders(
    @Query() query: ListOrdersRequestDto,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<OrderResponseDto[]> {
    const corrId = correlationId || this.generateCorrelationId();

    const data = {
      detail: { customerId: query.customerId, correlationId: corrId },
      headers: { 'x-correlation-id': corrId },
      list: true,
    };

    try {
      const result = firstValueFrom(this.client.send(ORDERS_GET, data));

      const orders = Array.isArray(result)
        ? result
        : (result as any).orders || [];

      return orders.map((order: any) =>
        this.transformToOrderResponse(order, corrId),
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to list orders: ${err.message}`);
      throw new BadRequestException(`Failed to list orders: ${err.message}`);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiHeader({ name: 'x-correlation-id', required: false })
  @ApiResponse({
    status: 200,
    description: 'Order found',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOneOrder(
    @Param('id') orderId: string,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<OrderResponseDto> {
    const corrId = correlationId || this.generateCorrelationId();

    const data = {
      detail: { orderId, correlationId: corrId },
      headers: { 'x-correlation-id': corrId },
    };

    try {
      const result = firstValueFrom(this.client.send(ORDERS_GET, data));

      if (!result || (result as any).error) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }

      return this.transformToOrderResponse(result, corrId);
    } catch (error) {
      const err = error as Error;
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get order ${orderId}: ${err.message}`);
      throw new BadRequestException(`Failed to get order: ${err.message}`);
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiHeader({
    name: 'x-correlation-id',
    required: false,
    description: 'Correlation ID for distributed tracing',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Order created successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createOrder(
    @Body() createOrderDto: CreateOrderRequestDto,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<OrderResponseDto> {
    const corrId = correlationId || this.generateCorrelationId();
    this.logger.log(`Creating order with correlationId: ${corrId}`);

    const data = {
      detail: {
        ...createOrderDto,
        correlationId: corrId,
      },
      headers: { 'x-correlation-id': corrId },
    };

    try {
      const result = firstValueFrom(this.client.send(ORDERS_CREATE, data));

      return this.transformToOrderResponse(result, corrId);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to create order: ${err.message}`, err.stack);
      throw new BadRequestException(`Failed to create order: ${err.message}`);
    }
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiHeader({ name: 'x-correlation-id', required: false })
  @ApiResponse({
    status: 200,
    description: 'Order cancelled successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled' })
  async cancelOrder(
    @Param('id') orderId: string,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<OrderResponseDto> {
    const corrId = correlationId || this.generateCorrelationId();

    const data = {
      detail: { orderId, correlationId: corrId },
      headers: { 'x-correlation-id': corrId },
    };

    try {
      const result = firstValueFrom(this.client.send(ORDERS_CANCEL, data));

      if (!result || (result as any).error) {
        throw new BadRequestException(
          `Cannot cancel order ${orderId}: ${(result as any).error}`,
        );
      }

      return this.transformToOrderResponse(result, corrId);
    } catch (error) {
      const err = error as Error;
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to cancel order ${orderId}: ${err.message}`);
      throw new BadRequestException(`Failed to cancel order: ${err.message}`);
    }
  }

  private transformToOrderResponse(
    data: any,
    correlationId: string,
  ): OrderResponseDto {
    return {
      id: data.orderId || data.id || '',
      customerId: data.customerId || '',
      status: data.status || 'unknown',
      total: data.total || 0,
      items: data.items || [],
      shippingAddress: data.shippingAddress || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  private generateCorrelationId(): string {
    return randomUUID();
  }
}
