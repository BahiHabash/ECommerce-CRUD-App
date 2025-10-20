import { Injectable } from '@nestjs/common';

type ReviewType = { userId: number; productId: number; content: string };

@Injectable()
export class ReviewService {
  constructor() {}

  private reviews: ReviewType[] = [
    { userId: 1, productId: 1, content: 'very good.' },
  ];

  getAll() {
    return this.reviews;
  }
}
