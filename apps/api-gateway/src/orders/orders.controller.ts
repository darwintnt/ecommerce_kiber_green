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
} from '@nestjs/common';
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
  OrderResponseDto,
} from './dto/order-request.dto';
import { randomUUID } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { ORDER_CLIENT_PROXY, TOPICS } from 'libs/constants';
import { PaginatedResult, PaginationDto } from 'libs/commons/pagination.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(`${OrdersController.name}_AG`);

  constructor(
    @Inject(ORDER_CLIENT_PROXY) private readonly client: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiParam({
    name: 'page',
    description: 'Number page',
    required: false,
    example: 1,
  })
  @ApiParam({
    name: 'limit',
    description: 'Limit',
    required: false,
    example: 10,
  })
  @ApiParam({ name: 'search', description: 'Value to search', required: false })
  @ApiHeader({ name: 'x-correlation-id', required: false })
  @ApiResponse({
    status: 200,
    description: 'List of orders',
    type: [OrderResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Orders not found' })
  async findAllOrders(
    @Body() query: PaginationDto,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<PaginatedResult<OrderResponseDto[]>> {
    const corrId = correlationId || this.generateCorrelationId();

    const data = {
      detail: { ...query },
      headers: { 'x-correlation-id': corrId },
    };

    try {
      return await firstValueFrom(
        this.client.send(TOPICS.ORDERS_GET_ALL, data),
      );
    } catch (error) {
      const err = error as Error;
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get orders: ${err.message}`);
      throw new BadRequestException(`Failed to get orders: ${err.message}`);
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
      return await firstValueFrom(this.client.send(TOPICS.ORDERS_GET, data));
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
      return firstValueFrom(this.client.send(TOPICS.ORDERS_CREATE, data));
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
      return firstValueFrom(this.client.send(TOPICS.ORDERS_CANCEL, data));
    } catch (error) {
      const err = error as Error;
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to cancel order ${orderId}: ${err.message}`);
      throw new BadRequestException(`Failed to cancel order: ${err.message}`);
    }
  }

  private generateCorrelationId(): string {
    return randomUUID();
  }
}
