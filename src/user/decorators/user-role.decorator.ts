import { SetMetadata } from '@nestjs/common';
import type { UserRole } from 'src/utils/enums';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
