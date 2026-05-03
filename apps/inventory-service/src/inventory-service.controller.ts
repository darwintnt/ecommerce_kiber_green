import { Controller, Inject, Logger } from '@nestjs/common';
import {
  INVENTORY_CONFIRM,
  INVENTORY_RELEASE,
  INVENTORY_RESERVE,
  INVENTORY_VALIDATE,
} from 'libs/constants';
import {
  type ConfirmInventoryRequestDto,
  type ReleaseInventoryRequestDto,
  type ReserveInventoryRequestDto,
  type ReserveInventoryResponseDto,
  type ValidateInventoryRequestDto,
  type ValidateInventoryResponseDto,
} from './dtos';
import { Ctx, EventPattern, NatsContext, Payload } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Inventory')
@Controller()
export class InventoryServiceController {
  private readonly logger = new Logger(InventoryServiceController.name);

  constructor(
    @Inject(INVENTORY_SERVICE)
    private readonly inventoryService: InventoryServiceI,
  ) {}

  @EventPattern(INVENTORY_VALIDATE)
  async handleValidate(
    @Payload() data: ValidateInventoryRequestDto,
    @Ctx() context: NatsContext,
  ): Promise<ValidateInventoryResponseDto> {
    const result = await this.inventoryService.validateStock(data.items);

    return {
      valid: result.valid,
      orderId: data.orderId,
      unavailableItems:
        result.unavailableItems.length > 0
          ? result.unavailableItems
          : undefined,
    };
  }

  @EventPattern(INVENTORY_RESERVE)
  async handleReserve(
    @Payload() data: ReserveInventoryRequestDto,
    @Ctx() context: NatsContext,
  ): Promise<ReserveInventoryResponseDto> {
    const result = await this.inventoryService.reserve(
      data.orderId,
      data.items,
    );

    return {
      reserved: result.reserved,
      orderId: data.orderId,
      reservationId: result.reservationId,
      reason: result.reason,
    };
  }

  @EventPattern(INVENTORY_RELEASE)
  async handleRelease(
    @Payload() data: ReleaseInventoryRequestDto,
    @Ctx() context: NatsContext,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (data.reservationId) {
        await this.inventoryService.release(data.reservationId);
      } else if (data.orderId) {
        await this.inventoryService.releaseByOrderId(data.orderId);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  @EventPattern(INVENTORY_CONFIRM)
  async handleConfirm(
    @Payload() data: ConfirmInventoryRequestDto,
    @Ctx() context: NatsContext,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.inventoryService.confirm(data.reservationId);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}
