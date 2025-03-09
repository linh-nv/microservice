import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { UsersService } from '../users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/User';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(UserEntity) private repository: Repository<UserEntity>,
  ) {}

  async validateToken(token: string) {
    try {
      const tokenValue = token.startsWith('Bearer ') ? token.slice(7) : token;
      const jwtSecret = this.configService.get<string>('JWT_SECRET');

      const payload = jwt.verify(tokenValue, jwtSecret);

      const userId = payload.sub;
      const user = this.repository.findOne({ where: { id: userId } });

      return user;
    } catch (error) {
      return null;
    }
  }
}
