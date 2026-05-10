import { ApiResponse } from 'libs/interfaces/api-response.interface';

export interface ProductInfo {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  reserved: number;
}

export interface ProductServiceClientI {
  getProductBySku(sku: string): Promise<ApiResponse<ProductInfo>>;
  getProductById(id: string): Promise<ApiResponse<ProductInfo>>;
}

export const PRODUCT_SERVICE_CLIENT = Symbol('PRODUCT_SERVICE_CLIENT');
