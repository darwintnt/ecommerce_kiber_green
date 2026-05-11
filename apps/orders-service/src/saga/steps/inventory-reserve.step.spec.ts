import { Test, TestingModule } from '@nestjs/testing';
import { InventoryReserveStep } from './inventory-reserve.step';
import { INVENTORY_CLIENT_PROXY, TOPICS } from 'libs/constants';
import { of } from 'rxjs';

jest.mock('libs/constants', () => ({
  INVENTORY_CLIENT_PROXY: 'INVENTORY_CLIENT_PROXY',
  TOPICS: {
    INVENTORY_RESERVE: 'inventory.reserve',
    INVENTORY_RELEASE: 'inventory.release',
  },
}));

describe('InventoryReserveStep', () => {
  let step: InventoryReserveStep;
  let mockClient: any;

  beforeEach(async () => {
    mockClient = {
      send: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryReserveStep,
        { provide: INVENTORY_CLIENT_PROXY, useValue: mockClient },
      ],
    }).compile();

    step = module.get<InventoryReserveStep>(InventoryReserveStep);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return true and set reservationId on success', async () => {
      mockClient.send.mockReturnValue(
        of({
          success: true,
          data: { reservationId: 'res_123' },
        }),
      );

      const context = {
        order: {
          id: 'order_123',
          items: [{ productId: 'prod_1', quantity: 2 }],
        },
      };

      const result = await step.execute(context);

      expect(result).toBe(true);
      expect(context.order.reservationId).toBe('res_123');
    });

    it('should return false when reservation fails', async () => {
      mockClient.send.mockReturnValue(
        of({
          success: false,
          error: 'Insufficient stock',
        }),
      );

      const context = { order: { id: 'order_123', items: [] } };
      const result = await step.execute(context);

      expect(result).toBe(false);
      expect(context.order.reservationId).toBeUndefined();
    });

    it('should return false when no reservationId in response', async () => {
      mockClient.send.mockReturnValue(
        of({
          success: true,
          data: {},
        }),
      );

      const context = { order: { id: 'order_123', items: [] } };
      const result = await step.execute(context);

      expect(result).toBe(false);
    });
  });

  describe('compensate', () => {
    it('should call INVENTORY_RELEASE with reservationId', async () => {
      mockClient.send.mockReturnValue(of({ success: true }));

      const context = {
        order: {
          id: 'order_123',
          reservationId: 'res_456',
          transactionId: 'txn_789',
        },
      };

      await step.compensate(context);

      expect(mockClient.send).toHaveBeenCalledWith('inventory.release', {
        reservationId: 'res_456',
      });
    });

    it('should send release even when reservationId is undefined', async () => {
      mockClient.send.mockReturnValue(
        of({ success: false, error: 'No reservation' }),
      );

      const context = {
        order: { id: 'order_123', transactionId: 'txn_789' },
      };

      await step.compensate(context);

      expect(mockClient.send).toHaveBeenCalledWith('inventory.release', {
        reservationId: undefined,
      });
    });

    it('should log warning if release fails', async () => {
      mockClient.send.mockReturnValue(
        of({ success: false, error: 'Not found' }),
      );
      const loggerSpy = jest.spyOn(step['logger'], 'log');

      const context = {
        order: { id: 'order_123', reservationId: 'res_456' },
      };

      await step.compensate(context);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Inventory release failed'),
      );
    });
  });
});
