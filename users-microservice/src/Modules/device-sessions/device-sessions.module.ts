import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import AuthService from '../auth/auth.service';
import { UserEntity } from '../users/entities/User';
import DeviceSessionEntity from './device-session.entity';
import { DeviceSessionsController } from './device-sessions.controller';
import { DeviceSessionsService } from './device-sessions.service';
import { UsersService } from '../users/users.service';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceSessionEntity, UserEntity])],
  controllers: [DeviceSessionsController],
  providers: [DeviceSessionsService, AuthService, UsersService],
})
export class DeviceSessionsModule {}
