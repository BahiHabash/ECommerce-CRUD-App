import { SetMetadata } from '@nestjs/common';
import type { UserType } from 'src/common/utils/enums';

export const Roles = (...roles: UserType[]) => SetMetadata('roles', roles);
