import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from 'src/common/utils/constant';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH)
  @IsString()
  @IsNotEmpty()
  password: string;
}
