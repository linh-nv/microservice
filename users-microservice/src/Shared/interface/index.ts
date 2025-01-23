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
