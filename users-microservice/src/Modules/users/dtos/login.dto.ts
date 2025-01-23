import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export default class LoginDto {
  @IsEmail()
  @ApiProperty({ required: true, example: 'mail@example.com' })
  readonly email: string;

  @ApiProperty({ required: true, example: 'Linh@123' })
  readonly password: string;
}
