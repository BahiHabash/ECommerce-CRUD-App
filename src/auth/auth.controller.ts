import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
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
import {
  ForgetPasswordDto,
  UpdatePasswordDto,
  ResetPasswordDto,
} from './dtos/password.dto';

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

  @Post('resend-email-verification')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  resendVerificationEmail(@UserPayload() userPayload: JWTPayloadType) {
    return this.authService.resendVerificationEmail(userPayload);
  }

  @Patch('password')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  updatePassword(
    @UserPayload() userPayload: JWTPayloadType,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.authService.updatePassword(
      userPayload.userId,
      updatePasswordDto,
    );
  }

  @Post('password/forget')
  @HttpCode(HttpStatus.OK)
  forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
    return this.authService.forgetPassword(forgetPasswordDto.email);
  }

  @Post('password/reset') // 'password/reset?token=...'
  @HttpCode(HttpStatus.OK)
  resetPassword(
    @Query('token') token: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    if (!token) {
      throw new BadRequestException('Invalid Token or URL');
    }
    return this.authService.resetPassword(token, resetPasswordDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto);
  }
}
