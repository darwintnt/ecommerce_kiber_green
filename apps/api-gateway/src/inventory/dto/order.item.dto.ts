import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class OrderItemDto {
  @IsNotEmpty()
  @IsString()
  productId!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity!: number;
}
