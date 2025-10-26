import { SetMetadata } from '@nestjs/common';
import type { UserRoleEnum } from 'src/common/utils/enums';

export const Roles = (...roles: UserRoleEnum[]) => SetMetadata('roles', roles);
