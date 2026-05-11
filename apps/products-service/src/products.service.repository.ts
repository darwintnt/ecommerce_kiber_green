import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { UpdateProductDto, ProductRepositoryI } from './interfaces';
import { Product } from '../generated/prisma/client';
import { PaginatedResult } from 'libs/commons/pagination.dto';
import { ProductEntity } from './domain/product';

@Injectable()
export class ProductRepository implements ProductRepositoryI {
  constructor(
    @Inject('DATABASE_SERVICE') private readonly prisma: PrismaService,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    conditions?: Record<string, any>,
  ): Promise<PaginatedResult<Product>> {
    const skip = (page - 1) * limit;

    const where = {
      ...conditions,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { id } });
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { sku } });
  }

  async create(dto: ProductEntity): Promise<Product> {
    return this.prisma.product.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async updateReserved(sku: string, reservedDelta: number): Promise<void> {
    // Atomic update to avoid race conditions
    const result = await this.prisma.product.updateMany({
      where: {
        sku,
        // Only update if the result won't be negative
        reserved:
          reservedDelta >= 0 ? undefined : { gte: Math.abs(reservedDelta) },
      },
      data: {
        reserved: { increment: reservedDelta },
      },
    });

    if (result.count === 0) {
      throw new Error(
        `Product with SKU ${sku} not found or insufficient reserved stock`,
      );
    }
  }

  async decrementStock(sku: string, quantity: number): Promise<void> {
    const result = await this.prisma.product.updateMany({
      where: {
        sku,
        AND: [{ stock: { gte: quantity } }, { reserved: { gte: quantity } }],
      },
      data: {
        stock: { decrement: quantity },
        reserved: { decrement: quantity },
      },
    });

    if (result.count === 0) {
      throw new Error(
        `Product with SKU ${sku} not found or insufficient stock/reserved for confirmation`,
      );
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }
}
