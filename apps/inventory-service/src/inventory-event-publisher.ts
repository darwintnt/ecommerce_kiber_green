import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TOPICS } from 'libs/constants';
import { InventoryItem } from './interfaces';

export interface StockReservationEvent {
  orderId: string;
  reservationId: string;
  items: InventoryItem[];
}

export interface StockReleaseEvent {
  reservationId: string;
  orderId: string;
  items: InventoryItem[];
}

export interface StockConfirmEvent {
  reservationId: string;
  orderId: string;
  items: InventoryItem[];
}

@Injectable()
export class InventoryEventPublisher {
  private readonly logger = new Logger(InventoryEventPublisher.name);

  constructor(
    @Inject('INVENTORY_EVENT_PUBLISHER')
    private readonly publisher: ClientProxy,
  ) {}

  async publishStockReserved(event: StockReservationEvent): Promise<void> {
    this.logger.log(
      `Publishing STOCK_RESERVED for reservation ${event.reservationId}`,
    );
    this.publisher.emit(TOPICS.INVENTORY_STOCK_RESERVED, {
      detail: event,
      headers: {},
    });
  }

  async publishStockReleased(event: StockReleaseEvent): Promise<void> {
    this.logger.log(
      `Publishing STOCK_RELEASED for reservation ${event.reservationId}`,
    );
    this.publisher.emit(TOPICS.INVENTORY_STOCK_RELEASED, {
      detail: event,
      headers: {},
    });
  }

  async publishStockConfirmed(event: StockConfirmEvent): Promise<void> {
    this.logger.log(
      `Publishing STOCK_CONFIRMED for reservation ${event.reservationId}`,
    );
    this.publisher.emit(TOPICS.INVENTORY_STOCK_CONFIRMED, {
      detail: event,
      headers: {},
    });
  }
}
