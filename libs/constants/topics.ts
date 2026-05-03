export const INVENTORY_VALIDATE = 'inventory.validate';
export const INVENTORY_RESERVE = 'inventory.reserve';
export const INVENTORY_RELEASE = 'inventory.release';
export const INVENTORY_CONFIRM = 'inventory.confirm';

export const PAYMENT_PROCESS = 'payment.process';
export const PAYMENT_REFUND = 'payment.refund';

export const ORDERS_CREATE = 'orders.create';
export const ORDERS_CANCEL = 'orders.cancel';
export const ORDERS_GET = 'orders.get';

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
} as const;

export type Topic = (typeof TOPICS)[keyof typeof TOPICS];
