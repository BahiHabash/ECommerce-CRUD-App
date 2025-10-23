import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './review.entity';
import { UserService } from 'src/user/user.service';
import { ProductService } from 'src/product/product.service';
import { Repository } from 'typeorm';
import { CreateReviewDto } from './dtos/create-review.dto';
import { UpdateReviewDto } from './dtos/update-review.dto';
import type { JWTPayloadType } from 'src/common/utils/types';
import { UserType } from 'src/common/utils/enums';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
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
    const review: Review = this.reviewRepository.create({
      ...body,
      user: await this.userService.getOne(userId),
      product: await this.productService.getOne(productId),
    });

    return await this.reviewRepository.save(review);
  }

  /**
   * Get All Reviews
   * @returns All Reviews Stored in the db
   */
  async getAll(): Promise<Review[]> {
    return await this.reviewRepository.find({
      relations: { user: true, product: true },
    });
  }

  /**
   * Get a Review
   * @param id id of target review
   * @returns All Reviews Stored in the db
   */
  async getOne(id: number): Promise<Review> {
    const review = await this.reviewRepository.findOne({
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
      throw new UnauthorizedException(
        `user with id ${userId} is not authorized to update that reveiw.`,
      );
    }
    let newReview: Review = this.reviewRepository.merge(review, newReviewDto);

    newReview = await this.reviewRepository.save(newReview);

    return newReview;
  }

  /**
   * Update a review
   * @param reviewId id of the review to be updated
   * @param userId id of the user trying to update the review
   * @returns Then new updated Review
   */
  async delete(reviewId: number, userPayload: JWTPayloadType): Promise<void> {
    const review: Review = await this.getOne(reviewId);

    if (
      userPayload.type !== UserType.ADMIN &&
      userPayload.userId !== review?.user?.id
    ) {
      throw new UnauthorizedException(
        `This User is not authorized to update that reveiw.`,
      );
    }

    await this.reviewRepository.delete({ id: reviewId });
  }
}
