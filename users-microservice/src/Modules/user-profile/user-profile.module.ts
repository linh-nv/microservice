import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfileService } from './user-profile.service';
import { UserProfileController } from './user-profile.controller';
import { AuthModule } from '../auth/auth.module';
import { UserProfileEntity } from './entities/user-profile.entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserProfileEntity]),
    AuthModule, // Import AuthModule để sử dụng JwtAuthGuard
  ],
  controllers: [UserProfileController],
  providers: [UserProfileService],
  exports: [UserProfileService], // Export service nếu cần sử dụng ở module khác
})
export class UserProfileModule {}
