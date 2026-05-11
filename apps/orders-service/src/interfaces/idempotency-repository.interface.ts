export interface CreateIdempotencyKeyDto {
  key: string;
  response: Record<string, any>;
  expiresInHours: number;
}

export interface IdempotencyKeyData {
  id: string;
  key: string;
  response: Record<string, any>;
  createdAt: Date;
  expiresAt: Date;
}

export interface IdempotencyRepositoryI {
  findByKey(key: string): Promise<IdempotencyKeyData | null>;
  create(dto: CreateIdempotencyKeyDto): Promise<IdempotencyKeyData>;
  isExpired(key: IdempotencyKeyData): boolean;
}

export const IDEMPOTENCY_REPOSITORY = Symbol('IDEMPOTENCY_REPOSITORY');
