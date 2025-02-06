import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import { FriendService } from './friend.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { UserId } from 'src/decorators/user.decorator';


@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Get('requests/pending')
  async getPendingRequests(@UserId() userId) {
    return this.friendService.getPendingFriendRequests(userId);
  }

  @Get('suggestions')
  async getSuggestedFriends(@UserId('id') userId: string) {
    return this.friendService.getSuggestedFriends(userId);
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

  @Post('requests/:requestId/reject')
  async rejectFriendRequest(
    @UserId('id') userId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.friendService.rejectFriendRequest(requestId, userId);
  }
}
