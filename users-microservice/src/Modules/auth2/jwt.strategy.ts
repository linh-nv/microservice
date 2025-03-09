import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/User';
import { Repository } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(UserEntity) private repository: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Đây là nơi chúng ta xác thực token
    // Payload.sub chứa id người dùng theo như yêu cầu
    const userId = payload.sub;
    
    // Tìm người dùng trong cơ sở dữ liệu
    const user = await this.repository.findOneById(userId);
    
    // Nếu không tìm thấy user, ném lỗi UnauthorizedException
    if (!user) {
      throw new UnauthorizedException('Người dùng không hợp lệ');
    }
    
    // Trả về thông tin user, thông tin này sẽ được gắn vào request
    return user;
  }
}