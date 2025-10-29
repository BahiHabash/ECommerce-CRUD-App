import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { UserPayload } from 'src/user/decorators/user-payload.decorator';
import { CreateReviewDto } from './dtos/create-review.dto';
import { UpdateReviewDto } from './dtos/update-review.dto';
import { ReviewSerializeResponseInterceptor } from './interceptors/review-serialize-response.interceptor';
import type { JWTPayloadType } from 'src/utils/types';

@Controller('/api/review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post(':productId')
  @UseGuards(AuthGuard)
  @UseInterceptors(ReviewSerializeResponseInterceptor)
  createReview(
    @Param('productId', ParseIntPipe) producId: number,
    @Body() body: CreateReviewDto,
    @UserPayload() userPayload: JWTPayloadType,
  ) {
    return this.reviewService.createOne(producId, body, userPayload.userId);
  }

  @Get()
  @UseGuards(AuthGuard)
  @UseInterceptors(ReviewSerializeResponseInterceptor)
  getAllReviews() {
    return this.reviewService.getAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(ReviewSerializeResponseInterceptor)
  getReview(@Param('id', ParseIntPipe) id: number) {
    return this.reviewService.getOne(id);
  }

  @Patch(':reviewId')
  @UseGuards(AuthGuard)
  @UseInterceptors(ReviewSerializeResponseInterceptor)
  updateReview(
    @Body() reviewDto: UpdateReviewDto,
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @UserPayload() userPayload: JWTPayloadType,
  ) {
    return this.reviewService.update(reviewId, userPayload.userId, reviewDto);
  }

  @Delete(':reviewId')
  @UseGuards(AuthGuard)
  deleteReview(
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @UserPayload() userPayload: JWTPayloadType,
  ) {
    return this.reviewService.delete(reviewId, userPayload);
  }
}
