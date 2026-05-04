import { ProxyContextI } from '../../../../../libs/interfaces/proxy-context.interface';

export class GetOrdersQuery {
  constructor(public readonly query: ProxyContextI) {}
}
