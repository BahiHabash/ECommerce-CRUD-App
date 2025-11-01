import type { UserRole } from './enums';

export type JWTPayloadType = {
  userId: number;
  role: UserRole;
  exp?: number;
  iat?: number;
};

export type RefreshAccessTokens = {
  refreshToken: string;
  accessToken: string;
};
