const INVENTORY_VALIDATE = 'inventory.validate';
const INVENTORY_RESERVE = 'inventory.reserve';
const INVENTORY_RELEASE = 'inventory.release';
const INVENTORY_CONFIRM = 'inventory.confirm';

const PAYMENT_PROCESS = 'payment.process';
const PAYMENT_REFUND = 'payment.refund';

const ORDERS_CREATE = 'orders.create';
const ORDERS_CANCEL = 'orders.cancel';
const ORDERS_GET = 'orders.get';
const ORDERS_GET_ALL = 'orders.get.all';

const PRODUCT_CREATE = 'product.create';
const PRODUCT_GET = 'product.get';
const PRODUCT_GET_BY_SKU = 'product.get.sku';
const PRODUCT_GET_ALL = 'product.get.all';
const PRODUCT_UPDATE = 'product.update';
const PRODUCT_DELETE = 'product.delete';

export const TOPICS = {
  INVENTORY_VALIDATE,
  INVENTORY_RESERVE,
  INVENTORY_RELEASE,
  INVENTORY_CONFIRM,
  PAYMENT_PROCESS,
  PAYMENT_REFUND,
  ORDERS_CREATE,
  ORDERS_CANCEL,
  ORDERS_GET,
  ORDERS_GET_ALL,
  PRODUCT_CREATE,
  PRODUCT_GET,
  PRODUCT_GET_BY_SKU,
  PRODUCT_GET_ALL,
  PRODUCT_UPDATE,
  PRODUCT_DELETE,
} as const;

export type Topic = (typeof TOPICS)[keyof typeof TOPICS];
