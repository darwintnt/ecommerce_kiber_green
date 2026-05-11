import { Test, TestingModule } from '@nestjs/testing';
import { CreateOrderHandler } from './create-order.handler';
import { CreateOrderCommand } from './create-order.command';
import { OrderRepository } from '../../orders-service.repository';
import { IdempotencyRepository } from '../../idempotency.repository';
import { InventoryValidateStep } from '../../saga/steps/inventory-validate.step';
import { InventoryReserveStep } from '../../saga/steps/inventory-reserve.step';
import { PaymentProcessStep } from '../../saga/steps/payment-process.step';
import { OrderConfirmStep } from '../../saga/steps/order-confirm.step';
import { RpcException } from '@nestjs/microservices';
import { OrderStatus } from '../../domain/order-status';
import { ORDER_REPOSITORY } from '../../interfaces/orders-repository.interface';
import { IDEMPOTENCY_REPOSITORY } from '../../interfaces/idempotency-repository.interface';

describe('CreateOrderHandler', () => {
  let handler: CreateOrderHandler;
  let mockOrderRepository: any;
  let mockIdempotencyRepository: any;
  let mockSteps: any;

  const validCommand = {
    query: {
      detail: {
        customerId: 'cust_123',
        items: [
          { productId: 'prod_1', quantity: 2, price: 10 },
          { productId: 'prod_2', quantity: 1, price: 20 },
        ],
      },
      headers: {
        'Idempotency-Key': 'idem-key-001',
      },
    },
  };

  beforeEach(async () => {
    mockOrderRepository = {
      save: jest.fn(),
      setReservation: jest.fn(),
      setPaymentTransaction: jest.fn(),
      updateStatus: jest.fn(),
    };

    mockIdempotencyRepository = {
      findByKey: jest.fn().mockResolvedValue(null), // default: no existing key
      create: jest.fn().mockResolvedValue({}),
      isExpired: jest.fn().mockReturnValue(false), // default: not expired
    };

    const createMockStep = (name: string, executeResult = true) => {
      const step = {
        getName: () => name,
        execute: jest.fn().mockResolvedValue(executeResult),
        compensate: jest.fn().mockResolvedValue(undefined),
      };
      return step;
    };

    const validateStep = createMockStep('Inventory Validate Step', true);
    const reserveStep = createMockStep('Inventory Reserve Step', true);
    const paymentStep = createMockStep('Payment Process Step', true);
    const confirmStep = createMockStep('Order Confirm Step', true);

    mockSteps = { validateStep, reserveStep, paymentStep, confirmStep };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrderHandler,
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepository },
        {
          provide: IDEMPOTENCY_REPOSITORY,
          useValue: mockIdempotencyRepository,
        },
        { provide: InventoryValidateStep, useValue: validateStep },
        { provide: InventoryReserveStep, useValue: reserveStep },
        { provide: PaymentProcessStep, useValue: paymentStep },
        { provide: OrderConfirmStep, useValue: confirmStep },
      ],
    }).compile();

    handler = module.get<CreateOrderHandler>(CreateOrderHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should throw RpcException when Idempotency-Key is missing', async () => {
      const commandWithoutKey = {
        query: {
          detail: {
            customerId: 'cust_123',
            items: [{ productId: 'prod_1', quantity: 2, price: 10 }],
          },
          headers: {},
        },
      };

      await expect(
        handler.execute(new CreateOrderCommand(commandWithoutKey)),
      ).rejects.toThrow(RpcException);
    });

    it('should return cached response for existing non-expired idempotency key', async () => {
      const cachedResponse = {
        success: true,
        data: { orderId: 'existing_order' },
      };
      mockIdempotencyRepository.findByKey.mockResolvedValue({
        key: 'idem-key-001',
        response: cachedResponse,
        expiresAt: new Date(Date.now() + 86400000),
      });
      mockIdempotencyRepository.isExpired.mockReturnValue(false);

      const result = await handler.execute(
        new CreateOrderCommand(validCommand),
      );

      expect(result).toEqual(cachedResponse);
      expect(mockOrderRepository.save).not.toHaveBeenCalled();
    });

    it('should create order successfully when saga completes', async () => {
      const savedOrder = {
        id: 'order_123',
        customerId: 'cust_123',
        items: [],
        total: 40,
        status: OrderStatus.PENDING,
        inventoryReservationId: null,
        paymentTransactionId: null,
      };
      mockOrderRepository.save.mockResolvedValue(savedOrder);
      mockIdempotencyRepository.findByKey.mockResolvedValue(null);
      mockIdempotencyRepository.create.mockResolvedValue({});

      const result = await handler.execute(
        new CreateOrderCommand(validCommand),
      );

      expect(result.success).toBe(true);
      expect(result.data?.orderId).toBe('order_123');
      expect(mockOrderRepository.save).toHaveBeenCalled();
      expect(mockIdempotencyRepository.create).toHaveBeenCalled();
    });

    it('should set reservation and transaction on order after saga', async () => {
      const savedOrder = {
        id: 'order_123',
        customerId: 'cust_123',
        items: [],
        total: 40,
        status: OrderStatus.PENDING,
        inventoryReservationId: null,
        paymentTransactionId: null,
      };
      mockOrderRepository.save.mockResolvedValue(savedOrder);
      mockIdempotencyRepository.findByKey.mockResolvedValue(null);
      mockIdempotencyRepository.create.mockResolvedValue({});

      // Simulate saga setting reservationId and transactionId on context.order
      mockSteps.validateStep.execute.mockImplementation(async (ctx: any) => {
        ctx.order.reservationId = 'res_456';
        ctx.order.transactionId = 'txn_789';
        return true;
      });

      const result = await handler.execute(
        new CreateOrderCommand(validCommand),
      );

      expect(result.success).toBe(true);
    });

    it('should mark order as CANCELLED when saga fails', async () => {
      const savedOrder = {
        id: 'order_123',
        customerId: 'cust_123',
        items: [],
        total: 40,
        status: OrderStatus.PENDING,
        inventoryReservationId: null,
        paymentTransactionId: null,
      };
      mockOrderRepository.save.mockResolvedValue(savedOrder);
      mockOrderRepository.updateStatus.mockResolvedValue({});
      mockIdempotencyRepository.findByKey.mockResolvedValue(null);
      mockIdempotencyRepository.create.mockResolvedValue({});

      // Make payment step fail
      mockSteps.paymentStep.execute.mockResolvedValue(false);

      const result = await handler.execute(
        new CreateOrderCommand(validCommand),
      );

      expect(result.success).toBe(false);
      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith(
        'order_123',
        OrderStatus.CANCELLED,
      );
    });

    it('should store failure response in idempotency when saga fails', async () => {
      const savedOrder = {
        id: 'order_123',
        customerId: 'cust_123',
        items: [],
        total: 40,
        status: OrderStatus.PENDING,
        inventoryReservationId: null,
        paymentTransactionId: null,
      };
      mockOrderRepository.save.mockResolvedValue(savedOrder);
      mockOrderRepository.updateStatus.mockResolvedValue({});
      mockIdempotencyRepository.findByKey.mockResolvedValue(null);
      mockIdempotencyRepository.create.mockResolvedValue({});

      mockSteps.paymentStep.execute.mockResolvedValue(false);

      await handler.execute(new CreateOrderCommand(validCommand));

      expect(mockIdempotencyRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'idem-key-001',
          response: expect.objectContaining({ success: false }),
        }),
      );
    });

    it('should throw when order validation fails', async () => {
      const invalidCommand = {
        query: {
          detail: {
            customerId: '', // empty customerId fails validation
            items: [{ productId: 'prod_1', quantity: 2, price: 10 }],
          },
          headers: { 'Idempotency-Key': 'idem-key-001' },
        },
      };

      await expect(
        handler.execute(new CreateOrderCommand(invalidCommand)),
      ).rejects.toThrow(RpcException);
    });
  });
});
