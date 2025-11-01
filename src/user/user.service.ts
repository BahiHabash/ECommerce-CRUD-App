import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { join } from 'node:path';
import { promises as fsPromises } from 'node:fs';
import { User } from './user.entity';
import { UserRole } from 'src/utils/enums';
import { JWTPayloadType } from 'src/utils/types';
import type { UpdateUserDto } from './dtos/update-user.dto';
import type { Response } from 'express';
import { existsSync as fsExistsSync } from 'node:fs';
import { UPLOADS_FOLDER_USER_PROFILE } from 'src/utils/constant';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Retrieve all users stored in the database.
   *
   * @returns A promise that resolves to an array of users.
   */
  async getAll(): Promise<User[]> {
    return await this.userRepo.find();
  }

  /**
   * Retrieve a single user by their unique identifier.
   *
   * @param id - The ID of the user to fetch.
   * @throws NotFoundException if the user does not exist.
   * @returns A promise that resolves to the user entity.
   */
  async getOne(id: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });

    if (!user) throw new NotFoundException('User not found.');

    return user;
  }

  /**
   * Update the details of an existing user.
   *
   * @param id - The ID of the user to update.
   * @param dto - The data transfer object containing updated user fields.
   * @throws NotFoundException if the user does not exist.
   * @returns A promise that resolves to the updated user entity.
   */
  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepo.preload({ id, ...dto });

    if (!user) throw new NotFoundException(`User with ID ${id} not found.`);

    return await this.userRepo.save(user);
  }

  /**
   * Delete a user account.
   *
   * @param targetUserId - The ID of the user to delete.
   * @param payload - The JWT payload of the currently authenticated user.
   * @throws ForbiddenException if a non-admin user attempts to delete another user's account.
   * @throws NotFoundException if the target user does not exist.
   * @returns A promise that resolves when the user has been successfully deleted.
   */
  async delete(targetUserId: number, payload: JWTPayloadType): Promise<void> {
    if (payload.role !== UserRole.ADMIN && payload.userId !== targetUserId) {
      throw new ForbiddenException(
        'You are not allowed to perform this action.',
      );
    }

    const user = await this.getOne(targetUserId);

    if (!user)
      throw new NotFoundException(`User with ID ${targetUserId} not found.`);

    if (user.profileImage)
      await this.removeProfileImageFromSystem(user.profileImage);

    await this.userRepo.remove(user);
  }

  /**
   * Assign or replace the user's profile image.
   *
   * If the user already has a profile image, the old one will be deleted before saving the new image.
   *
   * @param userId - The ID of the current user.
   * @param newProfileImage - The filename of the new profile image.
   * @returns A promise that resolves to the updated user entity.
   */
  async setProfileImage(
    userId: number,
    newProfileImage: string,
  ): Promise<User> {
    const user = await this.getOne(userId);

    if (user.profileImage) {
      await this.removeProfileImage(userId);
    }

    user.profileImage = newProfileImage;

    return await this.userRepo.save(user);
  }

  /**
   * Get the user's profile image.
   *
   * If the user already has a profile image, the old one will be deleted before saving the new image.
   *
   * @param userId - The ID of the current user.
   * @returns A promise that resolves to the updated user entity.
   */
  async getProfileImage(userId: number, res: Response) {
    // if no target user id provided, get profile photo of the current user
    const { profileImage } = await this.getOne(userId);

    if (!profileImage) {
      throw new NotFoundException('There is no profile image for that user');
    }

    const profileImagePath: string = join(
      process.cwd(),
      UPLOADS_FOLDER_USER_PROFILE,
      profileImage,
    );

    if (!fsExistsSync(profileImagePath)) {
      throw new NotFoundException('File not found');
    }

    return res.sendFile(profileImagePath);
  }

  /**
   * Remove the user's profile image from both the database and the filesystem.
   *
   * @param userId - The ID of the current user.
   * @param user - (Optional) A pre-fetched user entity to avoid redundant DB calls.
   * @throws BadRequestException if the user has no profile image.
   * @returns A promise that resolves to the updated user entity without a profile image.
   */
  async removeProfileImage(
    userId: number,
    user: User | undefined = undefined,
  ): Promise<User> {
    user = user ?? (await this.getOne(userId));

    if (!user.profileImage) {
      throw new BadRequestException('No profile image found for this user.');
    }

    await this.removeProfileImageFromSystem(user.profileImage);

    user.profileImage = null;

    return await this.userRepo.save(user);
  }

  /**
   * Helper method that safely removes a user's profile image from the filesystem.
   *
   * @param imageName - The filename of the image to delete.
   * @internal
   */
  private async removeProfileImageFromSystem(imageName: string): Promise<void> {
    const imagePath = join(
      process.cwd(),
      UPLOADS_FOLDER_USER_PROFILE,
      imageName,
    );

    try {
      await fsPromises.unlink(imagePath);
    } catch {
      console.error(`Failed to delete file: ${imageName}`);
      console.error(`File Path is: ${imagePath}`);
    }
  }
}
