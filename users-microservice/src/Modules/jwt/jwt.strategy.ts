import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Kiểm tra payload của token từ Laravel
    // Cấu trúc payload phải giống với cấu trúc từ Laravel
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    // Trả về thông tin user từ payload
    return {
      id: payload.sub,
      email: payload.email,
      // Thêm các trường khác nếu cần
    };
  }
}
