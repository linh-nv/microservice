import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { Transform } from 'class-transformer';

export enum FriendSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export class GetFriendsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => value || 1)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => value || 10)
  @IsInt()
  @Min(1)
  limit: number = 10;

  @IsOptional()
  @Transform(({ value }) => value || FriendSortBy.CREATED_AT)
  @IsEnum(FriendSortBy)
  sortBy: FriendSortBy = FriendSortBy.CREATED_AT;

  @IsOptional()
  @Transform(({ value }) => value || 'DESC')
  @IsString()
  orderBy: 'ASC' | 'DESC' = 'DESC';
}
