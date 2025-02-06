import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfileEntity } from './entities/user-profile.entities';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import CreateUserProfileDto from './dto/create-user-profile.dto';

@Injectable()
export class UserProfileService {
  constructor(
    @InjectRepository(UserProfileEntity)
    private readonly userProfileRepository: Repository<UserProfileEntity>,
  ) {}

  async create(
    createUserProfileDto: CreateUserProfileDto,
    userId: string,
  ): Promise<UserProfileEntity> {
    // Tạo một instance mới của profile
    const userProfile = this.userProfileRepository.create({
      ...createUserProfileDto,
      user: { id: userId },
    });

    // Lưu vào database
    return await this.userProfileRepository.save(userProfile);
  }

  async findAll(): Promise<UserProfileEntity[]> {
    // Lấy tất cả profiles kèm theo thông tin user
    return await this.userProfileRepository.find({
      relations: ['user'],
      where: { deletedAt: null }, // Chỉ lấy những profile chưa bị xóa mềm
    });
  }

  async findOne(id: string): Promise<UserProfileEntity> {
    const profile = await this.userProfileRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['user', 'friends'],
    });

    if (!profile) {
      throw new NotFoundException(`Profile with ID "${id}" not found`);
    }

    return profile;
  }

  async update(
    id: string,
    updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<UserProfileEntity> {
    // Kiểm tra profile tồn tại
    const profile = await this.findOne(id);

    // Cập nhật thông tin mới
    Object.assign(profile, updateUserProfileDto);

    // Lưu các thay đổi
    return await this.userProfileRepository.save(profile);
  }

  async softDelete(id: string): Promise<void> {
    // Kiểm tra profile tồn tại
    const profile = await this.findOne(id);

    // Thực hiện soft delete
    await this.userProfileRepository.softDelete(id);
  }
}
