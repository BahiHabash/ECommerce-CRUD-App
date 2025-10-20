import type { UserType } from './enums';

export type JWTPayloadType = {
  userId: number;
  type: UserType;
};

export type AccessTokenType = {
  accessToken: string;
};
