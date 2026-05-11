import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request, { SuperTest } from 'supertest';
import { AppModule } from '../src/app.module';

describe('Orders E2E (via API Gateway)', () => {
  let app: INestApplication;
  let httpClient: SuperTest<any>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpClient = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /orders', () => {
    it('should create an order successfully when all services respond correctly', async () => {
      const orderPayload = {
        customerId: 'e2e-customer-001',
        items: [
          { productId: 'prod_001', quantity: 2, price: 25.0 },
          { productId: 'prod_002', quantity: 1, price: 50.0 },
        ],
      };

      const response = await httpClient
        .post('/orders')
        .set('Idempotency-Key', `e2e-order-${Date.now()}`)
        .send(orderPayload)
        .expect(HttpStatus.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data?.orderId).toBeDefined();
    });

    it('should return 400 when Idempotency-Key header is missing', async () => {
      const response = await httpClient
        .post('/orders')
        .send({
          customerId: 'e2e-customer-001',
          items: [{ productId: 'prod_001', quantity: 1, price: 25.0 }],
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Idempotency-Key');
    });

    it('should return 400 when customerId is missing', async () => {
      const response = await httpClient
        .post('/orders')
        .set('Idempotency-Key', `e2e-req-${Date.now()}`)
        .send({
          items: [{ productId: 'prod_001', quantity: 1, price: 25.0 }],
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });

    it('should return same response when same idempotency key is reused', async () => {
      const idempotencyKey = `e2e-dup-${Date.now()}`;

      const firstResponse = await httpClient
        .post('/orders')
        .set('Idempotency-Key', idempotencyKey)
        .send({
          customerId: 'e2e-customer-002',
          items: [{ productId: 'prod_001', quantity: 1, price: 30.0 }],
        });

      const secondResponse = await httpClient
        .post('/orders')
        .set('Idempotency-Key', idempotencyKey)
        .send({
          customerId: 'e2e-customer-002',
          items: [{ productId: 'prod_001', quantity: 1, price: 30.0 }],
        });

      expect(secondResponse.body).toEqual(firstResponse.body);
    });

    it('should get order by ID', async () => {
      // First create an order
      const createResponse = await httpClient
        .post('/orders')
        .set('Idempotency-Key', `e2e-get-${Date.now()}`)
        .send({
          customerId: 'e2e-customer-003',
          items: [{ productId: 'prod_001', quantity: 1, price: 100.0 }],
        });

      const orderId = createResponse.body.data?.orderId;
      expect(orderId).toBeDefined();

      // Then get it
      const getResponse = await httpClient
        .get(`/orders/${orderId}`)
        .expect(HttpStatus.OK);

      expect(getResponse.body.data?.id).toBe(orderId);
      expect(getResponse.body.data?.customerId).toBe('e2e-customer-003');
    });

    it('should list orders with pagination', async () => {
      const response = await httpClient
        .get('/orders')
        .query({ page: 1, limit: 10 })
        .expect(HttpStatus.OK);

      expect(response.body.data).toBeDefined();
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(10);
    });

    it('should limit max results to 100', async () => {
      const response = await httpClient
        .get('/orders')
        .query({ page: 1, limit: 500 })
        .expect(HttpStatus.OK);

      // The API should cap limit at 100
      expect(response.body.meta.limit).toBe(100);
    });
  });

  describe('POST /orders cancel', () => {
    it('should cancel an existing order', async () => {
      // First create an order
      const createResponse = await httpClient
        .post('/orders')
        .set('Idempotency-Key', `e2e-cancel-${Date.now()}`)
        .send({
          customerId: 'e2e-customer-cancel',
          items: [{ productId: 'prod_001', quantity: 1, price: 50.0 }],
        });

      const orderId = createResponse.body.data?.orderId;
      expect(orderId).toBeDefined();

      // Then cancel it
      const cancelResponse = await httpClient
        .post('/orders/cancel')
        .send({ orderId })
        .expect(HttpStatus.OK);

      expect(cancelResponse.body.success).toBe(true);

      // Verify it's cancelled
      const getResponse = await httpClient.get(`/orders/${orderId}`);
      expect(getResponse.body.data?.status).toBe('CANCELLED');
    });

    it('should return 400 when cancelling already completed order', async () => {
      // Create an order (it will be COMPLETED after saga finishes)
      const createResponse = await httpClient
        .post('/orders')
        .set('Idempotency-Key', `e2e-cancel-completed-${Date.now()}`)
        .send({
          customerId: 'e2e-customer-comp',
          items: [{ productId: 'prod_001', quantity: 1, price: 75.0 }],
        });

      const orderId = createResponse.body.data?.orderId;

      // Try to cancel a COMPLETED order
      const cancelResponse = await httpClient
        .post('/orders/cancel')
        .send({ orderId })
        .expect(HttpStatus.BAD_REQUEST);

      expect(cancelResponse.body.error).toContain('COMPLETED');
    });
  });
});
