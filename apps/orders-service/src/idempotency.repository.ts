import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from './prisma.service';
import {
  CreateIdempotencyKeyDto,
  IdempotencyKeyData,
  IdempotencyRepositoryI,
} from './interfaces/idempotency-repository.interface';

@Injectable()
export class IdempotencyRepository implements IdempotencyRepositoryI {
  constructor(
    @Inject('DATABASE_SERVICE') private readonly prisma: PrismaService,
  ) {}

  async findByKey(key: string): Promise<IdempotencyKeyData | null> {
    const record = await this.prisma.idempotencyKey.findUnique({
      where: { key },
    });
    if (!record) return null;
    return {
      id: record.id,
      key: record.key,
      response: record.response as Record<string, any>,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
    };
  }

  async create(dto: CreateIdempotencyKeyDto): Promise<IdempotencyKeyData> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + dto.expiresInHours);

    const record = await this.prisma.idempotencyKey.create({
      data: {
        key: dto.key,
        response: dto.response as any,
        expiresAt,
      },
    });
    return {
      id: record.id,
      key: record.key,
      response: record.response as Record<string, any>,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
    };
  }

  isExpired(key: IdempotencyKeyData): boolean {
    return new Date() > key.expiresAt;
  }
}
