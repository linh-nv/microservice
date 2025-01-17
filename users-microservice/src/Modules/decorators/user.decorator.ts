import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtStrategy } from '../auth/guard/jwt.strategy';

export const UserId = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return JwtStrategy.getPayload(request.headers)['id'];
  },
);
