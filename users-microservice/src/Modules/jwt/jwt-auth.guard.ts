import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    // Xử lý các lỗi tương tự như middleware trong Laravel
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token is Expired');
      } else if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Token is Invalid');
      } else {
        throw new UnauthorizedException('Authorization Token not found');
      }
    }
    return user;
  }
}
