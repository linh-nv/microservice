import { IsString, IsOptional, IsDate, IsUUID } from 'class-validator';

export default class CreateUserProfileDto {
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsDate()
  birthday?: Date;

  @IsOptional()
  @IsString()
  location?: string;
}
