import { Module } from '@nestjs/common';
import { OrdersServiceController } from './orders-service.controller';
import { OrdersServiceService } from './orders-service.service';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/envs';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      envFilePath: ['apps/orders-service/.env'],
    }),
  ],
  controllers: [OrdersServiceController],
  providers: [OrdersServiceService],
})
export class OrdersServiceModule {}
