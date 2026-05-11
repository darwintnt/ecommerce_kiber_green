import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @ApiProperty({ description: 'Product ID', example: 'prod_123' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Quantity to order', example: 2 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Price per unit', example: 29.99 })
  @IsNumber()
  price: number;
}

export class CreateOrderRequestDto {
  @ApiProperty({ description: 'Customer ID', example: 'cust_abc123' })
  @IsString()
  customerId: string;

  @ApiProperty({
    description: 'Order items',
    type: [CreateOrderItemDto],
    example: [
      { productId: 'prod_123', quantity: 2, price: 29.99 },
      { productId: 'prod_456', quantity: 1, price: 49.99 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

export class OrderResponseDto {
  @ApiProperty({ description: 'Order ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Order status', example: 'pending' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Total amount', example: 109.97 })
  @IsNumber()
  total: number;

  @ApiProperty({ description: 'Order items', type: [CreateOrderItemDto] })
  @IsArray()
  items: CreateOrderItemDto[];

  @ApiPropertyOptional({ description: 'Created at' })
  @IsOptional()
  @IsString()
  createdAt?: string;

  @ApiPropertyOptional({ description: 'Updated at' })
  @IsOptional()
  @IsString()
  updatedAt?: string;
}

export class GetOrderRequestDto {
  @ApiProperty({ description: 'Order ID' })
  @IsString()
  orderId: string;
}

export class ListOrdersRequestDto {
  @ApiPropertyOptional({ description: 'Filter by customer ID' })
  @IsOptional()
  @IsString()
  customerId?: string;
}

export class CancelOrderRequestDto {
  @ApiProperty({ description: 'Order ID' })
  @IsString()
  orderId: string;
}
