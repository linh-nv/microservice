import { Body, Controller, Req } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { DeviceSessionsService } from '../device-sessions/device-sessions.service';
import SignUpDto from './dtos/sign-up.dto';
import LoginDto from './dtos/login.dto';
import ReAuthDto from './dtos/reauth.dto';

@Controller()
export class UsersMicroserviceController {
  constructor(
    private usersService: UsersService,
    private deviceSessionsService: DeviceSessionsService,
  ) {}

  @MessagePattern({ cmd: 'sign-up' })
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.usersService.signUp(signUpDto);
  }

  @MessagePattern({ cmd: 'login' })
  async login(@Body() body) {
    const { loginDto, headers, ipAddress, fingerprint } = body;
    const ua = headers['user-agent'];
    const metaData: LoginMetadata = {
      ipAddress,
      ua,
      deviceId: fingerprint,
    };
    return this.usersService.login(loginDto, metaData);
  }

  @MessagePattern({ cmd: 'refresh-token' })
  async reAuth(@Body() body) {
    const { refreshToken, deviceId } = body;

    return this.deviceSessionsService.reAuth(deviceId, refreshToken);
  }
}

export interface LoginMetadata {
  ipAddress: string;
  ua: string;
  deviceId: string;
}
