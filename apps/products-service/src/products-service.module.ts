import { Module } from '@nestjs/common';
import { ProductsServiceController } from './products-service.controller';
import { ProductsServiceService } from './products-service.service';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/envs';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      envFilePath: ['apps/products-service/.env'],
    }),
  ],
  controllers: [ProductsServiceController],
  providers: [ProductsServiceService],
})
export class ProductsServiceModule {}
