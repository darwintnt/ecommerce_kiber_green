import { NestFactory } from '@nestjs/core';
import { PaymentsServiceModule } from './payments-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { PAYMENT_QUEUE } from 'libs/constants';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('PAYMENTS-SERVICE');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PaymentsServiceModule,
    {
      transport: Transport.NATS,
      options: {
        servers: [process.env['NATS_URL'] || 'nats://localhost:4222'],
        queue: PAYMENT_QUEUE,
      },
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen();

  logger.log(`🏦 Payments Service Application is listening...`);
}
bootstrap();
