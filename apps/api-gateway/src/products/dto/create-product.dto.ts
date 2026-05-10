import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNumber()
  @IsNotEmpty()
  price!: number;

  @IsNumber()
  @IsNotEmpty()
  stock!: number;
}
