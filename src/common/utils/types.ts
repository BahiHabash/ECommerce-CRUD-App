import type { UserRoleEnum } from './enums';

export type JWTPayloadType = {
  userId: number;
  role: UserRoleEnum;
  exp?: number;
  iat?: number;
};

export type RefreshAccessTokenType = {
  refreshToken: string;
  accessToken: string;
};
