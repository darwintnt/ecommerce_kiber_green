export class ProcessPaymentRequestDto {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
}
