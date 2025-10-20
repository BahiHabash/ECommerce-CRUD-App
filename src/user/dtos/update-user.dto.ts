import { IsNotEmpty, Length, IsString, IsOptional } from 'class-validator';
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from 'src/utils/constant';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH)
  password?: string;
}
