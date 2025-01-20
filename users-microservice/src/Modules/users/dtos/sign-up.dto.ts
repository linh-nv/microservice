import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  Matches,
  MaxLength,
  MinLength,
  IsOptional,
} from 'class-validator';
import { RoleType, UserStatus } from 'src/Shared/enums';

export default class SignUpDto {
  @IsEmail()
  @ApiProperty({ required: true, example: 'mail@example.com' })
  readonly email: string;

  @ApiProperty({ required: true })
  @MinLength(8)
  @MaxLength(20)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password too weak',
  })
  readonly password: string;

  @ApiProperty({ required: true, example: 'John' })
  readonly firstName: string;

  @ApiProperty({ required: true, example: 'Doe' })
  readonly lastName: string;

  @ApiProperty({ required: false, example: 'USER' })
  @IsOptional()
  readonly role?: RoleType;

  @ApiProperty({ required: false, example: 'ACTIVE' })
  @IsOptional()
  readonly status?: UserStatus;

  @ApiProperty({ required: false, example: '{}' })
  @IsOptional()
  readonly params?: Record<string, unknown>;
}
