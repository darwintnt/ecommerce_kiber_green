import { Inject, Injectable } from '@nestjs/common';
import {
  CreateIdempotencyKeyDto,
  IdempotencyKeyData,
  IdempotencyRepositoryI,
} from './interfaces/idempotency-repository.interface';
import { PrismaService } from './prisma.service';

@Injectable()
export class IdempotencyRepository implements IdempotencyRepositoryI {
  constructor(
    @Inject('DATABASE_SERVICE') private readonly prisma: PrismaService,
  ) {}

  async findByKey(key: string): Promise<IdempotencyKeyData | null> {
    const result = await this.prisma.idempotencyKey.findUnique({
      where: { key },
    });
    if (!result) return null;
    return {
      id: result.id,
      key: result.key,
      response: result.response as Record<string, any>,
      createdAt: result.createdAt,
      expiresAt: result.expiresAt,
    };
  }

  async create(dto: CreateIdempotencyKeyDto): Promise<IdempotencyKeyData> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + dto.expiresInHours);

    const result = await this.prisma.idempotencyKey.create({
      data: {
        key: dto.key,
        response: dto.response,
        expiresAt,
      },
    });

    return {
      id: result.id,
      key: result.key,
      response: result.response as Record<string, any>,
      createdAt: result.createdAt,
      expiresAt: result.expiresAt,
    };
  }

  isExpired(key: IdempotencyKeyData): boolean {
    return new Date() > key.expiresAt;
  }
}
