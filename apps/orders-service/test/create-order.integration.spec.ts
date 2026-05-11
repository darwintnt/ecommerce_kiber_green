import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { OrdersServiceModule } from '../src/orders-service.module';
import { PrismaService } from '../src/prisma.service';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, of } from 'rxjs';

describe('CreateOrder Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mockInventoryClient: any;
  let mockPaymentClient: any;

  beforeAll(async () => {
    // Mock NATS clients before importing the module
    mockInventoryClient = {
      send: jest.fn(),
      emit: jest.fn(),
    };

    mockPaymentClient = {
      send: jest.fn(),
      emit: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [OrdersServiceModule],
    })
      .overrideProvider('INVENTORY_CLIENT_PROXY')
      .useValue(mockInventoryClient)
      .overrideProvider('PAYMENT_CLIENT_PROXY')
      .useValue(mockPaymentClient)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.idempotencyKey.deleteMany({
      where: { key: { startsWith: 'test-integration-' } },
    });
    await prisma.order.deleteMany({
      where: { customerId: 'test-customer' },
    });
    await app.close();
  });

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup happy path defaults
    mockInventoryClient.send.mockImplementation(
      (pattern: string, data: any) => {
        if (pattern === 'inventory.validate') {
          return of({
            success: true,
            data: { valid: true, unavailableItems: [] },
          });
        }
        if (pattern === 'inventory.reserve') {
          return of({
            success: true,
            data: { reservationId: `res_${Date.now()}` },
          });
        }
        if (pattern === 'inventory.confirm') {
          return of({ success: true });
        }
        if (pattern === 'inventory.release') {
          return of({ success: true });
        }
        return of({ success: false, error: 'Unknown pattern' });
      },
    );

    mockPaymentClient.send.mockImplementation((pattern: string, data: any) => {
      if (pattern === 'payment.process') {
        return of({
          success: true,
          data: { transactionId: `txn_${Date.now()}` },
        });
      }
      if (pattern === 'payment.refund') {
        return of({
          success: true,
          data: { transactionId: data.transactionId, refundedAmount: 100 },
        });
      }
      return of({ success: false, error: 'Unknown pattern' });
    });
  });

  describe('Full Create Order Flow', () => {
    it('should create an order successfully through the entire saga', async () => {
      const orderData = {
        customerId: 'test-customer',
        items: [
          { productId: 'prod_1', quantity: 2, price: 10 },
          { productId: 'prod_2', quantity: 1, price: 20 },
        ],
      };

      const idempotencyKey = `test-integration-${Date.now()}`;

      // This would call the controller endpoint via HTTP in real scenario
      // For integration, we test through the command bus
      const { CommandBus } = await import('@nestjs/cqrs');
      const commandBus = app.get(CommandBus);

      // Import the command
      const { CreateOrderCommand } =
        await import('../src/commands/create-order/create-order.command');
      const { ProxyContextI } =
        await import('libs/interfaces/proxy-context.interface');

      const context: ProxyContextI = {
        detail: orderData,
        headers: { 'Idempotency-Key': idempotencyKey },
      };

      const result = await commandBus.execute(new CreateOrderCommand(context));

      expect(result.success).toBe(true);
      expect(result.data?.orderId).toBeDefined();

      // Verify order was persisted
      const order = await prisma.order.findUnique({
        where: { id: result.data.orderId },
      });
      expect(order).not.toBeNull();
      expect(order?.status).toBe('COMPLETED');
      expect(order?.customerId).toBe('test-customer');

      // Verify idempotency key was stored
      const idempotencyRecord = await prisma.idempotencyKey.findUnique({
        where: { key: idempotencyKey },
      });
      expect(idempotencyRecord).not.toBeNull();
      expect(idempotencyRecord?.response).toContain('"success":true');
    });

    it('should return cached response when same idempotency key is used', async () => {
      const orderData = {
        customerId: 'test-customer',
        items: [{ productId: 'prod_1', quantity: 1, price: 50 }],
      };

      const idempotencyKey = `test-integration-duplicate-${Date.now()}`;

      const { CommandBus } = await import('@nestjs/cqrs');
      const commandBus = app.get(CommandBus);
      const { CreateOrderCommand } =
        await import('../src/commands/create-order/create-order.command');
      const { ProxyContextI } =
        await import('libs/interfaces/proxy-context.interface');

      const context: ProxyContextI = {
        detail: orderData,
        headers: { 'Idempotency-Key': idempotencyKey },
      };

      // First request
      const firstResult = await commandBus.execute(
        new CreateOrderCommand(context),
      );

      // Second request with same key - should get cached response
      const secondResult = await commandBus.execute(
        new CreateOrderCommand(context),
      );

      expect(secondResult).toEqual(firstResult);
    });

    it('should fail the saga when inventory validation fails', async () => {
      // Setup inventory to return insufficient stock
      mockInventoryClient.send.mockImplementation(
        (pattern: string, data: any) => {
          if (pattern === 'inventory.validate') {
            return of({
              success: true,
              data: {
                valid: false,
                unavailableItems: [
                  {
                    productId: 'prod_1',
                    requestedQuantity: 10,
                    availableQuantity: 5,
                  },
                ],
              },
            });
          }
          return of({ success: false, error: 'Unknown pattern' });
        },
      );

      const { CommandBus } = await import('@nestjs/cqrs');
      const commandBus = app.get(CommandBus);
      const { CreateOrderCommand } =
        await import('../src/commands/create-order/create-order.command');
      const { ProxyContextI } =
        await import('libs/interfaces/proxy-context.interface');

      const context: ProxyContextI = {
        detail: {
          customerId: 'test-customer',
          items: [{ productId: 'prod_1', quantity: 10, price: 10 }],
        },
        headers: { 'Idempotency-Key': `test-integration-fail-${Date.now()}` },
      };

      const result = await commandBus.execute(new CreateOrderCommand(context));

      expect(result.success).toBe(false);
      expect(result.error).toContain('No inventory available');
    });

    it('should compensate and cancel order when payment fails', async () => {
      // Setup payment to fail
      mockPaymentClient.send.mockImplementation(
        (pattern: string, data: any) => {
          if (pattern === 'payment.process') {
            return of({ success: false, error: 'Card declined' });
          }
          return of({ success: false, error: 'Unknown pattern' });
        },
      );

      const { CommandBus } = await import('@nestjs/cqrs');
      const commandBus = app.get(CommandBus);
      const { CreateOrderCommand } =
        await import('../src/commands/create-order/create-order.command');
      const { ProxyContextI } =
        await import('libs/interfaces/proxy-context.interface');

      const context: ProxyContextI = {
        detail: {
          customerId: 'test-customer',
          items: [{ productId: 'prod_1', quantity: 1, price: 100 }],
        },
        headers: {
          'Idempotency-Key': `test-integration-payment-fail-${Date.now()}`,
        },
      };

      const result = await commandBus.execute(new CreateOrderCommand(context));

      expect(result.success).toBe(false);
    });
  });
});
