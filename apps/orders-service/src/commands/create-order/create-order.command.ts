import { ProxyContextI } from 'libs/interfaces/proxy-context.interface';

export class CreateOrderCommand {
  constructor(public readonly query: ProxyContextI) {}
}
