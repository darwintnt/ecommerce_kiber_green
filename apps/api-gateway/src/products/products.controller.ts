import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Logger,
  Inject,
  BadRequestException,
  Headers,
  Put,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiTags } from '@nestjs/swagger';
import { PRODUCT_CLIENT_PROXY, TOPICS } from 'libs/constants';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { PaginationDto } from 'libs/commons/pagination.dto';
import { randomUUID } from 'crypto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(`${ProductsController.name}_AG`);

  constructor(
    @Inject(PRODUCT_CLIENT_PROXY) private readonly client: ClientProxy,
  ) {}

  @Get()
  findAll(
    @Body() query: PaginationDto,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const corrId = correlationId || this.generateCorrelationId();

    const data = {
      detail: { ...query },
      headers: { 'x-correlation-id': corrId },
    };

    try {
      return firstValueFrom(this.client.send(TOPICS.PRODUCT_GET_ALL, data));
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to find all products: ${err.message}`,
        err.stack,
      );
      throw new BadRequestException(
        `Failed to find all products: ${err.message}`,
      );
    }
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const corrId = correlationId || this.generateCorrelationId();

    const data = {
      detail: {
        productId: id,
        correlationId: corrId,
      },
      headers: { 'x-correlation-id': corrId },
    };

    try {
      return firstValueFrom(this.client.send(TOPICS.PRODUCT_GET, data));
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to find product: ${err.message}`, err.stack);
      throw new BadRequestException(`Failed to find product: ${err.message}`);
    }
  }

  @Post()
  create(
    @Body() createProductDto: CreateProductDto,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const corrId = correlationId || this.generateCorrelationId();

    const data = {
      detail: {
        ...createProductDto,
        correlationId: corrId,
      },
      headers: { 'x-correlation-id': corrId },
    };

    try {
      return firstValueFrom(this.client.send(TOPICS.PRODUCT_CREATE, data));
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to create product: ${err.message}`, err.stack);
      throw new BadRequestException(`Failed to create product: ${err.message}`);
    }
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const corrId = correlationId || this.generateCorrelationId();

    const data = {
      detail: { productId: id, ...updateProductDto },
      headers: { 'x-correlation-id': corrId },
    };

    try {
      return firstValueFrom(this.client.send(TOPICS.PRODUCT_UPDATE, data));
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to update product: ${err.message}`, err.stack);
      throw new BadRequestException(`Failed to update product: ${err.message}`);
    }
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const corrId = correlationId || this.generateCorrelationId();

    const data = {
      detail: { productId: id, correlationId: corrId },
      headers: { 'x-correlation-id': corrId },
    };
    try {
      return firstValueFrom(this.client.send(TOPICS.PRODUCT_DELETE, data));
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to remove product: ${err.message}`, err.stack);
      throw new BadRequestException(`Failed to remove product: ${err.message}`);
    }
  }

  private generateCorrelationId(): string {
    return randomUUID();
  }
}
