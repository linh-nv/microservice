import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { UserProfileService } from './user-profile.service';

import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

import CreateUserProfileDto from './dto/create-user-profile.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { UserId } from 'src/decorators/user.decorator';

@Controller('user-profiles')
@UseGuards(JwtAuthGuard)
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Post()
  create(
    @Body() createUserProfileDto: CreateUserProfileDto,
    @Headers('id') userId: string,
  ) {
    return this.userProfileService.create(createUserProfileDto, userId);
  }

  @Get()
  findAll() {
    return this.userProfileService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userProfileService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    return this.userProfileService.update(id, updateUserProfileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userProfileService.softDelete(id);
  }
}
