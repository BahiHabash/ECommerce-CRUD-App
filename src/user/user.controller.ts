import {
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Controller,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UserPayload } from './decorators/user-payload.decorator';
import { Roles } from './decorators/user-role.decorator';
import { UserRoleEnum } from 'src/utils/enums';
import { AuthRolesGuard } from '../auth/guards/auth-roles.guard';
import { UpdateUserDto } from './dtos/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import type { JWTPayloadType } from 'src/utils/types';

@Controller('api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(UserRoleEnum.ADMIN)
  @UseGuards(AuthRolesGuard)
  getAllUsers() {
    return this.userService.getAll();
  }

  @Get('current-user')
  @UseGuards(AuthGuard)
  getCurrentUser(@UserPayload() userPayload: JWTPayloadType) {
    return this.userService.getOne(userPayload.userId);
  }

  @Patch()
  @UseGuards(AuthGuard)
  updateUser(
    @Body() body: UpdateUserDto,
    @UserPayload() userPayload: JWTPayloadType,
  ) {
    return this.userService.update(userPayload.userId, body);
  }

  @Post('profile-image')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  setProfileImage(
    @UploadedFile('file') file: Express.Multer.File,
    @UserPayload() userPayload: JWTPayloadType,
  ) {
    if (!file) throw new BadRequestException(`No image uploaded.`);
    return this.userService.setProfileImage(userPayload.userId, file.filename);
  }

  @Get('profile-image/:userId')
  @UseGuards(AuthGuard)
  getProfileImage(
    @Param('userId', ParseIntPipe) userId: number,
    @Res() res: Response,
  ) {
    return this.userService.getProfileImage(userId, res);
  }

  @Delete('profile-image')
  @UseGuards(AuthGuard)
  removeProfileImage(@UserPayload() userPayload: JWTPayloadType) {
    return this.userService.removeProfileImage(userPayload.userId);
  }

  @Get(':targetUserId')
  @UseGuards(AuthGuard)
  getUser(@Param('targetUserId', ParseIntPipe) targetUserId: number) {
    return this.userService.getOne(targetUserId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @UserPayload() userPayload: JWTPayloadType,
  ) {
    return this.userService.delete(id, userPayload);
  }
}
