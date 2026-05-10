import { Module } from '@nestjs/common';
import { ProductsServiceController } from './products-service.controller';
import { ProductsService } from './products-service.service';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/envs';
import { PrismaService } from './prisma.service';
import { ProductRepository } from './products.service.repository';
import { PRODUCT_REPOSITORY, PRODUCT_SERVICE } from './interfaces';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      envFilePath: ['apps/products-service/.env'],
    }),
  ],
  controllers: [ProductsServiceController],
  providers: [
    {
      provide: PRODUCT_SERVICE,
      useClass: ProductsService,
    },
    {
      provide: PRODUCT_REPOSITORY,
      useClass: ProductRepository,
    },
    {
      provide: 'DATABASE_SERVICE',
      useClass: PrismaService,
    },
  ],
})
export class ProductsServiceModule {}
