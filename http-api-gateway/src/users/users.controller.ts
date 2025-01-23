import {
  Controller,
  Inject,
  Post,
  Body,
  Get,
  HttpException,
  Req,
  Headers,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import CreateUserDto from './dtos/CreateUser.dto';
import LoginDto from './dtos/Login.dto';
import ReAuthDto from './dtos/reauth.dto';

@Controller('users')
export class UsersController {
  constructor(@Inject('NATS_SERVICE') private natsClient: ClientProxy) {}

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.natsClient.send({ cmd: 'sign-up' }, createUserDto);
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Headers() headers: Headers,
    @Req() req,
  ) {
    const ipAddress = req.connection.remoteAddress || '';
    const fingerprint = req.fingerprint?.hash;
    return this.natsClient.send(
      { cmd: 'login' },
      {
        loginDto,
        headers,
        ipAddress,
        fingerprint: fingerprint,
      },
    );
  }

  @Post('refresh-token')
  async reAuth(@Body() body: ReAuthDto, @Req() req) {
    const deviceId = req.fingerprint.hash;
    const { refreshToken } = body;
    return this.natsClient.send(
      { cmd: 'refresh-token' },
      {
        refreshToken,
        deviceId,
      },
    );
  }

  // @Get('me')
  // async me(@UserId() userId: string) {

  //   return this.natsClient.send({ cmd: 'me' }, { userId });
  // }
}
