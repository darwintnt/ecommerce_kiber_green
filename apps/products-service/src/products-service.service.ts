import { Inject, Injectable } from '@nestjs/common';
import type { ProductServiceI, ProductRepositoryI } from './interfaces';
import { ProductData, PRODUCT_REPOSITORY } from './interfaces';
import { ApiResponse } from 'libs/interfaces/api-response.interface';
import { PaginatedResult } from 'libs/commons/pagination.dto';
import { Product } from '../generated/prisma/client';
import { ProxyContextI } from 'libs/interfaces/proxy-context.interface';
import { ProductEntity, ProductProps } from './domain/product';

@Injectable()
export class ProductsService implements ProductServiceI {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryI,
  ) {}

  async findAll(
    query: ProxyContextI,
  ): Promise<ApiResponse<PaginatedResult<Product>>> {
    try {
      const { page, limit, search, conditions } = query.detail;
      const data = await this.productRepository.findAll(
        page,
        limit,
        search,
        conditions,
      );
      return { success: true, data: data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async findById(query: ProxyContextI): Promise<ApiResponse<ProductData>> {
    try {
      const product = await this.productRepository.findById(
        query.detail.productId,
      );
      if (!product) {
        return { success: false, error: 'Product not found' };
      }
      return {
        success: true,
        data: this.mapProductToData(product),
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async findBySku(query: ProxyContextI): Promise<ApiResponse<ProductData>> {
    try {
      const product = await this.productRepository.findBySku(query.detail.sku);
      if (!product) {
        return { success: false, error: 'Product not found' };
      }
      return {
        success: true,
        data: this.mapProductToData(product),
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async create(query: ProxyContextI): Promise<ApiResponse<ProductData>> {
    try {
      const data = new ProductEntity({
        name: query.detail.name as string,
        price: query.detail.price as number,
        stock: query.detail.stock as number,
      } as ProductProps);

      data.generateSku();

      const product = await this.productRepository.create(data);
      return {
        success: true,
        data: this.mapProductToData(product),
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async update(query: ProxyContextI): Promise<ApiResponse<ProductData>> {
    try {
      const product = await this.productRepository.findById(
        query.detail.productId,
      );

      if (!product) {
        return { success: false, error: 'Product not found' };
      }

      const updatedProduct = await this.productRepository.update(
        query.detail.productId,
        { ...query.detail },
      );
      return {
        success: true,
        data: this.mapProductToData(updatedProduct),
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async delete(query: ProxyContextI): Promise<ApiResponse<void>> {
    try {
      const product = await this.productRepository.findById(
        query.detail.productId,
      );

      if (!product) {
        return { success: false, error: 'Product not found' };
      }

      await this.productRepository.delete(query.detail.productId);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private mapProductToData(product: any): ProductData {
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      price: Number(product.price),
      stock: product.stock,
      reserved: product.reserved,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
