import { Controller, Inject, Logger } from '@nestjs/common';
import { TOPICS } from 'libs/constants';
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
import { INVENTORY_SERVICE, type InventoryServiceI } from './interfaces';

@ApiTags('Inventory')
@Controller()
export class InventoryServiceController {
  private readonly logger = new Logger(InventoryServiceController.name);

  constructor(
    @Inject(INVENTORY_SERVICE)
    private readonly inventoryService: InventoryServiceI,
  ) {}

  @EventPattern(TOPICS.INVENTORY_VALIDATE)
  async handleValidate(
    @Payload() data: ValidateInventoryRequestDto,
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

  @EventPattern(TOPICS.INVENTORY_RESERVE)
  async handleReserve(
    @Payload() data: ReserveInventoryRequestDto,
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

  @EventPattern(TOPICS.INVENTORY_RELEASE)
  async handleRelease(
    @Payload() data: ReleaseInventoryRequestDto,
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

  @EventPattern(TOPICS.INVENTORY_CONFIRM)
  async handleConfirm(
    @Payload() data: ConfirmInventoryRequestDto,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.inventoryService.confirm(data.reservationId);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}
