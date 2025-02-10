import LoginDto from 'src/Modules/users/dtos/login.dto';

export interface LoginInterface {
  loginDto: LoginDto;
  headers: any;
  ipAddress: string;
  fingerprint: string;
}

export interface LoginMetadata {
  ipAddress: string;
  ua: string;
  deviceId: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface SearchOptions {
  search?: string;
  searchFields?: string[];
}

export interface SortOptions {
  sortBy?: string;
  orderBy?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  currentPage: number;
  totalPages: number;
}
