import { Controller, Inject, Logger } from '@nestjs/common';
import { TOPICS } from 'libs/constants';
import { MessagePattern, EventPattern, Payload } from '@nestjs/microservices';
import { ApiResponse } from 'libs/interfaces/api-response.interface';
import { PRODUCT_SERVICE, type ProductServiceI } from './interfaces';
import { type ProxyContextI } from 'libs/interfaces/proxy-context.interface';

@Controller()
export class ProductsServiceController {
  private readonly logger = new Logger(ProductsServiceController.name);

  constructor(
    @Inject(PRODUCT_SERVICE)
    private readonly productService: ProductServiceI,
  ) {}

  @MessagePattern(TOPICS.PRODUCT_GET_ALL)
  async handleGetAll(
    @Payload() query: ProxyContextI,
  ): Promise<ApiResponse<any>> {
    return this.productService.findAll(query);
  }

  @MessagePattern(TOPICS.PRODUCT_CREATE)
  async handleCreate(
    @Payload() query: ProxyContextI,
  ): Promise<ApiResponse<any>> {
    this.logger.log(`Creating product with SKU: ${query.detail.sku}`);
    return await this.productService.create(query);
  }

  @MessagePattern(TOPICS.PRODUCT_GET)
  async handleGetById(
    @Payload() query: ProxyContextI,
  ): Promise<ApiResponse<any>> {
    this.logger.log(`Getting product by ID: ${query.detail.id}`);
    return this.productService.findById(query);
  }

  @MessagePattern(TOPICS.PRODUCT_GET_BY_SKU)
  async handleGetBySku(
    @Payload() query: ProxyContextI,
  ): Promise<ApiResponse<any>> {
    this.logger.log(`Getting product by SKU: ${query.detail.sku}`);
    return this.productService.findBySku(query);
  }

  @MessagePattern(TOPICS.PRODUCT_UPDATE)
  async handleUpdate(
    @Payload() query: ProxyContextI,
  ): Promise<ApiResponse<any>> {
    this.logger.log(`Updating product: ${query.detail.id}`);
    return this.productService.update(query);
  }

  @MessagePattern(TOPICS.PRODUCT_DELETE)
  async handleDelete(
    @Payload() query: ProxyContextI,
  ): Promise<ApiResponse<void>> {
    this.logger.log(`Deleting product: ${query.detail.id}`);
    return this.productService.delete(query);
  }

  @EventPattern(TOPICS.INVENTORY_STOCK_RESERVED)
  async handleStockReserved(
    @Payload()
    data: {
      detail: { items: { productId: string; quantity: number }[] };
    },
  ): Promise<void> {
    this.logger.log(`Handling INVENTORY_STOCK_RESERVED event`);
    await this.productService.handleStockReserved(data.detail.items);
  }

  @EventPattern(TOPICS.INVENTORY_STOCK_RELEASED)
  async handleStockReleased(
    @Payload()
    data: {
      detail: { items: { productId: string; quantity: number }[] };
    },
  ): Promise<void> {
    this.logger.log(`Handling INVENTORY_STOCK_RELEASED event`);
    await this.productService.handleStockReleased(data.detail.items);
  }

  @EventPattern(TOPICS.INVENTORY_STOCK_CONFIRMED)
  async handleStockConfirmed(
    @Payload()
    data: {
      detail: { items: { productId: string; quantity: number }[] };
    },
  ): Promise<void> {
    this.logger.log(`Handling INVENTORY_STOCK_CONFIRMED event`);
    await this.productService.handleStockConfirmed(data.detail.items);
  }
}
