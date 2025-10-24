import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { JWTPayloadType } from 'src/common/utils/types';
import type { UpdateUserDto } from './dtos/update-user.dto';
import { UserType } from 'src/common/utils/enums';
import { PASSWORD_HASH_SALT_ROUNDS } from 'src/common/utils/constant';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Get all users stored in the db
   * @returns All users from the db
   */
  async getAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  /**
   * Get User by ID
   * @param id userId of current user
   * @returns the current logged-in user from the database
   */
  async getOne(id: number): Promise<User> {
    // Get user from the DB
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) throw new NotFoundException('This user not existed');

    return user;
  }

  /**
   * Update existed user data
   * @param id userId of current user
   * @param dto new user data
   * @returns the updated user data
   */
  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.preload({
      id,
      ...dto,
    });

    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    if (dto.password) {
      user.passwordHash = await bcrypt.hash(
        dto.password,
        PASSWORD_HASH_SALT_ROUNDS,
      );
    }

    return this.userRepository.save(user);
  }

  /**
   * Delete Current user
   * @param id id of the user to be deleted
   * @paylaod jwt-payload of the current logged-in user
   * @returns void
   */
  async delete(id: number, payload: JWTPayloadType): Promise<void> {
    // if the normal user tying to delete others
    if (payload.type !== UserType.ADMIN && payload.userId !== id)
      throw new ForbiddenException(
        'You are not allowed to perform that action',
      );

    const user: User = await this.getOne(payload.userId);

    if (!user)
      throw new NotFoundException(`User with id: ${payload.userId} not found`);

    await this.userRepository.remove(user);
  }
}
