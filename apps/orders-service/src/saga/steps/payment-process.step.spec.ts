import { Test, TestingModule } from '@nestjs/testing';
import { PaymentProcessStep } from './payment-process.step';
import { PAYMENT_CLIENT_PROXY, TOPICS } from 'libs/constants';
import { of } from 'rxjs';

jest.mock('libs/constants', () => ({
  PAYMENT_CLIENT_PROXY: 'PAYMENT_CLIENT_PROXY',
  TOPICS: {
    PAYMENT_PROCESS: 'payment.process',
    PAYMENT_REFUND: 'payment.refund',
  },
}));

describe('PaymentProcessStep', () => {
  let step: PaymentProcessStep;
  let mockClient: any;

  beforeEach(async () => {
    mockClient = {
      send: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentProcessStep,
        { provide: PAYMENT_CLIENT_PROXY, useValue: mockClient },
      ],
    }).compile();

    step = module.get<PaymentProcessStep>(PaymentProcessStep);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return true and set transactionId on success', async () => {
      mockClient.send.mockReturnValue(
        of({
          success: true,
          data: { transactionId: 'txn_123' },
        }),
      );

      const context = {
        order: { id: 'order_123', total: 100 },
        idempotencyKey: 'idem_001',
      };

      const result = await step.execute(context);

      expect(result).toBe(true);
      expect(context.order.transactionId).toBe('txn_123');
    });

    it('should send payment with idempotency key', async () => {
      mockClient.send.mockReturnValue(
        of({
          success: true,
          data: { transactionId: 'txn_123' },
        }),
      );

      const context = {
        order: { id: 'order_123', total: 100 },
        idempotencyKey: 'idem_001',
      };

      await step.execute(context);

      expect(mockClient.send).toHaveBeenCalledWith(
        'payment.process',
        expect.objectContaining({
          idempotencyKey: 'payment-idem_001-order_123',
        }),
      );
    });

    it('should generate fallback idempotency key when none provided', async () => {
      mockClient.send.mockReturnValue(
        of({
          success: true,
          data: { transactionId: 'txn_123' },
        }),
      );

      const context = {
        order: { id: 'order_123', total: 100 },
        idempotencyKey: undefined,
      };

      await step.execute(context);

      expect(mockClient.send).toHaveBeenCalledWith(
        'payment.process',
        expect.objectContaining({
          idempotencyKey: 'payment-order_123',
        }),
      );
    });

    it('should return false when payment fails', async () => {
      mockClient.send.mockReturnValue(
        of({
          success: false,
          error: 'Card declined',
        }),
      );

      const context = {
        order: { id: 'order_123', total: 100 },
        idempotencyKey: 'idem_001',
      };

      const result = await step.execute(context);

      expect(result).toBe(false);
      expect(context.order.transactionId).toBeUndefined();
    });

    it('should return false when no transactionId in response', async () => {
      mockClient.send.mockReturnValue(
        of({
          success: true,
          data: {},
        }),
      );

      const context = {
        order: { id: 'order_123', total: 100 },
        idempotencyKey: 'idem_001',
      };

      const result = await step.execute(context);

      expect(result).toBe(false);
    });
  });

  describe('compensate', () => {
    it('should call PAYMENT_REFUND with transactionId', async () => {
      mockClient.send.mockReturnValue(
        of({
          success: true,
          data: { transactionId: 'txn_123', refundedAmount: 100 },
        }),
      );

      const context = {
        order: { id: 'order_123', transactionId: 'txn_123' },
      };

      await step.compensate(context);

      expect(mockClient.send).toHaveBeenCalledWith('payment.refund', {
        transactionId: 'txn_123',
      });
    });

    it('should still send refund even if transactionId is undefined', async () => {
      mockClient.send.mockReturnValue(
        of({ success: false, error: 'No transaction' }),
      );

      const context = {
        order: { id: 'order_123', transactionId: undefined },
      };

      await step.compensate(context);

      expect(mockClient.send).toHaveBeenCalledWith('payment.refund', {
        transactionId: undefined,
      });
    });

    it('should log warning if refund fails', async () => {
      mockClient.send.mockReturnValue(
        of({ success: false, error: 'Not found' }),
      );
      const loggerSpy = jest.spyOn(step['logger'], 'log');

      const context = {
        order: { id: 'order_123', transactionId: 'txn_123' },
      };

      await step.compensate(context);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Payment refund failed'),
      );
    });
  });
});
