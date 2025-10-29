import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { CURRENT_USER_KEY } from 'src/utils/constant';
import type { JWTPayloadType } from 'src/utils/types';

export const UserPayload = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request: Request = context.switchToHttp().getRequest();
    const payload = request[CURRENT_USER_KEY] as JWTPayloadType;
    return payload;
  },
);
