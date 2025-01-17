import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreatePaymentDto {
  @IsNotEmpty()
  amount: number;

  @IsNotEmpty()
  userId: string;
}
