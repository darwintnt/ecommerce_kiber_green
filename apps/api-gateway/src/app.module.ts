import { MiddlewareConsumer, Module } from '@nestjs/common';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ProductsModule } from './products/products.module';
import { CorrelationIdMiddleware } from './middlewares/correlation-id.middleware';

@Module({
  imports: [InventoryModule, OrdersModule, PaymentsModule, ProductsModule],
  controllers: [],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
