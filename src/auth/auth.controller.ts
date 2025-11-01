import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dtos/refresh.dto';
import { AuthGuard } from './guards/auth.guard';
import { UserPayload } from 'src/user/decorators/user-payload.decorator';
import type { JWTPayloadType } from 'src/utils/types';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login') // default is 201
  @HttpCode(HttpStatus.OK) // default is 200
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Get('verify-email') // verify-email?token=...
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is missing');
    }
    return this.authService.verifyEmail(token);
  }

  @UseGuards(AuthGuard)
  @Post('resend-email-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerificationEmail(@UserPayload() userPayload: JWTPayloadType) {
    await this.authService.resendVerificationEmail(userPayload);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto);
  }
}
