/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { SagaStep } from '../saga-step.interface';
import { ClientProxy } from '@nestjs/microservices';
import { INVENTORY_CLIENT_PROXY, TOPICS } from 'libs/constants';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class InventoryValidateStep implements SagaStep {
  private readonly logger = new Logger(InventoryValidateStep.name);

  constructor(
    @Inject(INVENTORY_CLIENT_PROXY)
    private readonly inventoryClient: ClientProxy,
  ) {}

  getName(): string {
    return 'Inventory Validate Step';
  }

  async execute(context: any): Promise<boolean> {
    const { order } = context;

    this.logger.log(
      `[${this.getName()}] Validating inventory for order ${order.id}`,
    );

    const response = await firstValueFrom(
      this.inventoryClient.send(TOPICS.INVENTORY_VALIDATE, {
        orderId: order.id,
        items: order.items,
      }),
    );

    if (response.success && response.data?.valid) {
      this.logger.log(`[${this.getName()}] Inventory validation passed`);
      return Promise.resolve(true);
    }

    const unavailableItems = response.data?.unavailableItems || [];
    const productIds = unavailableItems
      .map((item: any) => item.productId)
      .join(', ');

    const errorMsg = productIds
      ? `No inventory available for product(s): ${productIds}`
      : 'No inventory available for the requested items';

    context.errorMessage = errorMsg;

    this.logger.warn(
      `[${this.getName()}] Inventory validation failed: ${errorMsg}`,
    );
    return Promise.resolve(false);
  }

  async compensate(context: any): Promise<void> {
    const { order } = context;
    this.logger.log(`[${this.getName()}] No compensation needed`);
    this.logger.log(
      `[Compensate][${this.getName()}]: Inventory release failed': ${order.reservationId}`,
    );
  }
}
