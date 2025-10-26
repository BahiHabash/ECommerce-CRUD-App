import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { LoginDto } from 'src/auth/dtos/login.dot';
import { RegisterDto } from 'src/auth/dtos/register.dto';
import { PASSWORD_HASH_SALT_ROUNDS } from 'src/common/utils/constant';
import { RefreshAccessTokenType, JWTPayloadType } from 'src/common/utils/types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Create new user
   * @param registerDto data for creating new user
   * @returns JWT (access token)
   */
  async register(registerDto: RegisterDto): Promise<RefreshAccessTokenType> {
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

    // 3. Never mutate the DTO — use a new object
    const newUser = this.userRepository.create({
      ...userData,
      passwordHash: await this.hashPassword(password),
    });

    // ✅ 4. Persist to DB
    const savedUser: User | null = await this.userRepository.save(newUser);

    const jwtPayload: JWTPayloadType = {
      userId: savedUser.id,
      role: savedUser.role,
    };

    const accessToken = await this.genearteAccessToken(jwtPayload);
    const refreshToken = await this.genearteRefreshToken(jwtPayload);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login User
   * @param loginDto data for loging in user account
   * @returns JWT Access Token
   */
  async login(loginDto: LoginDto): Promise<RefreshAccessTokenType> {
    const { email, password } = loginDto;
    const user: User | null = await this.userRepository.findOne({
      where: { email },
    });

    if (!user)
      throw new BadRequestException('Invalid Email or Password or both.');

    if (!(await this.comparePassword(password, user.passwordHash)))
      throw new BadRequestException('Invalid Email or Password or both.');

    const jwtPayload: JWTPayloadType = {
      userId: user.id,
      role: user.role,
    };

    const accessToken = await this.genearteAccessToken(jwtPayload);
    const refreshToken = await this.genearteRefreshToken(jwtPayload);

    return {
      refreshToken,
      accessToken,
    };
  }

  private async genearteAccessToken(payload: JWTPayloadType): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
    });
  }

  private async genearteRefreshToken(payload: JWTPayloadType): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    });
  }

  /**
   * Hash a plain-text password using bcrypt.
   */
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, PASSWORD_HASH_SALT_ROUNDS);
  }

  /**
   * Compare a plain-text password with a hashed one.
   */
  comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
