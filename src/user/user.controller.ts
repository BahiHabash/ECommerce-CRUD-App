import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { JWTPayloadType } from 'src/common/utils/types';
import { UserPayload } from './decorators/user-payload.decorator';
import { Roles } from './decorators/user-role.decorator';
import { UserRoleEnum } from 'src/common/utils/enums';
import { AuthRolesGuard } from '../auth/guards/auth-roles.guard';
import { UpdateUserDto } from './dtos/update-user.dto';
import { LoggerInterceptor } from 'src/common/utils/interceptors/logger.interceptor';

@Controller('api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('current-user')
  @UseGuards(AuthGuard)
  getCurrentUser(@UserPayload() userPayload: JWTPayloadType) {
    return this.userService.getOne(userPayload.userId);
  }

  @Get()
  @Roles(UserRoleEnum.ADMIN)
  @UseGuards(AuthRolesGuard)
  @UseInterceptors(LoggerInterceptor)
  getAllUsers() {
    return this.userService.getAll();
  }

  @Patch()
  @UseGuards(AuthGuard)
  updateUser(
    @Body() body: UpdateUserDto,
    @UserPayload() userPayload: JWTPayloadType,
  ) {
    return this.userService.update(userPayload.userId, body);
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
