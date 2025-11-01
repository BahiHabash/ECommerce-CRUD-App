import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from 'src/utils/constant';

/**
 * User provides their email to request a reset link.
 */
export class ForgetPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

/**
 * User provides the new password. The token is in the URL.
 */
export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH)
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH)
  newPasswordConfirm: string;
}

/**
 * User must provide their old password to set a new one.
 */
export class UpdatePasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  oldPassword: string;

  @IsNotEmpty()
  @IsString()
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH)
  newPassword: string;
}
