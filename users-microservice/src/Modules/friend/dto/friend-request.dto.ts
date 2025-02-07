import { IsOptional, IsDateString, IsInt, Min } from 'class-validator';

export class FriendRequestsDto {
  @IsOptional()
  page?: number;
  
  @IsOptional()
  limit?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
