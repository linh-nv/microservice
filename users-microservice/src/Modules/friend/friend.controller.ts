import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Query,
  Req,
  Delete,
} from '@nestjs/common';
import { FriendService } from './friend.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { UserId } from 'src/decorators/user.decorator';
import { FriendRequestsDto } from './dto/friend-request.dto';
import { GetFriendsDto } from './dto/get-friends.dto';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Get('requests/pending')
  async getPendingRequests(
    @UserId() userId,
    @Query() options: FriendRequestsDto,
  ) {
    return this.friendService.getPendingFriendRequests(userId, options);
  }

  @Get('requests/send/pending')
  async getSendFriendRequests(
    @UserId() userId,
    @Query() options: GetFriendsDto,
  ) {
    return this.friendService.getSendFriendRequests(userId, options);
  }

  @Delete('requests/send/:requestId/delete')
  async deleteSendFriendRequests(
    @UserId('id') userId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.friendService.deleteSendFriendRequests(requestId, userId);
  }

  @Get('requests/count')
  async countPendingRequests(@UserId() userId) {
    return {
      count: await this.friendService.countPendingRequests(userId),
    };
  }

  @Get('suggestions')
  async getSuggestedFriends(
    @UserId('id') userId: string,
    @Query() options: FriendRequestsDto,
  ) {
    return this.friendService.getSuggestedFriends(userId, options);
  }

  @Post('requests/send/:receiverId')
  async sendFriendRequest(
    @UserId('id') userId: string,
    @Param('receiverId') receiverId: string,
  ) {
    return this.friendService.sendFriendRequest(userId, receiverId);
  }

  @Post('requests/:requestId/accept')
  async acceptFriendRequest(
    @UserId('id') userId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.friendService.acceptFriendRequest(requestId, userId);
  }

  @Delete('requests/:requestId/reject')
  async rejectFriendRequest(
    @UserId('id') userId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.friendService.rejectFriendRequest(requestId, userId);
  }

  @Get('/')
  async getFriends(
    @UserId('id') userId: string,
    @Query() options: GetFriendsDto,
  ) {
    return this.friendService.getFriends(userId, options);
  }
}
