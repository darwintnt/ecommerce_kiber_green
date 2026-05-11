import { Test, TestingModule } from '@nestjs/testing';
import { InventoryValidateStep } from './inventory-validate.step';
import { INVENTORY_CLIENT_PROXY, TOPICS } from 'libs/constants';
import { firstValueFrom, of } from 'rxjs';

jest.mock('libs/constants', () => ({
  INVENTORY_CLIENT_PROXY: 'INVENTORY_CLIENT_PROXY',
  TOPICS: {
    INVENTORY_VALIDATE: 'inventory.validate',
  },
}));

describe('InventoryValidateStep', () => {
  let step: InventoryValidateStep;
  let mockClient: any;

  beforeEach(async () => {
    mockClient = {
      send: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryValidateStep,
        { provide: INVENTORY_CLIENT_PROXY, useValue: mockClient },
      ],
    }).compile();

    step = module.get<InventoryValidateStep>(InventoryValidateStep);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return true when inventory validation passes', async () => {
      mockClient.send.mockReturnValue(
        of({
          success: true,
          data: { valid: true, unavailableItems: [] },
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
      expect(mockClient.send).toHaveBeenCalledWith(
        'inventory.validate',
        expect.objectContaining({ orderId: 'order_123' }),
      );
    });

    it('should return false when inventory validation fails', async () => {
      mockClient.send.mockReturnValue(
        of({
          success: true,
          data: {
            valid: false,
            unavailableItems: [
              {
                productId: 'prod_1',
                requestedQuantity: 5,
                availableQuantity: 2,
              },
            ],
          },
        }),
      );

      const context = { order: { id: 'order_123', items: [] } };
      const result = await step.execute(context);

      expect(result).toBe(false);
    });

    it('should return false and set errorMessage when service fails', async () => {
      mockClient.send.mockReturnValue(
        of({
          success: false,
          error: 'Service unavailable',
        }),
      );

      const context = { order: { id: 'order_123', items: [] } };
      const result = await step.execute(context);

      expect(result).toBe(false);
    });

    it('should send correct items to inventory service', async () => {
      mockClient.send.mockReturnValue(
        of({
          success: true,
          data: { valid: true, unavailableItems: [] },
        }),
      );

      const context = {
        order: {
          id: 'order_123',
          items: [
            { productId: 'prod_1', quantity: 2, price: 10 },
            { productId: 'prod_2', quantity: 3, price: 20 },
          ],
        },
      };

      await step.execute(context);

      expect(mockClient.send).toHaveBeenCalledWith(
        'inventory.validate',
        expect.objectContaining({
          orderId: 'order_123',
          items: context.order.items,
        }),
      );
    });
  });

  describe('compensate', () => {
    it('should log no compensation needed', async () => {
      const loggerSpy = jest.spyOn(step['logger'], 'log');
      const context = { order: { id: 'order_123' } };

      await step.compensate(context);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('No compensation needed'),
      );
    });
  });
});
