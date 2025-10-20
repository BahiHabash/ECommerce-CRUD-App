import { Controller, Get } from '@nestjs/common';
import { ReviewService } from './review.service';

@Controller('/api/review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  getAllReviews() {
    return this.reviewService.getAll();
  }
}
