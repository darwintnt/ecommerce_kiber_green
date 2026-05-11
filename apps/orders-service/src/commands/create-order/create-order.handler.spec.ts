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
  let mockValidateStep: any;
  let mockReserveStep: any;
  let mockPaymentStep: any;
  let mockConfirmStep: any;

  const buildValidCommand = (extraHeaders: Record<string, string> = {}) => ({
    detail: {
      customerId: 'cust_123',
      items: [
        { productId: 'prod_1', quantity: 2, price: 10 },
        { productId: 'prod_2', quantity: 1, price: 20 },
      ],
    },
    headers: {
      'Idempotency-Key': `idem-key-${Date.now()}`,
      ...extraHeaders,
    },
  });

  const buildMockStep = (name: string, executeResult = true) => ({
    getName: () => name,
    execute: jest.fn().mockResolvedValue(executeResult),
    compensate: jest.fn().mockResolvedValue(undefined),
  });

  const setupMocks = () => {
    mockOrderRepository = {
      save: jest.fn(),
      setReservation: jest.fn(),
      setPaymentTransaction: jest.fn(),
      updateStatus: jest.fn(),
    };

    mockIdempotencyRepository = {
      findByKey: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      isExpired: jest.fn().mockReturnValue(false),
    };

    mockValidateStep = buildMockStep('Inventory Validate Step', true);
    mockReserveStep = buildMockStep('Inventory Reserve Step', true);
    mockPaymentStep = buildMockStep('Payment Process Step', true);
    mockConfirmStep = buildMockStep('Order Confirm Step', true);
  };

  const initModule = async () => {
    setupMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrderHandler,
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepository },
        {
          provide: IDEMPOTENCY_REPOSITORY,
          useValue: mockIdempotencyRepository,
        },
        { provide: InventoryValidateStep, useValue: mockValidateStep },
        { provide: InventoryReserveStep, useValue: mockReserveStep },
        { provide: PaymentProcessStep, useValue: mockPaymentStep },
        { provide: OrderConfirmStep, useValue: mockConfirmStep },
      ],
    }).compile();

    handler = module.get<CreateOrderHandler>(CreateOrderHandler);
  };

  beforeEach(async () => {
    await initModule();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('execute', () => {
    it('should throw RpcException when Idempotency-Key is missing', async () => {
      const command = {
        detail: {
          customerId: 'cust_123',
          items: [{ productId: 'prod_1', quantity: 2, price: 10 }],
        },
        headers: {},
      };

      await expect(
        handler.execute(new CreateOrderCommand(command)),
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

      const command = buildValidCommand();

      const result = await handler.execute(new CreateOrderCommand(command));

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

      const command = buildValidCommand();
      const result = await handler.execute(new CreateOrderCommand(command));

      expect(result.success).toBe(true);
      expect(result.data?.orderId).toBe('order_123');
      expect(mockOrderRepository.save).toHaveBeenCalled();
      expect(mockIdempotencyRepository.create).toHaveBeenCalled();
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

      // Make payment step fail
      mockPaymentStep.execute.mockResolvedValue(false);

      const command = buildValidCommand();
      const result = await handler.execute(new CreateOrderCommand(command));

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

      mockPaymentStep.execute.mockResolvedValue(false);

      const command = buildValidCommand();
      await handler.execute(new CreateOrderCommand(command));

      expect(mockIdempotencyRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          response: expect.objectContaining({ success: false }),
        }),
      );
    });

    it('should throw when order validation fails', async () => {
      const command = {
        detail: {
          customerId: '', // empty fails validation
          items: [{ productId: 'prod_1', quantity: 2, price: 10 }],
        },
        headers: { 'Idempotency-Key': 'idem-key-validation' },
      };

      await expect(
        handler.execute(new CreateOrderCommand(command)),
      ).rejects.toThrow(RpcException);
    });
  });
});
