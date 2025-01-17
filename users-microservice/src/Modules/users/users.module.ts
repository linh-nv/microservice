import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersMicroserviceController } from './users.controller';
import { UsersService } from './users.service';
import { UserEntity } from 'src/Modules/users/entities/User';
import DeviceSessionEntity from '../device-sessions/device-session.entity';
import { DeviceSessionsService } from '../device-sessions/device-sessions.service';
import AuthService from '../auth/auth.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, DeviceSessionEntity])],
  controllers: [UsersMicroserviceController],
  providers: [UsersService, DeviceSessionsService, AuthService],
})
export class UsersModule {}
