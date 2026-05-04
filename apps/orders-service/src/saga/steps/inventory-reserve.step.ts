/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { SagaStep } from '../saga-step.interface';
import { ClientProxy } from '@nestjs/microservices';
import { INVENTORY_CLIENT_PROXY, TOPICS } from 'libs/constants';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class InventoryReserveStep implements SagaStep {
  private readonly logger = new Logger(InventoryReserveStep.name);

  constructor(
    @Inject(INVENTORY_CLIENT_PROXY)
    private readonly inventoryClient: ClientProxy,
  ) {}

  getName(): string {
    return 'Inventory Reserve Step';
  }

  async execute(context: any): Promise<boolean> {
    const { order } = context;

    const response = await firstValueFrom(
      this.inventoryClient.send(TOPICS.INVENTORY_RESERVE, {
        orderId: order.id,
        items: order.items,
      }),
    );

    if (response.success && response.data?.reservationId) {
      context.order.reservationId = response.data.reservationId;
      return Promise.resolve(true);
    }

    return Promise.resolve(false);
  }

  async compensate(context: any): Promise<void> {
    this.logger.log(`[Compensation] Inventory release`);
    const { order } = context;

    if (!order.reservationId) {
      this.logger.log(
        `[Compensate]: Nothing to compensate ${order.transactionId}`,
      );
    }

    const response = await firstValueFrom(
      this.inventoryClient.send(TOPICS.INVENTORY_RELEASE, {
        reservationId: order.reservationId,
      }),
    );

    if (response.success) {
      this.logger.log(
        `[Compensate]: compensate complete: ${order.reservationId}`,
      );
      return;
    }

    this.logger.log(
      `[Compensate]: Inventory release failed': ${order.reservationId}`,
    );
  }
}
