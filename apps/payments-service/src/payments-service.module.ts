import { Module } from '@nestjs/common';
import { PaymentsServiceController } from './payments-service.controller';
import { PaymentsServiceService } from './payments-service.service';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/envs';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      envFilePath: ['apps/payments-service/.env'],
    }),
  ],
  controllers: [PaymentsServiceController],
  providers: [PaymentsServiceService],
})
export class PaymentsServiceModule {}
