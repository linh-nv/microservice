import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/User';
import { UserProfileEntity } from '../user-profile/entities/user-profile.entities';
import {
  FriendRequestEntity,
  FriendRequestStatus,
} from './entities/friend-request.entity';

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(UserProfileEntity)
    private userProfileRepository: Repository<UserProfileEntity>,
    @InjectRepository(FriendRequestEntity)
    private friendRequestRepository: Repository<FriendRequestEntity>,
  ) {}

  async getSuggestedFriends(
    userId: string,
    limit: number = 10,
  ): Promise<UserEntity[]> {
    const userProfile = await this.userProfileRepository.findOne({
      where: { user: { id: userId } },
      relations: ['friends'],
    });

    if (!userProfile) {
      throw new NotFoundException('User profile not found');
    }

    // Lấy danh sách bạn bè hiện tại
    const friendIds = userProfile.friends.map((friend) => friend.id);

    // Lấy danh sách người dùng được gợi ý (không bao gồm bạn bè hiện tại)
    const suggestedFriends = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id != :userId', { userId })
      .andWhere('user.id NOT IN (:...friendIds)', {
        friendIds: friendIds.length ? friendIds : [''],
      })
      .limit(limit)
      .getMany();

    return suggestedFriends;
  }

  async sendFriendRequest(
    senderId: string,
    receiverId: string,
  ): Promise<FriendRequestEntity> {
    // Kiểm tra xem đã có lời mời kết bạn chưa
    const existingRequest = await this.friendRequestRepository.findOne({
      where: [
        {
          sender: { id: senderId },
          receiver: { id: receiverId },
          status: FriendRequestStatus.PENDING,
        },
        {
          sender: { id: receiverId },
          receiver: { id: senderId },
          status: FriendRequestStatus.PENDING,
        },
      ],
    });

    if (existingRequest) {
      throw new BadRequestException('Friend request already exists');
    }

    // Kiểm tra xem đã là bạn bè chưa
    const senderProfile = await this.userProfileRepository.findOne({
      where: { user: { id: senderId } },
      relations: ['friends'],
    });
    const isAlreadyFriend = senderProfile?.friends?.some(
      (friend) => friend.id === receiverId,
    );
    if (isAlreadyFriend) {
      throw new BadRequestException('Users are already friends');
    }

    // Tạo lời mời kết bạn mới
    const friendRequest = this.friendRequestRepository.create({
      sender: { id: senderId },
      receiver: { id: receiverId },
      status: FriendRequestStatus.PENDING,
    });

    return this.friendRequestRepository.save(friendRequest);
  }

  async acceptFriendRequest(requestId: string, userId: string): Promise<void> {
    const friendRequest = await this.friendRequestRepository.findOne({
      where: {
        id: requestId,
        receiver: { id: userId },
        status: FriendRequestStatus.PENDING,
      },
      relations: ['sender', 'receiver'],
    });

    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }

    // Cập nhật trạng thái lời mời
    friendRequest.status = FriendRequestStatus.ACCEPTED;
    await this.friendRequestRepository.save(friendRequest);

    // Thêm vào danh sách bạn bè của cả hai người
    const [senderProfile, receiverProfile] = await Promise.all([
      this.userProfileRepository.findOne({
        where: { user: { id: friendRequest.sender.id } },
        relations: ['friends'],
      }),
      this.userProfileRepository.findOne({
        where: { user: { id: friendRequest.receiver.id } },
        relations: ['friends'],
      }),
    ]);

    senderProfile.friends.push(friendRequest.receiver);
    receiverProfile.friends.push(friendRequest.sender);

    await Promise.all([
      this.userProfileRepository.save(senderProfile),
      this.userProfileRepository.save(receiverProfile),
    ]);
  }

  async rejectFriendRequest(requestId: string, userId: string): Promise<void> {
    const friendRequest = await this.friendRequestRepository.findOne({
      where: {
        id: requestId,
        receiver: { id: userId },
        status: FriendRequestStatus.PENDING,
      },
    });

    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }

    friendRequest.status = FriendRequestStatus.REJECTED;
    await this.friendRequestRepository.save(friendRequest);
  }

  async getPendingFriendRequests(
    userId: string,
  ): Promise<FriendRequestEntity[]> {
    // Tìm tất cả các lời mời kết bạn đang ở trạng thái PENDING mà người dùng đã nhận được
    const pendingRequests = await this.friendRequestRepository.find({
      where: {
        receiver: { id: userId },
        status: FriendRequestStatus.PENDING,
      },
      relations: ['sender'],
      // Sắp xếp theo thời gian tạo mới nhất
      order: {
        createdAt: 'DESC',
      },
    });

    // Nếu không có lời mời nào, trả về mảng rỗng
    if (!pendingRequests.length) {
      return [];
    }

    // Bổ sung thông tin profile của người gửi để hiển thị
    const requestsWithSenderProfile = await Promise.all(
      pendingRequests.map(async (request) => {
        const senderProfile = await this.userProfileRepository.findOne({
          where: { user: { id: request.sender.id } },
        });

        // Gắn thông tin profile vào sender
        request.sender = Object.assign(request.sender, {
          profile: senderProfile,
        });

        return request;
      }),
    );

    return requestsWithSenderProfile;
  }
}
