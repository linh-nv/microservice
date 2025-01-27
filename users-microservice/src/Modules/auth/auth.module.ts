import { Global, Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';

@Global()
@Module({
  imports: [UsersModule],
})
export class AuthModule {}
