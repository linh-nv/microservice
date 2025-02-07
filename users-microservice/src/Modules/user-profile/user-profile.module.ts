import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfileService } from './user-profile.service';
import { UserProfileController } from './user-profile.controller';
import { AuthModule } from '../auth/auth.module';
import { UserProfileEntity } from './entities/user-profile.entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserProfileEntity]),
    AuthModule,
  ],
  controllers: [UserProfileController],
  providers: [UserProfileService],
  exports: [UserProfileService],
})
export class UserProfileModule {}
