import {
  Injectable,
  NotFoundException,
  BadRequestException,
  SerializeOptions,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  DataSource,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { UserEntity } from '../users/entities/User';
import { UserProfileEntity } from '../user-profile/entities/user-profile.entities';
import {
  FriendRequestEntity,
  FriendRequestStatus,
} from './entities/friend-request.entity';
import { FriendRequestsDto } from './dto/friend-request.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GetFriendsDto } from './dto/get-friends.dto';
import { DataProcessingHelper } from 'src/helpers/dataProcesser';
import { PaginatedResult } from 'src/Shared/interface';
import { log } from 'console';
@SerializeOptions({
  excludeExtraneousValues: true,
})
@Injectable()
export class FriendService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(UserProfileEntity)
    private userProfileRepository: Repository<UserProfileEntity>,
    @InjectRepository(FriendRequestEntity)
    private friendRequestRepository: Repository<FriendRequestEntity>,
    private eventEmitter: EventEmitter2,
  ) {}

  async getSuggestedFriends(
    userId: string,
    options: FriendRequestsDto,
  ): Promise<{
    data: UserEntity[];
    total: number;
    currentPage: number;
    totalPages: number;
  }> {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 12;
    const skip = (page - 1) * limit;

    const userProfile = await this.userProfileRepository.findOne({
      where: { user: { id: userId } },
      relations: ['friends'],
    });

    // Lấy danh sách ID bạn bè hiện tại
    const friendIds = userProfile?.friends?.map((friend) => friend.id) ?? [];
    // Lấy danh sách người dùng đã gửi lời mời kết bạn cho mình
    const receivedRequestUsers = await this.friendRequestRepository.find({
      where: { receiver: { id: userId } },
      relations: ['sender'],
    });
    // Lấy danh sách người dùng mà mình đã gửi lời mời kết bạn
    const sentRequestUsers = await this.friendRequestRepository.find({
      where: { sender: { id: userId } },
      relations: ['receiver'],
    });

    // Tạo danh sách ID cần loại trừ
    const excludeUserIds = [
      userId,
      ...friendIds,
      ...receivedRequestUsers.map((req) => req.sender.id),
      ...sentRequestUsers.map((req) => req.receiver.id),
    ];

    // Tạo query builder để lấy gợi ý kết bạn
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.id NOT IN (:...excludeUserIds)', {
        excludeUserIds: excludeUserIds.length ? excludeUserIds : [''],
      });

    // Điều kiện lọc theo ngày nếu có
    if (options.startDate) {
      queryBuilder.andWhere('user.createdAt >= :startDate', {
        startDate: options.startDate,
      });
    }

    if (options.endDate) {
      queryBuilder.andWhere('user.createdAt <= :endDate', {
        endDate: options.endDate,
      });
    }

    // Đếm tổng số bản ghi thỏa mãn điều kiện
    const total = await queryBuilder.getCount();

    // Thêm phân trang và lấy dữ liệu
    const suggestedFriends = await queryBuilder
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      data: suggestedFriends,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async sendFriendRequest(
    senderId: string,
    receiverId: string,
  ): Promise<FriendRequestEntity> {
    // Verify both users exist
    console.log('senderId', senderId);
    console.log('receiverId', receiverId);
    const [sender, receiver] = await Promise.all([
      this.userRepository.findOne({ where: { id: senderId } }),
      this.userRepository.findOne({ where: { id: receiverId } }),
    ]);

    if (!sender || !receiver) {
      throw new NotFoundException('One or both users not found');
    }

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

    this.friendRequestRepository.save(friendRequest);
    this.eventEmitter.emit('friendRequest.created', {
      requestId: friendRequest.id,
      senderId,
      receiverId,
    });

    return friendRequest;
  }

  async acceptFriendRequest(requestId: string, userId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // Tìm friend request
      const friendRequest = await manager.findOne(FriendRequestEntity, {
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

      // Cập nhật trạng thái friend request
      friendRequest.status = FriendRequestStatus.ACCEPTED;
      await manager.save(friendRequest);

      // Tìm profile của cả hai người
      let [senderProfile, receiverProfile] = await Promise.all([
        manager.findOne(UserProfileEntity, {
          where: { user: { id: friendRequest.sender.id } },
          relations: ['friends'],
        }),
        manager.findOne(UserProfileEntity, {
          where: { user: { id: friendRequest.receiver.id } },
          relations: ['friends'],
        }),
      ]);

      // Tạo profile mới nếu chưa tồn tại
      if (!senderProfile) {
        senderProfile = manager.create(UserProfileEntity, {
          user: friendRequest.sender,
          friends: [],
        });
        // Lưu profile mới để có ID
        await manager.save(senderProfile);
      }

      if (!receiverProfile) {
        receiverProfile = manager.create(UserProfileEntity, {
          user: friendRequest.receiver,
          friends: [],
        });
        // Lưu profile mới để có ID
        await manager.save(receiverProfile);
      }

      // Thêm vào danh sách bạn bè
      senderProfile.friends.push(friendRequest.receiver);
      receiverProfile.friends.push(friendRequest.sender);

      // Lưu các thay đổi
      await Promise.all([
        manager.save(senderProfile),
        manager.save(receiverProfile),
      ]);
    });
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

    try {
      await this.friendRequestRepository.delete({
        id: requestId,
        receiver: { id: userId },
        status: FriendRequestStatus.PENDING,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to reject friend request. Please try again later.',
      );
    }
  }

  async getPendingFriendRequests(
    userId: string,
    options: FriendRequestsDto,
  ): Promise<{
    data: FriendRequestsDto[];
    total: number;
    currentPage: number;
    totalPages: number;
  }> {
    const {
      page = options.page || 1,
      limit = 12,
      startDate,
      endDate,
    } = options;
    const skip = (page - 1) * limit;

    // Xây dựng điều kiện where
    const whereCondition: any = {
      receiver: { id: userId },
      status: FriendRequestStatus.PENDING,
    };

    // Thêm điều kiện lọc theo thời gian nếu có
    if (startDate && endDate) {
      whereCondition.createdAt = Between(
        new Date(startDate),
        new Date(endDate),
      );
    } else if (startDate) {
      whereCondition.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      whereCondition.createdAt = LessThanOrEqual(new Date(endDate));
    }

    // Đếm tổng số records
    const total = await this.friendRequestRepository.count({
      where: whereCondition,
    });

    // Lấy danh sách theo phân trang
    const pendingRequests = await this.friendRequestRepository.find({
      where: whereCondition,
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const requestsWithSenderProfile = await Promise.all(
      pendingRequests.map(async (request) => {
        const senderProfile = await this.userProfileRepository.findOne({
          where: { user: { id: request.sender.id } },
        });

        return {
          id: request.id,
          senderId: request.sender.id,
          name: request.sender.name,
          // fullName: request.sender.fullName,
          profile: senderProfile,
          createdAt: request.createdAt,
        } as FriendRequestsDto;
      }),
    );

    return {
      data: requestsWithSenderProfile,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Thêm phương thức đếm số lượng lời mời đang chờ
  async countPendingRequests(userId: string): Promise<number> {
    return this.friendRequestRepository.count({
      where: {
        receiver: { id: userId },
        status: FriendRequestStatus.PENDING,
      },
    });
  }

  async getSendFriendRequests(
    userId: string,
    options: GetFriendsDto,
  ): Promise<PaginatedResult<any>> {
    const pendingRequests = await this.friendRequestRepository.find({
      where: {
        sender: { id: userId },
        status: FriendRequestStatus.PENDING,
      },
      relations: {
        receiver: {
          profile: true,
        },
      },
    });

    const resonse = await Promise.all(
      pendingRequests.map(async (request) => {
        return {
          id: request.receiver.id,
          // firstName: request.receiver.firstName,
          // lastName: request.receiver.lastName,
          name: request.receiver.name,
          email: request.receiver.email,
          // role: request.receiver.role,
          // status: request.receiver.status,
          params: {},
          profile: {
            id: request.receiver.profile?.id,
            avatarUrl: request.receiver.profile?.avatarUrl,
            bio: request.receiver.profile?.bio,
            birthday: request.receiver.profile?.birthday,
            location: request.receiver.profile?.location,
          },
          // fullName: request.receiver.fullName,
        };
      }),
    );
    const dataProcessor = new DataProcessingHelper(resonse || []);

    return dataProcessor
      .search({
        search: options.search,
        searchFields: [
          'receiver.firstName',
          'receiver.lastName',
          'receiver.fullName',
          'receiver.email',
          'receiver.profile.location',
          'receiver.profile.bio',
        ],
      })
      .sort({
        sortBy: options.sortBy,
        orderBy: options.orderBy,
      })
      .paginate({
        page: options.page || 1,
        limit: options.limit || 12,
      });
  }

  async deleteSendFriendRequests(
    requestId: string,
    userId: string,
  ): Promise<void> {
    const friendRequest = await this.friendRequestRepository.findOne({
      where: {
        id: requestId,
        sender: { id: userId },
        status: FriendRequestStatus.PENDING,
      },
    });

    if (!friendRequest) {
      throw new NotFoundException(
        'Friend request not found or you do not have permission to reject it',
      );
    }

    try {
      await this.friendRequestRepository.delete({
        id: requestId,
        sender: { id: userId },
        status: FriendRequestStatus.PENDING,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to reject friend request. Please try again later.',
      );
    }
  }

  async getFriends(
    userId: string,
    options: GetFriendsDto,
  ): Promise<PaginatedResult<UserEntity>> {
    const profile = await this.userProfileRepository.findOne({
      where: { user: { id: userId } },
      relations: {
        user: true,
        friends: {
          profile: true,
        },
      },
      select: {
        id: true,
        user: {
          id: true,
        },
        friends: {
          id: true,
          // firstName: true,
          // lastName: true,
          name: true,
          email: true,
          // status: true,
          profile: {
            id: true,
            avatarUrl: true,
            location: true,
            bio: true,
            birthday: true,
          },
        },
      },
    });

    const dataProcessor = new DataProcessingHelper(profile?.friends || []);

    return dataProcessor
      .search({
        search: options.search,
        searchFields: [
          'firstName',
          'lastName',
          'fullName',
          'email',
          'profile.location',
          'profile.bio',
        ],
      })
      .sort({
        sortBy: options.sortBy,
        orderBy: options.orderBy,
      })
      .paginate({
        page: options.page || 1,
        limit: options.limit || 12,
      });
  }
}
