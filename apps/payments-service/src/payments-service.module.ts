import { Module } from '@nestjs/common';
import { PaymentsServiceController } from './payments-service.controller';
import { PaymentsService } from './payments-service.service';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/envs';
import { PrismaService } from './prisma.service';
import { PAYMENT_REPOSITORY } from './interfaces/payments-repository.interface';
import { PAYMENT_SERVICE } from './interfaces/payments-service.interface';
import { PaymentsRepository } from './payments-service.repository';
import { IDEMPOTENCY_REPOSITORY } from './interfaces/idempotency-repository.interface';
import { IdempotencyRepository } from './idempotency.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      envFilePath: ['apps/payments-service/.env'],
    }),
  ],
  controllers: [PaymentsServiceController],
  providers: [
    {
      provide: PAYMENT_SERVICE,
      useClass: PaymentsService,
    },
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PaymentsRepository,
    },
    {
      provide: IDEMPOTENCY_REPOSITORY,
      useClass: IdempotencyRepository,
    },
    {
      provide: 'DATABASE_SERVICE',
      useClass: PrismaService,
    },
  ],
})
export class PaymentsServiceModule {}
