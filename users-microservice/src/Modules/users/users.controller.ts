import { Body, Controller, Headers, Req } from '@nestjs/common';
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
  async login(
    @Req() req,
    @Body() loginDto: LoginDto,
    @Headers() headers: Headers,
  ) {
    const fingerprint = req.fingerprint;
    const ipAddress = req.connection.remoteAddress;
    const ua = headers['user-agent'];
    const deviceId = fingerprint.hash;
    const metaData: LoginMetadata = { ipAddress, ua, deviceId };
    return this.usersService.login(loginDto, metaData);
  }

  @MessagePattern({ cmd: 'refresh-token' })
  async reAuth(@Body() body: ReAuthDto, @Req() req) {
    const deviceId = req.fingerprint.hash;
    const { refreshToken } = body;
    return this.deviceSessionsService.reAuth(deviceId, refreshToken);
  }
}

export interface LoginMetadata {
  ipAddress: string;
  ua: string;
  deviceId: string;
}
