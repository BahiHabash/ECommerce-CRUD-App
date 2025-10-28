import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { LoginDto } from 'src/auth/dtos/login.dto';
import { RegisterDto } from 'src/auth/dtos/register.dto';
import { PASSWORD_HASH_SALT_ROUNDS } from 'src/common/utils/constant';
import { AuthResponseDto, JWTPayloadType } from 'src/common/utils/types';
import { jwtTypeEnum, UserRoleEnum } from 'src/common/utils/enums';
import { UserService } from 'src/user/user.service';
import { RefreshTokenDto } from './dtos/refresh.dto';

/**
 * Service responsible for handling all user authentication logic,
 * including registration, login, and token generation/refreshing.
 */
@Injectable()
export class AuthService {
  /**
   * Initializes the AuthService with required dependencies.
   *
   * @param userRepository Injected TypeORM repository for the User entity.
   * @param configService Injected ConfigService for accessing environment variables.
   * @param userService Injected UserService for user-related business logic.
   * @param jwtService Injected JwtService for creating and verifying JSON Web Tokens.
   */
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Creates a new user account.
   * Checks if a user with the same email already exists, hashes the password,
   * saves the new user to the database, and returns a new set of tokens.
   *
   * @param registerDto Data for creating the new user (e.g., email, password, name).
   * @returns {Promise<AuthResponseDto>} An object containing the `accessToken` and `refreshToken`.
   * @throws {BadRequestException} If a user with the provided email already exists.
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { password, ...userData } = registerDto;

    // 1. Check for existing user
    const existingUser = await this.userRepository.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new BadRequestException(
        `A user with email ${userData.email} already exists.`,
      );
    }

    const newUser = this.userRepository.create({
      ...userData,
      passwordHash: await this.hashPassword(password),
    });

    // save user to DB
    const savedUser: User | null = await this.userRepository.save(newUser);

    return await this.generateRefreshAccessTokens(savedUser.id, savedUser.role);
  }

  /**
   * Authenticates a user and provides a new set of tokens.
   * Finds the user by email and validates their password.
   *
   * @param loginDto User login credentials (email and password).
   * @returns {Promise<AuthResponseDto>} An object containing the `accessToken` and `refreshToken`.
   * @throws {BadRequestException} If the email is not found or the password does not match.
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;
    const user: User | null = await this.userRepository.findOne({
      where: { email },
      select: ['passwordHash', 'id', 'role'],
    });

    if (!user || !(await this.comparePassword(password, user.passwordHash)))
      throw new BadRequestException('Invalid Email or Password or both.');

    return await this.generateRefreshAccessTokens(user.id, user.role);
  }

  /**
   * Generates a new access token and a new rotated refresh token.
   * This method validates the provided refresh token, verifies the user still exists,
   * and then issues a fresh pair of tokens.
   *
   * @param refreshTokenDto An object containing the existing JWT refresh token.
   * @returns {Promise<AuthResponseDto>} An object containing the new `accessToken` and `refreshToken`.
   * @throws {UnauthorizedException} If the refresh token is invalid or expired.
   */
  async refreshTokens(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
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
   * @returns {Promise<AuthResponseDto>} An object containing the new `accessToken` and `refreshToken`.
   */
  private async generateRefreshAccessTokens(
    userId: number,
    role: UserRoleEnum,
  ): Promise<AuthResponseDto> {
    const payload = {
      userId,
      role,
    };

    // generating access token
    const accessToken = await this.jwtService.signAsync(
      { ...payload, jwtType: jwtTypeEnum.ACCESS },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
      },
    );

    // generating refresh token
    const refreshToken = await this.jwtService.signAsync(
      { ...payload, jwtType: jwtTypeEnum.REFRESH },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      },
    );

    return { accessToken, refreshToken };
  }
}
