import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  PRODUCT_SERVICE_CLIENT,
  type ProductServiceClientI,
  type ProductInfo,
} from './interfaces';
import { TOPICS, PRODUCT_CLIENT_PROXY } from 'libs/constants';
import { ApiResponse } from 'libs/interfaces/api-response.interface';

@Injectable()
export class ProductServiceClient implements ProductServiceClientI {
  private readonly logger = new Logger(ProductServiceClient.name);

  constructor(
    @Inject(PRODUCT_CLIENT_PROXY) private readonly productClient: ClientProxy,
  ) {}

  async getProductBySku(sku: string): Promise<ApiResponse<ProductInfo>> {
    try {
      this.logger.log(`Fetching product by SKU: ${sku}`);
      const result = await firstValueFrom(
        this.productClient.send<ApiResponse<ProductInfo>>(
          TOPICS.PRODUCT_GET_BY_SKU,
          { detail: { sku }, headers: {} },
        ),
      );
      return result;
    } catch (error) {
      this.logger.error(`Failed to get product by SKU ${sku}: ${error}`);
      return { success: false, error: (error as Error).message };
    }
  }

  async getProductById(id: string): Promise<ApiResponse<ProductInfo>> {
    try {
      this.logger.log(`Fetching product by ID: ${id}`);
      const result = await firstValueFrom(
        this.productClient.send<ApiResponse<ProductInfo>>(TOPICS.PRODUCT_GET, {
          detail: { id },
          headers: {},
        }),
      );
      return result;
    } catch (error) {
      this.logger.error(`Failed to get product by ID ${id}: ${error}`);
      return { success: false, error: (error as Error).message };
    }
  }
}
