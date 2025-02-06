import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/User';
import { FriendRequestEntity } from './entities/friend-request.entity';
import { UserProfileEntity } from '../user-profile/entities/user-profile.entities';
import { FriendService } from './friend.service';
import { FriendController } from './friend.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FriendRequestEntity,
      UserEntity,
      UserProfileEntity,
    ]),
    AuthModule
  ],
  controllers: [FriendController],
  providers: [FriendService],
})
export class FriendModule {}
