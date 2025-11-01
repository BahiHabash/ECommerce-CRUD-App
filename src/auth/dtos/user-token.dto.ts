import { IsEnum, IsString, IsDate, IsInt, IsNotEmpty } from 'class-validator';
import { TokenPurpose } from 'src/utils/enums';

export class UserTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsEnum(TokenPurpose)
  @IsNotEmpty()
  purpose: TokenPurpose;

  @IsDate()
  @IsNotEmpty()
  expiresAt: Date;

  @IsInt()
  @IsNotEmpty()
  userId: number;
}
