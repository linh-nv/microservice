import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { DeviceSessionsService } from '../device-sessions/device-sessions.service';
import SignUpDto from './dtos/sign-up.dto';
import LoginDto from './dtos/login.dto';
import ReAuthDto from './dtos/reauth.dto';
import { LoginInterface } from 'src/Shared/interface';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { UserId } from 'src/decorators/user.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller()
export class UsersMicroserviceController {
  constructor(
    private usersService: UsersService,
    private deviceSessionsService: DeviceSessionsService,
  ) {}

  // // @MessagePattern({ cmd: 'sign-up' })
  // @Post('sign-up')
  // async signUp(@Body() signUpDto: SignUpDto) {
  //   return this.usersService.signUp(signUpDto);
  // }

  // // @MessagePattern({ cmd: 'login' })
  // @Post('login')
  // async login(
  //   @Body() loginDto: LoginDto,
  //   @Headers() headers: Headers,
  //   @Req() req,
  // ) {
  //   const ipAddress = req.connection.remoteAddress || '';
  //   const fingerprint = req.fingerprint?.hash;
  //   const ua = headers['user-agent'];
  //   const metaData: LoginMetadata = {
  //     ipAddress,
  //     ua,
  //     deviceId: fingerprint,
  //   };
  //   return this.usersService.login(loginDto, metaData);
  // }

  // // @MessagePattern({ cmd: 'refresh-token' })
  // @Post('refresh-token')
  // async reAuth(@Body() body) {
  //   const { refreshToken, deviceId } = body;

  //   return this.deviceSessionsService.reAuth(deviceId, refreshToken);
  // }

  // // @MessagePattern({ cmd: 'me' })
  // @Get('me')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // async me(@UserId() id) {
  //   return this.usersService.me(id);
  // }

  @Get('user/:id')
  // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getUser(@Param('id') id: string) {
    return this.usersService.getUser(id);
  }

  @Post('register')
  async register(@Body() register, @Headers() token) {
    const tokenValue = token.authorization.startsWith('Bearer ') ? token.authorization.slice(7) : token;
    
    if (tokenValue != process.env.JWT_SECRET) throw new UnauthorizedException(token);
    return this.usersService.register(register);
  }

  @Get('me')
  // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async me(@Headers() id) {
    return this.usersService.me(id);
  }
}

export interface LoginMetadata {
  ipAddress: string;
  ua: string;
  deviceId: string;
}
