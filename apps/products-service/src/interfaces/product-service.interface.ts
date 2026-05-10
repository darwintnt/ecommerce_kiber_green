import { ApiResponse } from 'libs/interfaces/api-response.interface';
import { ProductData } from './product-repository.interface';
import { PaginatedResult } from 'libs/commons/pagination.dto';
import { Product } from '../../generated/prisma/client';
import { ProxyContextI } from 'libs/interfaces/proxy-context.interface';

export interface ProductServiceI {
  create(query: ProxyContextI): Promise<ApiResponse<ProductData>>;
  findById(query: ProxyContextI): Promise<ApiResponse<ProductData>>;
  findBySku(query: ProxyContextI): Promise<ApiResponse<ProductData>>;
  findAll(query: ProxyContextI): Promise<ApiResponse<PaginatedResult<Product>>>;
  update(query: ProxyContextI): Promise<ApiResponse<ProductData>>;
  delete(query: ProxyContextI): Promise<ApiResponse<void>>;
  // Event handlers for inventory events
  handleStockReserved(
    items: { productId: string; quantity: number }[],
  ): Promise<void>;
  handleStockReleased(
    items: { productId: string; quantity: number }[],
  ): Promise<void>;
  handleStockConfirmed(
    items: { productId: string; quantity: number }[],
  ): Promise<void>;
}

export const PRODUCT_SERVICE = Symbol('PRODUCT_SERVICE');
