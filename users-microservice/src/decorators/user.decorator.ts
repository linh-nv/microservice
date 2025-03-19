import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtStrategy } from '../Modules/auth/guard/jwt.strategy';

export const UserId = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    console.log(request.headers);
    console.log(JwtStrategy.getPayload(request.headers));
    return JwtStrategy.getPayload(request.headers)['id'];
  },
);
