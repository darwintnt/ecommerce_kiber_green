import { Product } from '../../generated/prisma/client';
import { PaginatedResult } from 'libs/commons/pagination.dto';
import { ProductEntity } from '../domain/product';

export interface CreateProductDto {
  sku: string;
  name: string;
  price: number;
  stock?: number;
}

export interface UpdateProductDto {
  name?: string;
  price?: number;
  stock?: number;
  reserved?: number;
}

export interface ProductData {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  reserved: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductListData {
  products: ProductData[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductRepositoryI {
  findById(id: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  create(dto: ProductEntity): Promise<Product>;
  findAll(
    page: number,
    limit: number,
    search: string,
    conditions?: Record<string, any>,
  ): Promise<PaginatedResult<Product>>;
  update(id: string, dto: UpdateProductDto): Promise<Product>;
  updateReserved(sku: string, reservedDelta: number): Promise<void>;
  decrementStock(sku: string, quantity: number): Promise<void>;
  delete(id: string): Promise<void>;
}

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');
