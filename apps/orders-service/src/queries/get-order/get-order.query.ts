import { ProxyContextI } from '../../../../../libs/interfaces/proxy-context.interface';

export class GetOrderQuery {
  constructor(public readonly query: ProxyContextI) {}
}
