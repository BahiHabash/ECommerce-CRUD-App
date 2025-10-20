import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JWTPayloadType } from 'src/utils/types';
import { CURRENT_USER_KEY } from 'src/utils/constant';
import { Reflector } from '@nestjs/core';
import type { UserType } from 'src/utils/enums';

@Injectable()
export class AuthRolesGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles: UserType[] = this.reflector.getAllAndOverride('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles?.length) return false;

    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(
        'Authorization token missing. Please provide a valid Bearer token.',
      );
    }

    try {
      const payload: JWTPayloadType = await this.jwtService.verifyAsync(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      });

      if (!roles.includes(payload.type)) {
        throw new ForbiddenException(
          'Insufficient permissions. You do not have access to this resource.',
        );
      }

      request[CURRENT_USER_KEY] = payload;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired token. Please log in again.',
      );
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
