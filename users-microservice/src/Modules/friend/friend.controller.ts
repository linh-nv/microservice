import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Query,
  Req,
  Delete,
  Headers,
} from '@nestjs/common';
import { FriendService } from './friend.service';
import { UserId } from 'src/decorators/user.decorator';
import { FriendRequestsDto } from './dto/friend-request.dto';
import { GetFriendsDto } from './dto/get-friends.dto';
import { JwtAuthGuard } from '../auth2/jwt-auth.guard';

@Controller('friends')
// @UseGuards(JwtAuthGuard)
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Get('requests/pending')
  async getPendingRequests(
    @Headers('id') userId,
    @Query() options: FriendRequestsDto,
  ) {
    console.log('userId', userId);
    return this.friendService.getPendingFriendRequests(userId, options);
  }

  @Get('requests/send/pending')
  async getSendFriendRequests(
    @Headers('id') userId,
    @Query() options: GetFriendsDto,
  ) {
    return this.friendService.getSendFriendRequests(userId, options);
  }

  @Delete('requests/send/:requestId/delete')
  async deleteSendFriendRequests(
    @Headers('id') userId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.friendService.deleteSendFriendRequests(requestId, userId);
  }

  @Get('requests/count')
  async countPendingRequests(@Headers('id') userId) {
    return {
      count: await this.friendService.countPendingRequests(userId),
    };
  }

  @Get('suggestions')
  async getSuggestedFriends(
    @Headers('id') userId: string,
    @Query() options: FriendRequestsDto,
  ) {
    return this.friendService.getSuggestedFriends(userId, options);
  }

  @Post('requests/send/:receiverId')
  async sendFriendRequest(
    @Headers('id') userId: string,
    @Param('receiverId') receiverId: string,
  ) {
    return this.friendService.sendFriendRequest(userId, receiverId);
  }

  @Post('requests/:requestId/accept')
  async acceptFriendRequest(
    @Headers('id') userId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.friendService.acceptFriendRequest(requestId, userId);
  }

  @Delete('requests/:requestId/reject')
  async rejectFriendRequest(
    @Headers('id') userId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.friendService.rejectFriendRequest(requestId, userId);
  }

  @Get('/')
  async getFriends(
    @Headers('id') userId: string,
    @Query() options: GetFriendsDto,
  ) {
    return this.friendService.getFriends(userId, options);
  }
}
