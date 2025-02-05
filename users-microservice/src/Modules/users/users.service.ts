import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DeviceSessionsService } from '../device-sessions/device-sessions.service';
import { Repository } from 'typeorm';
import LoginDto from './dtos/login.dto';
import SignUpDto from './dtos/sign-up.dto';
import { UserEntity } from './entities/User';
import { LoginMetadata } from './users.controller';
import { RoleType, UserStatus } from 'src/Shared/enums';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity) private repository: Repository<UserEntity>,
    private deviceSessionsService: DeviceSessionsService,
  ) {}
  async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }

  async login(loginDto: LoginDto, metaData: LoginMetadata) {
    const { email, password } = loginDto;
    const user = await this.repository.findOne({
      where: { email },
    });
    if (
      !user ||
      user.password !== (await this.hashPassword(password, user.salt))
    ) {
      throw new NotFoundException('Email or password incorect');
    } else {
      return await this.deviceSessionsService.handleDeviceSession(
        user.id,
        metaData,
      );
    }
  }

  async signUp(signUpDto: SignUpDto) {
    const { email, password, firstName, lastName, role, status, params } =
      signUpDto;

    if (await this.repository.count({ where: { email } })) {
      throw new ConflictException(
        'This email address is already used. Try a different email address.',
      );
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await this.hashPassword(password, salt);

    const newUser = new UserEntity();
    newUser.email = email;
    newUser.firstName = firstName;
    newUser.lastName = lastName;
    newUser.password = hashedPassword;
    newUser.salt = salt;
    newUser.role = role as RoleType;
    newUser.status = status as UserStatus;
    newUser.params = params || {};

    try {
      await this.repository.save(newUser);
      return {
        message: 'User created successfully',
      };
    } catch (e) {
      console.error('Error while saving user:', e);
      throw new InternalServerErrorException(
        'An error occurred while creating the user.',
      );
    }
  }

  async me(id: string) {
    return this.repository.findOne({ where: { id } });
  }
}
