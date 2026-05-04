import { Controller, Inject, Logger } from '@nestjs/common';
import { TOPICS } from 'libs/constants';
import {
  type ConfirmInventoryRequestDto,
  type ReleaseInventoryRequestDto,
  type ReserveInventoryRequestDto,
  type ValidateInventoryRequestDto,
} from './dtos';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiResponse,
  INVENTORY_SERVICE,
  type InventoryServiceI,
} from './interfaces';

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
  ): Promise<ApiResponse<any>> {
    return await this.inventoryService.validateStock(data.items);
  }

  @EventPattern(TOPICS.INVENTORY_RESERVE)
  async handleReserve(
    @Payload() data: ReserveInventoryRequestDto,
  ): Promise<ApiResponse<any>> {
    return await this.inventoryService.reserve(data.orderId, data.items);
  }

  @EventPattern(TOPICS.INVENTORY_RELEASE)
  async handleRelease(
    @Payload() data: ReleaseInventoryRequestDto,
  ): Promise<ApiResponse<void>> {
    if (data.reservationId) {
      return await this.inventoryService.release(data.reservationId);
    } else if (data.orderId) {
      return await this.inventoryService.releaseByOrderId(data.orderId);
    }
    return {
      success: false,
      error: 'Either reservationId or orderId is required',
    };
  }

  @EventPattern(TOPICS.INVENTORY_CONFIRM)
  async handleConfirm(
    @Payload() data: ConfirmInventoryRequestDto,
  ): Promise<ApiResponse<void>> {
    return await this.inventoryService.confirm(data.reservationId);
  }
}
