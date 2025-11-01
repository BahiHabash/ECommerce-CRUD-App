import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './review.entity';
import { UserService } from 'src/user/user.service';
import { ProductService } from 'src/product/product.service';
import { Repository } from 'typeorm';
import { CreateReviewDto } from './dtos/create-review.dto';
import { UpdateReviewDto } from './dtos/update-review.dto';
import type { JWTPayloadType } from 'src/utils/types';
import { UserRole } from 'src/utils/enums';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    private readonly userService: UserService,

    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService,
  ) {}

  /**
   * Create a review on a product
   * @param productId id of the product which the review is belong
   * @param body review data
   * @param userId id of the user that creates the review
   * @returns the new created review
   */
  async createOne(
    productId: number,
    body: CreateReviewDto,
    userId: number,
  ): Promise<Review> {
    const review: Review = this.reviewRepo.create({
      ...body,
      user: await this.userService.getOne(userId),
      product: await this.productService.getOne(productId),
    });

    return await this.reviewRepo.save(review);
  }

  /**
   * Get All Reviews
   * @returns All Reviews Stored in the db
   */
  async getAll(): Promise<Review[]> {
    return await this.reviewRepo.find({
      relations: { user: true, product: true },
    });
  }

  /**
   * Get a Review
   * @param id id of target review
   * @returns a target review with the corresponding id
   */
  async getOne(id: number): Promise<Review> {
    const review = await this.reviewRepo.findOne({
      where: { id },
      relations: { user: true, product: true },
    });

    if (!review) {
      throw new NotFoundException(`No existed review with id: ${id}`);
    }

    return review;
  }

  /**
   * Update a review
   * @param reviewId id of the review to be updated
   * @param userId id of the user trying to update the review
   * @param reviewDto new review data
   * @returns Then new updated Review
   */
  async update(
    reviewId: number,
    userId: number,
    newReviewDto: UpdateReviewDto,
  ): Promise<Review> {
    const review: Review = await this.getOne(reviewId);

    if (userId !== review?.user?.id) {
      throw new ForbiddenException(
        `Access Denied, user with id ${userId} isn't allowed to update that reveiw.`,
      );
    }
    let newReview: Review = this.reviewRepo.merge(review, newReviewDto);

    newReview = await this.reviewRepo.save(newReview);

    return newReview;
  }

  /**
   * Delete a review
   * @param reviewId id of the review to be deleted
   * @param userPayload payload of the current logged-in user
   */
  async delete(reviewId: number, userPayload: JWTPayloadType): Promise<void> {
    const review: Review = await this.getOne(reviewId);

    if (
      userPayload.role !== UserRole.ADMIN &&
      userPayload.userId !== review?.user?.id
    ) {
      throw new ForbiddenException(
        `User with id: ${userPayload.userId} is not allowed to update that reveiw.`,
      );
    }

    await this.reviewRepo.delete({ id: reviewId });
  }
}
