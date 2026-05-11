import { Test, TestingModule } from '@nestjs/testing';
import { OrderConfirmStep } from './order-confirm.step';
import { INVENTORY_CLIENT_PROXY, TOPICS } from 'libs/constants';
import { ORDER_REPOSITORY } from '../../interfaces/orders-repository.interface';
import { OrderStatus } from '../../domain/order-status';
import { of } from 'rxjs';

jest.mock('libs/constants', () => ({
  INVENTORY_CLIENT_PROXY: 'INVENTORY_CLIENT_PROXY',
  TOPICS: {
    INVENTORY_CONFIRM: 'inventory.confirm',
    INVENTORY_RELEASE: 'inventory.release',
  },
}));

describe('OrderConfirmStep', () => {
  let step: OrderConfirmStep;
  let mockClient: any;
  let mockOrderRepository: any;

  beforeEach(async () => {
    mockClient = {
      send: jest.fn(),
    };

    mockOrderRepository = {
      updateStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderConfirmStep,
        { provide: INVENTORY_CLIENT_PROXY, useValue: mockClient },
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepository },
      ],
    }).compile();

    step = module.get<OrderConfirmStep>(OrderConfirmStep);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return true and mark order as COMPLETED when inventory confirm succeeds', async () => {
      mockClient.send.mockReturnValue(of({ success: true }));
      mockOrderRepository.updateStatus.mockResolvedValue({});

      const context = {
        order: { id: 'order_123', reservationId: 'res_456' },
      };

      const result = await step.execute(context);

      expect(result).toBe(true);
      expect(mockClient.send).toHaveBeenCalledWith('inventory.confirm', {
        reservationId: 'res_456',
      });
      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith(
        'order_123',
        OrderStatus.COMPLETED,
      );
    });

    it('should return false when inventory confirmation fails', async () => {
      mockClient.send.mockReturnValue(
        of({
          success: false,
          error: 'Reservation expired',
        }),
      );

      const context = {
        order: { id: 'order_123', reservationId: 'res_456' },
      };

      const result = await step.execute(context);

      expect(result).toBe(false);
      expect(mockOrderRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should not call orderRepository when inventory confirm fails', async () => {
      mockClient.send.mockReturnValue(
        of({ success: false, error: 'Not found' }),
      );

      const context = {
        order: { id: 'order_123', reservationId: 'res_456' },
      };

      await step.execute(context);

      expect(mockOrderRepository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('compensate', () => {
    it('should mark order as CANCELLED and release inventory', async () => {
      mockClient.send.mockReturnValue(of({ success: true }));
      mockOrderRepository.updateStatus.mockResolvedValue({});

      const context = {
        order: { id: 'order_123', reservationId: 'res_456' },
      };

      await step.compensate(context);

      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith(
        'order_123',
        OrderStatus.CANCELLED,
      );
      expect(mockClient.send).toHaveBeenCalledWith('inventory.release', {
        reservationId: 'res_456',
      });
    });

    it('should throw when order update fails (release not called)', async () => {
      mockOrderRepository.updateStatus.mockRejectedValue(new Error('DB error'));
      mockClient.send.mockReturnValue(of({ success: true }));

      const context = {
        order: { id: 'order_123', reservationId: 'res_456' },
      };

      // The compensate method throws when orderRepository.updateStatus fails
      await expect(step.compensate(context)).rejects.toThrow('DB error');

      // Release is NOT called because the method throws before reaching it
      expect(mockClient.send).not.toHaveBeenCalled();
    });

    it('should not send release if no reservationId', async () => {
      mockOrderRepository.updateStatus.mockResolvedValue({});

      const context = {
        order: { id: 'order_123' },
      };

      await step.compensate(context);

      expect(mockClient.send).not.toHaveBeenCalled();
    });
  });
});
