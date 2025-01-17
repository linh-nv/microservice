import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersMicroserviceController } from './users.controller';
import { UsersService } from './users.service';
import { UserEntity } from 'src/Modules/users/entities/User';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UsersMicroserviceController],
  providers: [UsersService],
})
export class UsersModule {}
