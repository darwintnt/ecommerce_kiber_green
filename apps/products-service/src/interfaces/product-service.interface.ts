import { ApiResponse } from 'libs/interfaces/api-response.interface';
import { ProductData } from './product-repository.interface';
import { PaginatedResult } from 'libs/commons/pagination.dto';
import { Product } from 'apps/products-service/generated/prisma/client';
import { ProxyContextI } from 'libs/interfaces/proxy-context.interface';

export interface ProductServiceI {
  findAll(query: ProxyContextI): Promise<ApiResponse<PaginatedResult<Product>>>;
  findById(query: ProxyContextI): Promise<ApiResponse<ProductData>>;
  findBySku(query: ProxyContextI): Promise<ApiResponse<ProductData>>;
  create(query: ProxyContextI): Promise<ApiResponse<ProductData>>;
  update(query: ProxyContextI): Promise<ApiResponse<ProductData>>;
  delete(query: ProxyContextI): Promise<ApiResponse<void>>;
}

export const PRODUCT_SERVICE = Symbol('PRODUCT_SERVICE');
