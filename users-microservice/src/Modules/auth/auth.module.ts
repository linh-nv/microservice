import { Global, Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import AuthService from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import DeviceSessionEntity from '../device-sessions/device-session.entity';
import { CacheModule } from '@nestjs/cache-manager';

@Global()
@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([DeviceSessionEntity]),
    CacheModule.register({
      ttl: 60 * 60 * 24,
    }),
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
