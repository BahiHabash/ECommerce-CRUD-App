import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { MoreThan, Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { LoginDto } from 'src/auth/dtos/login.dto';
import { RegisterDto } from 'src/auth/dtos/register.dto';
import { PASSWORD_HASH_SALT_ROUNDS } from 'src/utils/constant';
import { RefreshAccessTokens, JWTPayloadType } from 'src/utils/types';
import { JWTType, TokenPurpose, UserRole } from 'src/utils/enums';
import { UserService } from 'src/user/user.service';
import { RefreshTokenDto } from './dtos/refresh.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomBytes } from 'node:crypto';
import { UserToken } from './user-token.entity';
import { VERIFICATION_TOKEN_EXPIRES_IN } from 'src/utils/constant';
import type { UserTokenDto } from './dtos/user-token.dto';
import type { ResetPasswordDto, UpdatePasswordDto } from './dtos/password.dto';

/**
 * Service responsible for handling all user authentication logic,
 * including registration, login, and token generation/refreshing.
 */
@Injectable()
export class AuthService {
  /**
   * Initializes the AuthService with required dependencies.
   *
   * @param userRepo Injected TypeORM repository for the User entity.
   * @param configService Injected ConfigService for accessing environment variables.
   * @param userService Injected UserService for user-related business logic.
   * @param jwtService Injected JwtService for creating and verifying JSON Web Tokens.
   * @param eventEmitter Injected EventEmitter2 for listening for event and sending emails.
   */
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserToken)
    private readonly userTokenRepo: Repository<UserToken>,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Creates a new user account.
   * Checks if a user with the same email already exists, hashes the password,
   * saves the new user, creates a verification token, and fires an event to send the verification email.
   *
   * @param registerDto Data for creating the new user (e.g., email, password, name).
   * @returns {Promise<string>} return user created message and call for email verification.
   * @throws {BadRequestException} If a user with the provided email already exists.
   */
  async register(registerDto: RegisterDto) {
    const { password, ...userData } = registerDto;

    // 1. Check for existing user
    const existingUser = await this.userRepo.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new BadRequestException(
        `A user with email ${userData.email} already exists.`,
      );
    }

    // 2. Save user to DB
    const newUser: User = this.userRepo.create({
      ...userData,
      passwordHash: await this.hashPassword(password),
    });
    await this.userRepo.save(newUser);

    // generate email verification token and send it
    await this.handleUserEmailVerification(newUser);
  }

  /**
   * Authenticates a user and provides a new set of tokens.
   * Finds the user by email and validates their password.
   *
   * @param loginDto User login credentials (email and password).
   * @returns {Promise<RefreshAccessTokens>} An object containing the `accessToken` and `refreshToken`.
   * @throws {BadRequestException} If the email is not found or the password does not match.
   */
  async login(loginDto: LoginDto): Promise<RefreshAccessTokens> {
    const { email, password } = loginDto;
    const user: User | null = await this.userRepo.findOne({
      where: { email },
      select: ['passwordHash', 'id', 'role'],
    });

    if (!user || !(await this.comparePassword(password, user.passwordHash)))
      throw new BadRequestException('Invalid Email or Password or both.');

    // Fire Event to (send email)
    this.eventEmitter.emit('user.loggedin', email);

    return await this.generateRefreshAccessTokens(user.id, user.role);
  }

  /**
   * Verifies a user's email via a token.
   * If the token is valid, it marks the user as verified,
   * issues new auth tokens, and deletes the verification token.
   *
   * @param token The email verification token from the URL.
   * @returns {Promise<RefreshAccessTokens>} An object with new tokens.
   * @throws {UnauthorizedException} If the token is invalid or expired.
   */
  async verifyEmail(token: string): Promise<RefreshAccessTokens> {
    const userToken: UserToken | null = await this.userTokenRepo.findOne({
      where: {
        token: token,
        purpose: TokenPurpose.EMAIL_VERIFICATION,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'], // Load the user in the same query
    });

    if (!userToken) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Mark and save user as verified
    userToken.user.isAccountVerified = true;
    const user: User = await this.userRepo.save(userToken.user);

    // Delete the single-use verification token
    await this.userTokenRepo.remove(userToken);

    // Return new tokens for an immediate log-in experience
    return this.generateRefreshAccessTokens(user.id, user.role);
  }

  /**
   * Resend Email Verification Token to User Email
   * check for user and if existed and not verified generate, save and send token via email
   * @param userPayload jwt user payload
   */
  async resendVerificationEmail(userPayload: JWTPayloadType) {
    const user: User = await this.userService.getOne(userPayload.userId);

    if (user.isAccountVerified) {
      throw new BadRequestException('User is Already Verified');
    }

    await this.handleUserEmailVerification(user);
  }

  /**
   * Allows a logged-in user to change their password by providing their old password.
   * @param userId userId of the current loged-in user
   * @param updatePasswordDto
   */
  async updatePassword(
    userId: number,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    // 1. Find the user and explicitly select the passwordHash
    const { email, oldPassword, newPassword } = updatePasswordDto;
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id AND user.email = :email', {
        id: userId,
        email: email,
      })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Check if old password is correct
    const isPasswordMatch = await this.comparePassword(
      oldPassword,
      user.passwordHash,
    );

    if (!isPasswordMatch) {
      throw new BadRequestException('Incorrect old password.');
    }

    // 3. Hash and save new password
    user.passwordHash = await this.hashPassword(newPassword); // subcriber will run
    await this.userRepo.save(user);

    return { message: 'Password changed successfully.' };
  }

  /**
   * Finds a user by email and sends a password reset link.
   *
   * @param email the user email
   * @returns {Promise<{ message: string }>} General Message Response
   */
  async forgetPassword(email: string): Promise<{ message: string }> {
    const GENERAL_MESSAGE: string =
      'If an account with this email exists, a password reset link has been sent.';
    const user = await this.userRepo.findOne({ where: { email } });

    // 1. If no user, just return success to prevent email enumeration
    if (!user) {
      return { message: GENERAL_MESSAGE };
    }

    // 2. Invalidate any old password reset tokens
    await this.userTokenRepo.delete({
      userId: user.id,
      purpose: TokenPurpose.PASSWORD_RESET,
    });

    // 3. Generate new token and URL
    const { url, token } = this.generateVerificationLink('password/reset');
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRES_IN);

    // 4. Save the new token
    const newUserToken = this.userTokenRepo.create({
      token,
      purpose: TokenPurpose.PASSWORD_RESET,
      expiresAt,
      userId: user.id,
    });
    await this.userTokenRepo.save(newUserToken);

    // 5. Fire event to send email
    this.eventEmitter.emit('auth.passwordResetRequest', {
      url,
      email: user.email,
      username: user.username,
    });

    return { message: GENERAL_MESSAGE };
  }

  /**
   * Verifies a password reset token, hashes the new password, and updates the user.
   *
   * Logs the user in by returning new tokens upon success.
   * @param token reset-password-token that sent to his email
   * @param resetPasswordDto (e.g: newPassword, newPasswordConfirm)
   * @returns {Promise<RefreshAccessTokens>} object {refreshToken, accessToken}
   */
  async resetPassword(
    token: string,
    resetPasswordDto: ResetPasswordDto,
  ): Promise<RefreshAccessTokens> {
    const { newPassword, newPasswordConfirm } = resetPasswordDto;

    // if new passwords don't match
    if (newPassword !== newPasswordConfirm) {
      throw new BadRequestException(
        'newPassword and newPasswordConfirm do not matches',
      );
    }

    // 1. Find the token
    const userToken = await this.userTokenRepo.findOne({
      where: {
        token: token,
        purpose: TokenPurpose.PASSWORD_RESET,
        expiresAt: MoreThan(new Date()), // Check that it's not expired
      },
      relations: ['user'],
    });

    if (!userToken) {
      throw new BadRequestException('Invalid or expired password reset token.');
    }

    // 2. Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // 3. Update user
    const user = userToken.user;
    user.passwordHash = newPasswordHash;
    await this.userRepo.save(user);

    // 4. Delete the single-use token
    await this.userTokenRepo.remove(userToken);

    // 5. Log the user in by issuing new tokens
    return this.generateRefreshAccessTokens(user.id, user.role);
  }

  /**
   * Generates a new access token and a new rotated refresh token.
   * This method validates the provided refresh token, verifies the user still exists,
   * and then issues a fresh pair of tokens.
   *
   * @param refreshTokenDto An object containing the existing JWT refresh token.
   * @returns {Promise<RefreshAccessTokens>} An object containing the new `accessToken` and `refreshToken`.
   * @throws {UnauthorizedException} If the refresh token is invalid or expired.
   */
  async refreshTokens(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<RefreshAccessTokens> {
    // verify refresh token
    let payload: JWTPayloadType;
    try {
      payload = await this.jwtService.verifyAsync(
        refreshTokenDto.refreshToken,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException(
        'Invalid or Expired JWT Token, Please log in again.',
      );
    }

    // get user to ensure if existed
    const user: User = await this.userService.getOne(payload.userId);

    // --- Security Check ---
    if (!payload.iat)
      throw new UnauthorizedException('Invalid token: missing `iat` claim.');

    const tokenIssuedAt: Date = new Date(payload.iat * 1000);

    // If lastSecurityUpdate is newer than the token's issue date, this token is old.
    if (user.lastSecurityUpdate > tokenIssuedAt) {
      throw new UnauthorizedException(
        'Token has been invalidated due to a security update. Please log in again.',
      );
    }

    return this.generateRefreshAccessTokens(user.id, user.role);
  }

  /**
   * Hashes a plain-text password using bcrypt.
   *
   * @param password The plain-text password to hash.
   * @returns {Promise<string>} The resulting password hash.
   */
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, PASSWORD_HASH_SALT_ROUNDS);
  }

  /**
   * Compares a plain-text password against a stored bcrypt hash.
   *
   * @param password The plain-text password to check.
   * @param hash The stored hash to compare against.
   * @returns {Promise<boolean>} True if the password matches the hash, false otherwise.
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * @private
   * Private helper method to generate both access and refresh tokens from a user payload.
   * This centralizes the token creation logic, ensuring consistent payloads and settings.
   *
   * @param userId The core userId to include in the JWTs.
   * @param role The core userRole to include in the JWTs.
   * @returns {Promise<RefreshAccessTokens>} An object containing the new `accessToken` and `refreshToken`.
   */
  private async generateRefreshAccessTokens(
    userId: number,
    role: UserRole,
  ): Promise<RefreshAccessTokens> {
    const payload = {
      userId,
      role,
    };

    // generating access token
    const accessToken = await this.jwtService.signAsync(
      { ...payload, jwtType: JWTType.ACCESS },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
      },
    );

    // generating refresh token
    const refreshToken = await this.jwtService.signAsync(
      { ...payload, jwtType: JWTType.REFRESH },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      },
    );

    return { accessToken, refreshToken };
  }

  /**
   * Generate and save user's email verification token.
   * Trigger to sendEmailVerification event
   * @param user The User that email verification token belongs to.
   * @returns {void}.
   */
  private async handleUserEmailVerification(user: User) {
    // Generate verification token and URL
    const { url, token } = this.generateVerificationLink('verify-email');

    // Create and validate the UserToken DTO
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRES_IN);
    const userTokenDto: UserTokenDto = {
      token: token,
      purpose: TokenPurpose.EMAIL_VERIFICATION,
      userId: user.id,
      expiresAt: expiresAt,
    };

    // 5. Save the token
    const userToken: UserToken = this.userTokenRepo.create(userTokenDto);
    await this.userTokenRepo.save(userToken);

    // 6. Fire event to (send email for verification)
    this.eventEmitter.emit('auth.verificationEmail', {
      url,
      email: user.email,
      username: user.username,
    });
  }

  /**
   * @private
   * Generates a secure token and constructs its full verification URL.
   *
   * This helper is generic and can be used for:
   * - Email verification, Password reset or other token-based verification
   *
   * @param {string} route - The specific API route (e.g., 'verify-email', 'reset-password').
   * @returns {{ token: string, url: string }} An object containing:
   * - `token`: The raw token string (to be saved in the database).
   * - `url`: The full URL (to be sent in an email).
   */
  private generateVerificationLink(route: string): {
    token: string;
    url: string;
  } {
    const token: string = randomBytes(32).toString('hex');

    const baseUrl: string = this.configService.get<string>(
      'BASE_URL',
      'http://localhost:5050',
    );

    // e.g: http://localhost:3000/api/auth/verify-email?token=...
    const url: string = `${baseUrl}/api/auth/${route}?token=${token}`;

    return { token, url };
  }
}
