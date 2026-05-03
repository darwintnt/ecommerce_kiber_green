import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  Inject,
  Logger,
} from '@nestjs/common';
import { INVENTORY_SERVICE, INVENTORY_VALIDATE } from '../constants';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { ValidateStockRequestDto } from './dto/validate.stock.request.dto';
import { randomUUID } from 'crypto';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(
    @Inject(INVENTORY_SERVICE) private readonly client: ClientProxy,
  ) {}

  @Get(':sku')
  @ApiOperation({ summary: 'Get product inventory by SKU' })
  @ApiParam({ name: 'sku', description: 'Product SKU' })
  @ApiHeader({ name: 'x-correlation-id', required: false })
  @ApiResponse({ status: 200, description: 'Inventory status retrieved' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getInventory(
    @Param('sku') sku: string,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<any> {
    const corrId = correlationId || this.generateCorrelationId();
    this.logger.log(`Getting inventory for SKU: ${sku}`);

    const data = {
      detail: {
        orderId: `query-${sku}`,
        items: [{ productId: sku, quantity: 1 }],
        correlationId: corrId,
      },
      headers: { 'x-correlation-id': corrId },
    };

    // Forward to inventory service - but we need to get by product ID, not SKU
    // The inventory service uses productId, so we'll query with sku as productId for now
    try {
      return firstValueFrom(this.client.send(INVENTORY_VALIDATE, data));
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to get inventory for ${sku}: ${err.message}`);
      throw error;
    }
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate stock availability' })
  @ApiHeader({ name: 'x-correlation-id', required: false })
  @ApiResponse({ status: 200, description: 'Validation result' })
  async validateStock(
    @Body() body: ValidateStockRequestDto,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<any> {
    const corrId = correlationId || this.generateCorrelationId();
    this.logger.log(`Validating stock for order: ${body.orderId}`);

    const data = {
      detail: {
        orderId: body.orderId,
        items: body.items,
        correlationId: corrId,
      },
      headers: { 'x-correlation-id': corrId },
    };

    try {
      return firstValueFrom(this.client.send(INVENTORY_VALIDATE, data));
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to validate stock: ${err.message}`);
      throw error;
    }
  }

  private generateCorrelationId(): string {
    return randomUUID();
  }
}
